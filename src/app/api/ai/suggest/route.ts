import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API key rotation with rate limit tracking
const keyUsageMap = new Map<string, { count: number; lastReset: number; blocked: boolean; blockedUntil: number }>();
const RPM_LIMIT = 10;
const RESET_WINDOW_MS = 60000;
const BLOCK_DURATION_MS = 300000; // 5 minutes

function getAllKeys(): string[] {
    const keysString = process.env.GEMINI_API_KEYS || '';
    const keys = keysString.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        const legacyKey = process.env.GEMINI_API_KEY;
        if (legacyKey) keys.push(legacyKey);
    }
    return keys;
}

function markKeyBlocked(key: string) {
    const now = Date.now();
    const usage = keyUsageMap.get(key) || { count: 0, lastReset: now, blocked: false, blockedUntil: 0 };
    usage.blocked = true;
    usage.blockedUntil = now + BLOCK_DURATION_MS;
    keyUsageMap.set(key, usage);
}

function getAvailableKey(excludeKeys: string[] = []): string | null {
    const keys = getAllKeys();
    if (keys.length === 0) return null;

    const now = Date.now();

    // Reset counters and unblock expired keys
    keyUsageMap.forEach((usage) => {
        if (now - usage.lastReset > RESET_WINDOW_MS) {
            usage.count = 0;
            usage.lastReset = now;
        }
        if (usage.blocked && now > usage.blockedUntil) {
            usage.blocked = false;
        }
    });

    // Find available key
    for (const key of keys) {
        if (excludeKeys.includes(key)) continue;
        const usage = keyUsageMap.get(key) || { count: 0, lastReset: now, blocked: false, blockedUntil: 0 };
        if (usage.blocked && now < usage.blockedUntil) continue;
        if (usage.count >= RPM_LIMIT) continue;

        usage.count++;
        keyUsageMap.set(key, usage);
        return key;
    }

    return null;
}

export async function POST(request: Request) {
    try {
        const keys = getAllKeys();
        if (keys.length === 0) {
            return NextResponse.json(
                { error: 'AI service not configured. Please add GEMINI_API_KEY to your environment variables.' },
                { status: 500 }
            );
        }

        const { leadName, companyName, lastMessage } = await request.json();

        if (!lastMessage) {
            return NextResponse.json(
                { error: 'Missing required field: lastMessage' },
                { status: 400 }
            );
        }

        const prompt = `
You are an expert sales representative assistant. Your goal is to draft a professional, concise, and persuasive reply to a lead.

**Context:**
- Lead Name: ${leadName || 'the lead'}
- Company: ${companyName || 'their company'}
- Last Message from Lead: "${lastMessage}"

**Instructions:**
1. Analyze the sentiment and intent of the lead's message.
2. Draft a reply that directly addresses their questions or concerns.
3. Keep it professional but conversational.
4. If they are interested, propose a clear next step (e.g., a call or meeting).
5. If they are asking for more info, provide a brief overview and offer to send details.
6. Keep the reply under 150 words.
7. Do NOT include placeholders like "[Your Name]" or "[Date]".
8. Output ONLY the email body text.

**Draft Reply:**
`;

        // Try with multiple API keys
        const triedKeys: string[] = [];
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            const apiKey = getAvailableKey(triedKeys);
            
            if (!apiKey) {
                break;
            }

            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                return NextResponse.json({ suggestion: text.trim() });

            } catch (error: any) {
                lastError = error;
                triedKeys.push(apiKey);

                const isRateLimit = error.status === 429 || 
                                   error.message?.includes('429') || 
                                   error.message?.includes('quota');

                if (isRateLimit) {
                    markKeyBlocked(apiKey);
                    continue;
                }

                // Non-rate-limit error, don't retry
                throw error;
            }
        }

        // All retries failed
        return NextResponse.json(
            { error: 'AI service temporarily unavailable. All API keys are rate limited. Please try again in a few minutes.' },
            { status: 503 }
        );

    } catch (error: any) {
        let errorMessage = 'Failed to generate AI suggestion';
        if (error.message?.includes('API_KEY')) {
            errorMessage = 'Invalid API key. Please check your GEMINI_API_KEY environment variable.';
        } else if (error.message?.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again in a few minutes.';
        }

        return NextResponse.json(
            { error: errorMessage, details: error.message },
            { status: 500 }
        );
    }
}
