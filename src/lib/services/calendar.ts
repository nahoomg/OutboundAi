import { google } from 'googleapis';
import { createServerClient } from '@/lib/supabase/server';

const CALENDAR_ID = 'primary';

export async function getUserCalendarClient(userId: string) {
    try {
        const supabase = await createServerClient();

        // Get user's session which contains provider tokens
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return null;
        }

        // Get provider token and refresh token from session
        const googleIdentity = user.identities?.find(identity => identity.provider === 'google');

        if (!googleIdentity) {
            return null;
        }

        // Get the session to access provider tokens
        const { data: { session } } = await supabase.auth.getSession();

        // Try to get tokens from session first
        let providerToken = session?.provider_token;
        let providerRefreshToken = session?.provider_refresh_token;

        // If no refresh token in session, get it from user_settings table
        if (!providerRefreshToken) {
            const { data: userSettings } = await supabase
                .from('user_settings')
                .select('google_refresh_token')
                .eq('user_id', userId)
                .single();

            if (userSettings?.google_refresh_token) {
                providerRefreshToken = userSettings.google_refresh_token;
            }
        }

        if (!providerToken && !providerRefreshToken) {
            return null;
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return null;
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

        oauth2Client.setCredentials({
            access_token: providerToken || undefined,
            refresh_token: providerRefreshToken,
        });

        if (!providerToken && providerRefreshToken) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                oauth2Client.setCredentials(credentials);
            } catch (refreshError: any) {
                if (refreshError.message?.includes('invalid_client') || refreshError.message?.includes('invalid_grant')) {
                    try {
                        await supabase
                            .from('user_settings')
                            .update({ google_refresh_token: null })
                            .eq('user_id', userId);
                    } catch (clearError) {}
                }
                return null;
            }
        }

        return google.calendar({ version: 'v3', auth: oauth2Client });

    } catch (error) {
        return null;
    }
}

export async function createMeeting(
    userId: string,
    leadEmail: string,
    leadName: string,
    startTime: string,
    duration: number = 30
): Promise<{ success: boolean; eventLink?: string; meetLink?: string; error?: string }> {
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const calendar = await getUserCalendarClient(userId);

            if (!calendar) {
                return {
                    success: false,
                    error: 'Unable to access calendar. Please reconnect your Google account.'
                };
            }

            const startDate = new Date(startTime);
            const endDate = new Date(startDate.getTime() + duration * 60000);

            const event = {
                summary: `Discovery Call - ${leadName}`,
                description: `OutboundAI Booking\n\nMeeting with ${leadName} from ${leadEmail}\n\nThis meeting was automatically scheduled by OutboundAI.`,
                start: {
                    dateTime: startDate.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
                },
                end: {
                    dateTime: endDate.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
                },
                attendees: [
                    { email: leadEmail }
                ],
                conferenceData: {
                    createRequest: {
                        requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 }
                    ]
                }
            };

            const response = await calendar.events.insert({
                calendarId: CALENDAR_ID,
                requestBody: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            });

            const eventData = response.data;
            const eventLink = eventData.htmlLink;
            const meetLink = eventData.hangoutLink || eventData.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;

            return {
                success: true,
                eventLink: eventLink || undefined,
                meetLink: meetLink || undefined
            };

        } catch (error: any) {
            const isTimeout = error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.message?.includes('timeout');
            
            if (isTimeout && attempt < maxRetries) {
                await new Promise(r => setTimeout(r, attempt * 2000));
                continue;
            }
            
            return {
                success: false,
                error: isTimeout 
                    ? 'Network timeout connecting to Google Calendar. Please check your internet and try again.'
                    : (error.message || 'Failed to create calendar event')
            };
        }
    }
    
    return { success: false, error: 'Failed after multiple retry attempts' };
}

export async function getAvailableSlots(
    userId: string,
    date: Date
): Promise<{ start: Date; end: Date }[]> {
    try {
        const calendar = await getUserCalendarClient(userId);

        if (!calendar) {
            return [];
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(9, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(17, 0, 0, 0);

        // Fetch busy times
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                items: [{ id: CALENDAR_ID }],
            },
        });

        const busySlots = response.data.calendars?.[CALENDAR_ID]?.busy || [];

        const availableSlots: { start: Date; end: Date }[] = [];
        let currentSlot = new Date(startOfDay);

        while (currentSlot < endOfDay) {
            const slotEnd = new Date(currentSlot.getTime() + 30 * 60000);

            const isBusy = busySlots.some(busy => {
                if (!busy.start || !busy.end) return false;
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return currentSlot < busyEnd && slotEnd > busyStart;
            });

            if (!isBusy) {
                availableSlots.push({
                    start: new Date(currentSlot),
                    end: slotEnd
                });
            }

            currentSlot = slotEnd;
        }

        return availableSlots;

    } catch (error) {
        return [];
    }
}

export async function createBooking(
    leadEmail: string,
    leadName: string,
    dateTime: string,
    duration: number = 30
): Promise<{ success: boolean; meetLink?: string; error?: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        return { success: false, error: "Calendar credentials missing" };
    }

    try {
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oAuth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const startDate = new Date(dateTime);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        const event = {
            summary: `Discovery Call with ${leadName}`,
            description: `OutboundAI Booking - Meeting with ${leadName} (${leadEmail})`,
            start: { dateTime: startDate.toISOString(), timeZone: 'UTC' },
            end: { dateTime: endDate.toISOString(), timeZone: 'UTC' },
            attendees: [{ email: leadEmail }],
            conferenceData: {
                createRequest: { requestId: `meet-${Date.now()}` }
            }
        };

        const res = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all'
        });

        const meetLink = res.data.hangoutLink || res.data.conferenceData?.entryPoints?.[0]?.uri;

        return {
            success: true,
            meetLink: meetLink || undefined
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create calendar event'
        };
    }
}
