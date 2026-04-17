import { KnowledgeChunk, PageType } from '../types.js';
import { htmlToMarkdown } from './cleaning.js';

/**
 * A fast, simplistic token estimator.
 * GPT token models roughly map 1 token to 4 characters of English text.
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Extracts distinct chunks of text from a page based on headings.
 * This is naive but works well for most policy/faq pages.
 */
export function extractChunksFromPage(
    $: any,
    url: string,
    pageTitle: string,
    pageType: PageType,
    maxTokens: number
): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    
    // Remove typical noise elements before chunking
    $('nav, header, footer, script, style, noscript, iframe, aside, form, .nav, .header, .footer, .menu, .sidebar, .filters, [role="navigation"], [id*="filter"], [class*="filter"]').remove();
    
    // Often main content is inside main or an article tag
    const mainContent = $('main, article, #MainContent, .main-content').first();
    const root = mainContent.length ? mainContent : $('body');
    
    // To chunk effectively via DOM without deep recursion, we can extract text per major block.
    // However, a simple approach is to convert the root to Markdown and split there.
    const markdown = htmlToMarkdown(root.html() || '');
    
    if (!markdown) return [];

    // Simple markdown splitting by headers
    const blocks = markdown.split(/(?=^#+ )/m);
    
    let currentChunkText = '';
    let currentChunkTitle = pageTitle;
    let currentSectionType = pageType === 'faq' ? 'faq_answer' : (pageType === 'policy' ? 'policy_section' : 'general_content');

    for (const block of blocks) {
        const blockText = block.trim();
        if (!blockText) continue;

        // Check if block starts with a header, grab it for context
        const headerMatch = blockText.match(/^(#+)\\s+(.*)/);
        if (headerMatch) {
            currentChunkTitle = `${pageTitle} - ${headerMatch[2]}`;
            if (currentChunkTitle.toLowerCase().includes('faq') || currentChunkTitle.toLowerCase().includes('question')) {
                currentSectionType = 'faq_answer';
            }
        }

        const blockTokens = estimateTokens(blockText);
        
        // If adding this block exceeds limit, append current and start new
        if (estimateTokens(currentChunkText) + blockTokens > maxTokens && currentChunkText.length > 0) {
            chunks.push(createChunk(url, currentChunkTitle, currentSectionType, pageType, processChunkText(currentChunkText, pageTitle)));
            currentChunkText = blockText;
        } else {
            currentChunkText += (currentChunkText ? '\\n\\n' : '') + blockText;
        }
    }

    if (currentChunkText.trim().length > 0) {
        chunks.push(createChunk(url, currentChunkTitle, currentSectionType, pageType, processChunkText(currentChunkText, pageTitle)));
    }

    return chunks;
}

function processChunkText(text: string, pageTitle: string): string {
    const lines = text.split('\\n');
    const deduplicatedLines: string[] = [];
    
    // Deduplicate repetitive elements like duplicate hover images within a 5-line span
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine.startsWith('[Image:')) {
             const recentLines = deduplicatedLines.slice(-5).map(l => l.trim());
             if (recentLines.includes(trimmedLine)) {
                 continue;
             }
        }
        deduplicatedLines.push(line);
    }
    
    const cleanedText = deduplicatedLines.join('\\n');
    // Prepend a semantic breadcrumb to provide context for vector search
    return `Context: ${pageTitle}\\n\\n${cleanedText}`;
}

function createChunk(url: string, title: string, sectionType: string, sourceKind: PageType, text: string): KnowledgeChunk {
    return {
        url,
        title: title.substring(0, 150),
        section_type: sectionType,
        source_kind: sourceKind,
        text,
        language: 'en', // we default to english, could add lang detection
        token_estimate: estimateTokens(text),
        last_seen_at: new Date().toISOString()
    };
}
