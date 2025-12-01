import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { QualificationResult, EmailDraft, MeetingIntent } from '@/types/database';
import type { ScrapedContent } from './scraper';


const keyUsageMap = new Map<string, { count: number; lastReset: number; blocked: boolean; blockedUntil: number }>();
const RPM_LIMIT = 10; 
const RESET_WINDOW_MS = 60000; 
const BLOCK_DURATION_MS = 300000; 


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

function getGenAIClient(excludeKeys: string[] = []): { client: GoogleGenerativeAI; key: string } | null {
    const keys = getAllKeys();

    if (keys.length === 0) {
        return null;
    }

    const now = Date.now();

    keyUsageMap.forEach((usage, key) => {
        if (now - usage.lastReset > RESET_WINDOW_MS) {
            usage.count = 0;
            usage.lastReset = now;
        }
        if (usage.blocked && now > usage.blockedUntil) {
            usage.blocked = false;
        }
    });

    let selectedKey: string | null = null;
    let lowestCount = Infinity;

    for (const key of keys) {
        if (excludeKeys.includes(key)) continue;
        
        const usage = keyUsageMap.get(key) || { count: 0, lastReset: now, blocked: false, blockedUntil: 0 };

        if (usage.blocked && now < usage.blockedUntil) continue;
        
        if (usage.count >= RPM_LIMIT) continue;

        if (usage.count < lowestCount) {
            lowestCount = usage.count;
            selectedKey = key;
        }
    }

    if (!selectedKey) {
        return null;
    }

    const currentUsage = keyUsageMap.get(selectedKey) || { count: 0, lastReset: now, blocked: false, blockedUntil: 0 };
    currentUsage.count++;
    keyUsageMap.set(selectedKey, currentUsage);

    return { client: new GoogleGenerativeAI(selectedKey), key: selectedKey };
}

async function executeWithRetry<T>(
    operation: (client: GoogleGenerativeAI) => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    const triedKeys: string[] = [];
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const clientInfo = getGenAIClient(triedKeys);
        
        if (!clientInfo) {
            throw new Error('All Gemini API keys exhausted or blocked');
        }

        try {
            return await operation(clientInfo.client);
        } catch (error: any) {
            lastError = error;
            triedKeys.push(clientInfo.key);

            
            const isRateLimit = error.status === 429 || 
                               error.message?.includes('429') || 
                               error.message?.includes('quota') ||
                               error.message?.includes('Too Many Requests');

            if (isRateLimit) {
                markKeyBlocked(clientInfo.key);
                continue; 
            }

            
            throw error;
        }
    }

    throw lastError || new Error('All Gemini API keys failed');
}

export async function qualifyLead(
    domain: string,
    scrapedContent: ScrapedContent,
    icpDescription: string,
    techStackFilter?: string[]
): Promise<QualificationResult> {
    try {
        return await executeWithRetry(async (genAI) => {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // OPTIMIZATION: Use structured JSON schema to force strict output
        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                isFit: { type: SchemaType.BOOLEAN },
                score: { type: SchemaType.NUMBER },
                reason: { type: SchemaType.STRING },
                techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["isFit", "score", "reason", "techStack"]
        };

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: schema as any,
        };

        const prompt = `You are an ELITE B2B sales development AI qualifying leads.

## YOUR MISSION:
Determine if this company is worth reaching out to based on ICP fit. You want HIGH-QUALITY leads, not just any business.

## ICP (Ideal Customer Profile):
${icpDescription}
${techStackFilter?.length ? `\n**Preferred Tech Stack (bonus if present):** ${techStackFilter.join(', ')}` : ''}

## PROSPECT DATA:
- **Domain:** ${domain}
- **Page Title:** ${scrapedContent.title}
- **Website Content:** ${scrapedContent.textContent.slice(0, 3500)}

## QUALIFICATION FRAMEWORK:

### INSTANT DISQUALIFY (Score 0-20):
- ❌ Government (.gov) or Educational (.edu)
- ❌ Enterprise giant (Fortune 500: Microsoft, Google, Amazon, etc.)
- ❌ News/media site, blog, or content publisher
- ❌ Job board, directory, or listing aggregator
- ❌ Personal website or portfolio
- ❌ Website is dead, parked, or under construction
- ❌ B2C consumer product (retail, fashion, food delivery to consumers)

### WEAK FIT (Score 25-50):
- Industry doesn't clearly match ICP
- No clear product/service offering
- No business signals (no pricing, no demo, no contact)
- Appears to be a freelancer or solo consultant

### POSSIBLE FIT (Score 55-70):
- Industry is adjacent or unclear
- Some B2B signals but missing key ICP criteria
- Small agency or consultancy (may not have budget)

### GOOD FIT (Score 75-85):
- Clear B2B product or service
- Industry matches ICP
- Has buying signals: pricing page, demo CTA, enterprise features
- Appears to be established company (team page, case studies, logos)

### EXCELLENT FIT (Score 90-100):
- Perfect ICP match
- Strong buying signals
- Preferred tech stack mentioned
- Clear decision-maker titles visible
- Recent funding, growth signals, or hiring

## OUTPUT REQUIREMENTS:
- **isFit**: true if score >= 60
- **score**: 0-100 based on framework above
- **reason**: 1-2 sentences explaining WHY (be specific - mention what you saw)
- **techStack**: Array of technologies detected (empty if none found)

Be SELECTIVE. We want quality over quantity. A score of 75+ means "definitely reach out."`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig
        });

            const qualification = JSON.parse(result.response.text());

            return qualification;
        });
    } catch (error: any) {
        return mockQualification();
    }
}

