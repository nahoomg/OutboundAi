import type { SearchResult } from '@/types/database';

// 1. THE BLACKLIST (Expanded for better filtering)
const BLACKLIST_DOMAINS = [
    // Job & Career sites
    'linkedin.com', 'glassdoor.com', 'indeed.com', 'ziprecruiter.com', 'monster.com',
    'builtin.com', 'builtinnyc.com', 'angel.co', 'wellfound.com',
    // Social Media & Content
    'reddit.com', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
    'youtube.com', 'medium.com', 'substack.com', 'tiktok.com',
    // Research & Directories
    'crunchbase.com', 'pitchbook.com', 'techcrunch.com', 'ycombinator.com',
    'g2.com', 'capterra.com', 'trustradius.com', 'softwareadvice.com',
    'wikipedia.org', 'wikihow.com', 'quora.com',
    // Enterprise Giants (not target leads)
    'microsoft.com', 'adobe.com', 'google.com', 'amazon.com', 'aws.amazon.com',
    'oracle.com', 'salesforce.com', 'ibm.com', 'sap.com', 'cisco.com',
    'apple.com', 'meta.com', 'nvidia.com', 'intel.com',
    // News & Blogs
    'forbes.com', 'bloomberg.com', 'techcrunch.com', 'wired.com', 'theverge.com',
    // Generic platforms
    'wordpress.com', 'wix.com', 'squarespace.com', 'weebly.com', 'shopify.com',
    'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com'
];

// 2. NEGATIVE KEYWORDS
const NEGATIVE_KEYWORDS = [
    '-jobs', '-hiring', '-salary', '-careers',
    '-directory', '-list', '-top', '-best',
    '-news', '-article', '-forum', '-login', '-signin'
];

interface GoogleSearchItem {
    link: string;
    title: string;
    snippet: string;
}

// Extract meaningful keywords from ICP description
function extractICPKeywords(icpDescription: string): string[] {
    const keywords: string[] = [];
    
    // Industry patterns
    const industryPatterns = [
        /\b(fintech|finance|banking|payments?)\b/i,
        /\b(healthtech|healthcare|medical|health)\b/i,
        /\b(edtech|education|learning|lms)\b/i,
        /\b(martech|marketing|advertising|ads?)\b/i,
        /\b(proptech|real estate|property)\b/i,
        /\b(legaltech|legal|law\s*firm)\b/i,
        /\b(hrtech|hr|human resources|recruiting)\b/i,
        /\b(logistics|supply chain|shipping|freight)\b/i,
        /\b(cybersecurity|security|infosec)\b/i,
        /\b(ai|artificial intelligence|machine learning|ml)\b/i,
        /\b(saas|software|platform|app)\b/i,
        /\b(ecommerce|e-commerce|retail|shopping)\b/i,
        /\b(devops|developer tools|developer)\b/i,
        /\b(analytics|data|insights|bi|business intelligence)\b/i,
    ];
    
    for (const pattern of industryPatterns) {
        const match = icpDescription.match(pattern);
        if (match) keywords.push(match[1]);
    }
    
    // Business model patterns
    if (/\bagency\b/i.test(icpDescription)) keywords.push('agency');
    if (/\bconsulting\b/i.test(icpDescription)) keywords.push('consulting');
    if (/\bstartup\b/i.test(icpDescription)) keywords.push('startup');
    if (/\bb2b\b/i.test(icpDescription)) keywords.push('B2B');
    
    return [...new Set(keywords)].slice(0, 3); // Max 3 keywords
}

