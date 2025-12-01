/**
 * Extract the latest message from an email body, removing quoted text and signatures
 */
export function extractLatestMessage(emailBody: string): string {
    if (!emailBody) return '';

    const lines = emailBody.split('\n');
    const cleanLines: string[] = [];

    for (const line of lines) {
        // Stop at common quote indicators
        if (
            line.trim().startsWith('>') ||
            line.trim().startsWith('On ') && line.includes('wrote:') ||
            line.includes('From:') && line.includes('Sent:') ||
            line.includes('-----Original Message-----')
        ) {
            break;
        }

        cleanLines.push(line);
    }

    // Join and clean up
    let result = cleanLines.join('\n').trim();

    // Remove common email signatures
    const signaturePatterns = [
        /--\s*$/,
        /^Sent from my/,
        /^Get Outlook for/,
    ];

    for (const pattern of signaturePatterns) {
        const match = result.match(pattern);
        if (match) {
            result = result.substring(0, match.index).trim();
        }
    }

    return result || emailBody; // Fallback to original if nothing extracted
}

/**
 * Format an email body for display (remove extra whitespace, normalize line breaks)
 */
export function formatEmailBody(text: string): string {
    return text
        .replace(/\r\n/g, '\n') // Normalize line breaks
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
        .trim();
}
