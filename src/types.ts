import { ProxyConfigurationOptions } from 'crawlee';

export interface StartUrl {
    url: string;
}

export interface InputSettings {
    startUrls: StartUrl[];
    includeSections: string[];
    maxPages?: number;
    maxProducts?: number;
    maxDepth?: number;
    chunkSizeTokens: number;
    outputMode: 'catalog_only' | 'knowledge_only' | 'both';
    respectRobotsTxt: boolean;
    proxyConfiguration?: ProxyConfigurationOptions;
    debugMode: boolean;
}

export type PageType = 'product' | 'collection' | 'policy' | 'faq' | 'blog' | 'general' | 'unknown';

export interface ProductData {
    url: string;
    product_id?: string;
    handle?: string;
    title: string;
    description_html?: string;
    description_text?: string;
    price?: number;
    compare_at_price?: number;
    currency?: string;
    availability?: string; // 'in_stock', 'out_of_stock'
    images: string[];
    brand?: string;
    categories: string[];
    variants: ProductVariant[];
    json_ld?: any;
    last_seen_at: string;
}

export interface ProductVariant {
    id?: string;
    title: string;
    price?: number;
    sku?: string;
    availability?: string;
}

export interface KnowledgeChunk {
    url: string;
    title: string;
    section_type: string; // e.g., 'faq', 'policy', 'product_description', 'review'
    source_kind: PageType;
    text: string;
    language: string;
    token_estimate: number;
    product_id?: string;
    breadcrumbs?: string[];
    last_seen_at: string;
}

export interface PageLog {
    url: string;
    page_type: PageType;
    status: number;
    was_rendered: boolean;
    extractor_used: string;
    discovered_from?: string;
}

export interface ScrapedResult {
    product?: ProductData;
    chunks?: KnowledgeChunk[];
    pageLog?: PageLog;
}
