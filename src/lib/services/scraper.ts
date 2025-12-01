import * as cheerio from 'cheerio';

export interface ScrapedContent {
    success: boolean;
    url: string;
    title: string;
    textContent: string;
    error?: string;
    method?: 'JINA_READER' | 'LOCAL_CHEERIO';
}

const JINA_TIMEOUT = 20000;  
const LOCAL_TIMEOUT = 10000; 


export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
    
    if (!isValidUrl(url)) {
        return { success: false, url, title: '', textContent: '', error: 'Invalid URL format' };
    }

    const targetUrl = ensureProtocol(url);

    try {
        const jinaUrl = `https://r.jina.ai/${targetUrl}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), JINA_TIMEOUT);
        
        try {
            const response = await fetch(jinaUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain', 
                    'X-No-Cache': 'true'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const markdown = await response.text();

                if (markdown.length > 200 && !markdown.includes("Jina Reader Error")) {
                    return {
                        success: true,
                        url: targetUrl,
                        title: extractTitleFromMarkdown(markdown) || targetUrl,
                        textContent: cleanText(markdown),
                        method: 'JINA_READER'
                    };
                }
            }
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
    } catch (error: any) {
        const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
        
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT);
        
        try {
            const response = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const $ = cheerio.load(html);

          
            $('script, style, noscript, iframe, svg, header, footer, nav').remove();

            
            const title = $('title').text().trim();
            const bodyText = $('body').text();

            return {
                success: true,
                url: targetUrl,
                title: title || targetUrl,
                textContent: cleanText(bodyText),
                method: 'LOCAL_CHEERIO'
            };
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            throw fetchError;
        }

    } catch (error: any) {
        // Distinguish between timeouts and other errors
        const isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('timeout');
        const errorMsg = isTimeout ? 'Operation timed out' : error.message;

        return {
            success: false,
            url: targetUrl,
            title: '',
            textContent: '',
            error: errorMsg
        };
    }
}



function isValidUrl(string: string) {
    try {
        new URL(ensureProtocol(string));
        return true;
    } catch (_) {
        return false;
    }
}

function ensureProtocol(url: string) {
    if (!url.startsWith('http')) {
        return `https://${url}`;
    }
    return url;
}

function extractTitleFromMarkdown(md: string): string | null {
    const match = md.match(/^Title:\s*(.+)$/m);
    return match ? match[1] : null;
}

function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ') 
        .replace(/\[.*?\]\(.*?\)/g, '') 
        .trim()
        .slice(0, 8000); 
}

export function extractCompanyName(content: ScrapedContent, domain: string): string {
    if (content.title) {
        const cleaned = content.title
            .replace(/\s*[-|–]\s*.*/g, '') 
            .replace(/\s*(Home|Homepage|Welcome)\s*/gi, '')
            .trim();

        if (cleaned.length > 0 && cleaned.length < 50) {
            return cleaned;
        }
    }

    return domain
        .replace(/\.(com|io|net|org|co|ai)$/i, '')
        .replace(/[-_]/g, ' ')
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
