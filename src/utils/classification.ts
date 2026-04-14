import { PageType } from '../types.js';

export function classifyUrl(urlStr: string): PageType {
    try {
        const url = new URL(urlStr);
        const path = url.pathname.toLowerCase();

        // Product patterns
        if (/\/products\/[^\/]+$/.test(path) || /\/p\/[^\/]+$/.test(path) || /\/item\/[^\/]+$/.test(path)) {
            return 'product';
        }

        // Collection patterns
        if (/\/collections\/[^\/]+/.test(path) || /\/category\/[^\/]+/.test(path) || /\/shop\/?/.test(path)) {
            return 'collection';
        }

        // Policy patterns
        if (
            path.includes('/policies/') ||
            path.includes('privacy') ||
            path.includes('terms') ||
            path.includes('returns') ||
            path.includes('shipping') ||
            path.includes('warranty')
        ) {
            return 'policy';
        }

        // FAQ patterns
        if (path.includes('faq') || path.includes('help') || path.includes('support')) {
            return 'faq';
        }

        // Blog patterns
        if (path.includes('/blogs/') || path.includes('/news/') || path.includes('/articles/')) {
            return 'blog';
        }

        // General pages
        if (path.includes('/pages/') || path.includes('/about') || path.includes('/contact')) {
            return 'general';
        }

        // Default or unclassified
        return 'unknown';
    } catch (e) {
        return 'unknown';
    }
}
