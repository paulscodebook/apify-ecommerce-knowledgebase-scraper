// @ts-nocheck
import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});
turndownService.use(gfm);

// Convert images to simple [Image: alt] to save tokens and remove giant CDN urls
turndownService.addRule('images', {
    filter: 'img',
    replacement: function (content: string, node: any) {
        const alt = node.alt || node.title || '';
        return alt ? `[Image: ${alt}]` : '';
    }
});

// Avoid wrapping huge block-level elements in markdown links which break when chunked by headers.
// Instead, just append the link as text if the link text contains newlines or headers.
turndownService.addRule('links', {
    filter: 'a',
    replacement: function (content: string, node: any) {
        const href = node.getAttribute('href');
        const text = content.trim();
        if (!href) return text;
        
        // If it's a huge wrapper link (contains newlines or headers, typical of product cards)
        if (text.includes('\n') || text.includes('#')) {
             // Just append the URL cleanly at the end rather than wrapping the whole block in [...]
             return `${text}\nURL: ${href}\n`;
        }
        return `[${text}](${href})`;
    }
});

export function cleanText(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Parses numeric price from a string like "$19.99 CAD" or "£20"
 */
export function extractPrice(priceStr: string | null | undefined): number | undefined {
    if (!priceStr) return undefined;
    const match = priceStr.match(/[0-9]+[.,]?[0-9]*/);
    if (match) {
        // Handle comma as decimal separator in some locales
        const num = parseFloat(match[0].replace(',', '.'));
        if (!isNaN(num)) return num;
    }
    return undefined;
}

export function htmlToMarkdown(html: string): string {
    return turndownService.turndown(html).trim();
}

export function cheerioToMarkdown($: any, el: any): string {
    const html = $(el).html();
    if (!html) return '';
    return turndownService.turndown(html).trim();
}