export async function generateEmailDraft(
    domain: string,
    companyName: string,
    scrapedContent: ScrapedContent,
    valueProp: string,
    qualificationReason: string
): Promise<EmailDraft> {
    try {
        return await executeWithRetry(async (genAI) => {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const schema = {
                type: SchemaType.OBJECT,
                properties: {
                    subject: { type: SchemaType.STRING },
                    body: { type: SchemaType.STRING }
                },
                required: ["subject", "body"]
            };

            const generationConfig = {
                responseMimeType: "application/json",
                responseSchema: schema as any,
            };

            const prompt = `You are a TOP-TIER B2B sales copywriter. Write a HIGHLY PERSONALIZED cold email.

## CONTEXT:
- **Company:** ${companyName}
- **Their Website Says:** ${scrapedContent.textContent.slice(0, 500)}
- **Why They're a Fit:** ${qualificationReason}
- **Our Value Prop:** ${valueProp}

## EMAIL RULES:
1. **Subject Line:** Short (3-6 words), curiosity-driven, personalized to THEM. NO generic "Quick question" or "Partnership opportunity".
   - Good: "${companyName}'s growth bottleneck?", "Idea for ${companyName}'s [specific thing]" 
   - Bad: "Quick call?", "Partnership inquiry", "Introduction"

2. **Opening Line (CRITICAL):** Reference something SPECIFIC from their website. Show you did research.
   - Good: "Saw you're scaling [specific product/feature] - impressive growth."
   - Bad: "I hope this email finds you well.", "I'm reaching out because..."

3. **Body (2-3 sentences):** Connect OUR value prop to THEIR situation. Be specific about the benefit.

4. **CTA:** Low friction, single ask. "Worth a 15-min call?" or "Open to exploring this?"

5. **Length:** MAX 100 words. Shorter = better.

6. **Tone:** Confident peer, not salesy vendor. No "I'd love to..." or "Would you be open to..."

Output valid JSON with "subject" and "body" fields only.`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig
            });

            return JSON.parse(result.response.text());
        });
    } catch (error: any) {
        return mockEmailDraft(companyName);
    }
}

export async function analyzeReplySentiment(emailBody: string): Promise<'POSITIVE_INTEREST' | 'REQUESTING_INFO' | 'NEGATIVE' | 'NEUTRAL' | 'OOO' | 'OBJECTION'> {
    try {
        return await executeWithRetry(async (genAI) => {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `Classify email sentiment: POSITIVE_INTEREST, REQUESTING_INFO, OBJECTION, NEGATIVE, OOO, or NEUTRAL.
            Email: ${emailBody.slice(0, 1000)}
            Return plain text label only.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/['\"]/g, '').toUpperCase();

            const valid = ['POSITIVE_INTEREST', 'REQUESTING_INFO', 'NEGATIVE', 'NEUTRAL', 'OOO', 'OBJECTION'];
            return valid.includes(text) ? text as any : 'NEUTRAL';
        });
    } catch {
        return 'NEUTRAL';
    }
}

export async function extractMeetingIntent(emailBody: string): Promise<MeetingIntent> {
    try {
        return await executeWithRetry(async (genAI) => {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                hasProposedTime: { type: SchemaType.BOOLEAN },
                proposedDate: { type: SchemaType.STRING, nullable: true },
                proposedTime: { type: SchemaType.STRING, nullable: true },
                suggestedResponse: { type: SchemaType.STRING }
            },
            required: ["hasProposedTime", "suggestedResponse"]
        };

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: schema as any,
        };

        const prompt = `You are an executive assistant analyzing a lead's email to detect meeting interest.

EMAIL BODY:
${emailBody.slice(0, 2000)}

ANALYSIS TASK:
1. Determine if the lead proposed a SPECIFIC date/time (e.g., "Tuesday at 2pm", "next week", "tomorrow afternoon")
2. Extract the proposed date/time if mentioned
3. Generate a professional confirmation response

RULES:
- **hasProposedTime**: true if they mention ANY time/date, false if just generic interest (e.g., "Yes, let's talk")
- **proposedDate**: ISO 8601 format if you can parse it, null otherwise
- **proposedTime**: Human-readable time string (e.g., "2:00 PM"), null if not mentioned
- **suggestedResponse**: Draft confirmation email (50-100 words)

EXAMPLES:

Email: "Yes, I'm interested in learning more"
→ hasProposedTime: false, proposedDate: null, proposedTime: null
→ suggestedResponse: "Great! I'd love to connect. Are you available for a 30-minute call this week? I have openings Tuesday or Thursday afternoon."

Email: "How about Tuesday at 2pm?"
→ hasProposedTime: true, proposedDate: "2024-11-26T14:00:00Z" (if today is Nov 24), proposedTime: "2:00 PM"
→ suggestedResponse: "Perfect! I've sent you a calendar invite for Tuesday at 2pm. Looking forward to our conversation!"

Email: "I'm free next week, preferably mornings"
→ hasProposedTime: true, proposedDate: null (too vague), proposedTime: "morning"
→ suggestedResponse: "Excellent! I'll send you some morning time slots for next week. Does Monday or Wednesday at 10am work for you?"

Return valid JSON only.`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig
        });

            const intent = JSON.parse(result.response.text());

            return intent;
        });
    } catch (error: any) {
        return mockMeetingIntent();
    }
}

// Fallbacks
function mockQualification(): QualificationResult {
    return { isFit: true, score: 70, reason: "Mock qualification (AI Error)", techStack: [] };
}
function mockEmailDraft(name: string): EmailDraft {
    return { subject: `Connect with ${name}`, body: "Hi, seeing some errors with the AI service. Let's chat." };
}
function mockMeetingIntent(): MeetingIntent {
    return {
        hasProposedTime: false,
        proposedDate: null,
        proposedTime: null,
        suggestedResponse: "Thank you for your interest! I'd love to connect. When works best for you?"
    };
}
