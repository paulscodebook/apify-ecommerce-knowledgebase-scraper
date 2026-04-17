import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});
turndownService.use(gfm);

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