export function generateSearchQuery(
    icpDescription: string,
    industry?: string,
    location?: string,
    companySize?: string
): string {
    // Smart keyword extraction from ICP
    const icpKeywords = extractICPKeywords(icpDescription);
    
    // Use industry if provided, otherwise use extracted keywords
    let baseTerm = industry && industry.length > 3 ? industry : icpKeywords[0];
    
    if (!baseTerm) {
        baseTerm = "B2B software";
    }

    // Build a targeted query
    let query = `${baseTerm}`;
    
    // Add secondary keywords for precision
    if (icpKeywords.length > 1) {
        query += ` ("${icpKeywords.slice(1).join('" OR "')}")`;
    }

    // Intent signals based on company size
    if (companySize === '1-10' || companySize === '11-50') {
        // Early stage: look for pricing pages, demos (buying signals)
        query += ` ("pricing" OR "book demo" OR "get started" OR "free trial")`;
    } else if (companySize === '51-200') {
        // Growth stage: solutions, case studies
        query += ` ("solutions" OR "case study" OR "enterprise")`;
    } else {
        // Default: broad B2B signals
        query += ` ("solutions" OR "platform" OR "services")`;
    }

    if (location) {
        query += ` "${location}"`;
    }

    // Strict Exclusions are vital for quality
    query += ` ${NEGATIVE_KEYWORDS.join(' ')}`;
    query += ` -site:.gov -site:.edu -site:docs.* -site:help.* -site:support.* -site:blog.* -site:status.*`;

    return query;
}

export async function findLeads(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !engineId) {
        return [];
    }

    try {
        // STRATEGY: Pagination (Deep Search)
        // We fetch 3 pages (30 results) in parallel to fill the funnel
        const pages = [1, 11, 21];

        const promises = pages.map(start =>
            fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}&num=10&start=${start}`)
                .then(res => res.json())
                .catch(err => {
                    return { items: [] };
                })
        );

        const results = await Promise.all(promises);

        // Flatten all pages into one list
        const allItems: GoogleSearchItem[] = results.flatMap(r => r.items || []);

        // Filter & Deduplicate
        const cleanResults = allItems
            .map((item): SearchResult | null => {
                try {
                    const urlObj = new URL(item.link);
                    const hostname = urlObj.hostname.replace('www.', '');

                    // Hard filter on extension
                    if (hostname.endsWith('.gov') || hostname.endsWith('.edu')) return null;

                    return {
                        domain: hostname,
                        url: item.link,
                        title: item.title,
                        snippet: item.snippet
                    };
                } catch { return null; }
            })
            .filter((item): item is SearchResult => item !== null)
            .filter((item) => {
                // Check against Blacklist
                const isBlacklisted = BLACKLIST_DOMAINS.some(badDomain =>
                    item.domain.includes(badDomain) || item.domain.endsWith(badDomain)
                );
                return !isBlacklisted;
            });

        // Unique by domain
        const uniqueResults = Array.from(new Map(cleanResults.map((item) => [item.domain, item])).values());

        // Pre-score results based on signals in title/snippet
        const scoredResults = uniqueResults.map(item => {
            let score = 50; // Base score
            const text = (item.title + ' ' + item.snippet).toLowerCase();
            
            // Positive signals (higher score = better lead)
            if (text.includes('pricing')) score += 15;
            if (text.includes('demo') || text.includes('book')) score += 10;
            if (text.includes('platform') || text.includes('solution')) score += 10;
            if (text.includes('saas') || text.includes('software')) score += 10;
            if (text.includes('startup') || text.includes('series')) score += 5;
            if (text.includes('enterprise')) score += 5;
            
            // Negative signals (lower = less likely a good lead)
            if (text.includes('blog') || text.includes('article')) score -= 20;
            if (text.includes('news') || text.includes('press')) score -= 15;
            if (text.includes('review') || text.includes('compare')) score -= 15;
            if (text.includes('wiki') || text.includes('guide')) score -= 20;
            if (text.includes('job') || text.includes('career')) score -= 30;
            if (text.includes('login') || text.includes('sign in')) score -= 10;
            
            return { ...item, preScore: score };
        });
        
        // Sort by pre-score (best leads first) and filter out low-quality
        const sortedResults = scoredResults
            .filter(r => r.preScore >= 30) // Remove obvious bad leads
            .sort((a, b) => b.preScore - a.preScore);

        return sortedResults.slice(0, 25);

    } catch (error) {
        return [];
    }
}