// Hunter.io API Integration
// Free tier: 25 searches/month

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const HUNTER_BASE_URL = 'https://api.hunter.io/v2';

export interface EmailPattern {
    pattern: string; // e.g., "{first}.{last}@domain.com"
    confidence: number; // 0-100
    emails: string[]; // Sample emails found
}

export interface EmailVerification {
    email: string;
    status: 'valid' | 'invalid' | 'risky' | 'unknown';
    score: number; // 0-100
}

let requestCount = 0;
const MAX_REQUESTS_PER_MONTH = 25;

/**
 * Find email pattern for a domain
 */
export async function findEmailPattern(domain: string): Promise<EmailPattern | null> {
    if (!HUNTER_API_KEY) {
        return null;
    }

    if (requestCount >= MAX_REQUESTS_PER_MONTH) {
        return null;
    }

    try {
        const url = `${HUNTER_BASE_URL}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Hunter.io API error: ${error.errors?.[0]?.details || response.statusText}`);
        }

        requestCount++;
        const data = await response.json() as { data: { pattern: string; pattern_confidence: number; emails: { value: string }[] } };

        if (!data.data || !data.data.pattern) {
            return null;
        }

        return {
            pattern: data.data.pattern,
            confidence: data.data.pattern_confidence || 0,
            emails: data.data.emails?.slice(0, 3).map((e: { value: string }) => e.value) || []
        };

    } catch (error: unknown) {
        return null;
    }
}

/**
 * Verify if an email is valid and deliverable
 */
export async function verifyEmail(email: string): Promise<EmailVerification> {
    if (!HUNTER_API_KEY) {
        return {
            email,
            status: 'unknown',
            score: 0
        };
    }

    if (requestCount >= MAX_REQUESTS_PER_MONTH) {
        return {
            email,
            status: 'unknown',
            score: 0
        };
    }

    try {
        const url = `${HUNTER_BASE_URL}/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER_API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Hunter.io verification failed: ${response.statusText}`);
        }

        requestCount++;
        const data = await response.json() as { data: { status: 'valid' | 'invalid' | 'risky' | 'unknown'; score: number } };

        return {
            email,
            status: data.data.status || 'unknown',
            score: data.data.score || 0
        };

    } catch (error: unknown) {
        return {
            email,
            status: 'unknown',
            score: 0
        };
    }
}

/**
 * Generate email from pattern
 */
export function generateEmailFromPattern(
    pattern: string,
    firstName: string,
    lastName: string
): string {
    return pattern
        .replace('{first}', firstName.toLowerCase())
        .replace('{last}', lastName.toLowerCase())
        .replace('{f}', firstName[0].toLowerCase())
        .replace('{l}', lastName[0].toLowerCase());
}
