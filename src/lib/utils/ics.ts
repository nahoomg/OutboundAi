/**
 * Generate iCalendar (.ics) format for meeting invites
 */

export interface MeetingDetails {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    organizerEmail: string;
    organizerName: string;
    attendeeEmail: string;
    attendeeName: string;
    uid?: string;
}

export function generateICS(meeting: MeetingDetails): string {
    const uid = meeting.uid || `${Date.now()}@outboundai.com`;

    // Format dates to iCal format: YYYYMMDDTHHMMSSZ
    const formatDate = (date: Date): string => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//OutboundAI//Meeting Scheduler//EN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(meeting.startTime)}`,
        `DTEND:${formatDate(meeting.endTime)}`,
        `SUMMARY:${meeting.title}`,
        meeting.description ? `DESCRIPTION:${meeting.description.replace(/\n/g, '\\n')}` : '',
        meeting.location ? `LOCATION:${meeting.location}` : '',
        `ORGANIZER;CN=${meeting.organizerName}:mailto:${meeting.organizerEmail}`,
        `ATTENDEE;CN=${meeting.attendeeName};RSVP=TRUE:mailto:${meeting.attendeeEmail}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n');

    return icsContent;
}

/**
 * Create a buffer from ICS content for email attachment
 */
export function createICSBuffer(icsContent: string): Buffer {
    return Buffer.from(icsContent, 'utf-8');
}
