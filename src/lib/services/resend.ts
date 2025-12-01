const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@nahom.tech';

const FORCE_SAFE_MODE = false;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface EmailOptions {
    to: string;
    from?: string;
    fromName?: string;
    subject: string;
    body: string;
    replyTo?: string;
    attachments?: Array<{
        filename: string;
        content: string;
        contentType?: string;
    }>;
}

function formatFromAddress(email: string, name?: string): string {
    if (name && name.trim()) {
        return `${name} <${email}>`;
    }
    return email;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendEmail(options: EmailOptions) {
    if (!RESEND_API_KEY) {
        return { success: false, error: 'Missing RESEND_API_KEY' };
    }

    let recipient = options.to;
    let subject = options.subject;
    const fromEmail = options.from || FROM_EMAIL;
    const fromAddress = formatFromAddress(fromEmail, options.fromName);

    if (FORCE_SAFE_MODE) {
        recipient = FROM_EMAIL;
        subject = `[TEST MODE] To: ${options.to} | ${options.subject}`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
        return { success: false, error: `Invalid recipient email: ${recipient}` };
    }

    const htmlBody = options.body.replace(/\n/g, '<br>');

    const requestBody = JSON.stringify({
        from: fromAddress,
        to: recipient,
        subject: subject,
        html: htmlBody,
        reply_to: fromEmail
    });

    let lastError: string = '';
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`
                },
                body: requestBody,
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.message || `API error: ${response.status}` };
            }

            const data = await response.json();
            return { success: true, id: data.id };

        } catch (error: any) {
            lastError = error.message || 'Unknown error';

            const isRetryable = error.name === 'AbortError' || 
                                lastError.includes('fetch failed') || 
                                lastError.includes('ETIMEDOUT') ||
                                lastError.includes('ECONNREFUSED') ||
                                lastError.includes('network');

            if (isRetryable && attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS * attempt);
                continue;
            }

            break;
        }
    }

    return { 
        success: false, 
        error: `Network error after ${MAX_RETRIES} attempts: ${lastError}. Please check your internet connection.` 
    };
}
