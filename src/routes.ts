import { createCheerioRouter, Dataset } from 'crawlee';
import { classifyUrl } from './utils/classification.js';
import { extractShopifyProduct } from './extractors/shopify.js';
import { extractChunksFromPage } from './utils/chunking.js';
import { InputSettings, ScrapedResult, PageLog, PageType } from './types.js';

export const router = createCheerioRouter();

const handleRequest = async ({ request, $, log, enqueueLinks }: any) => {
    // We attach input settings to the crawler so we can access them in the router
    const inputSettings = request.userData.input as InputSettings;
    
    // Classify the URL
    const pageType: PageType = classifyUrl(request.loadedUrl || request.url);
    log.info(`Processing ${request.url} as type: ${pageType}`);

    const result: ScrapedResult = {};
    const pageLog: PageLog = {
        url: request.loadedUrl || request.url,
        page_type: pageType,
        status: 200, // naive default
        was_rendered: false,
        extractor_used: 'none'
    };

    // Extract Product Data
    if (pageType === 'product' && inputSettings.includeSections.includes('products')) {
        try {
            // Priority default to shopify extractor (it falls back to generic safely)
            const productData = extractShopifyProduct($, request.loadedUrl || request.url);
            
            if (inputSettings.outputMode === 'catalog_only' || inputSettings.outputMode === 'both') {
                const productsDataset = await Dataset.open('products');
                await productsDataset.pushData(productData);
            }
            
            result.product = productData;
            pageLog.extractor_used = 'product';

            // Also extract descriptive parts as chunks if knowledge mode is enabled
            if (inputSettings.outputMode === 'knowledge_only' || inputSettings.outputMode === 'both') {
                const chunks = extractChunksFromPage($, request.loadedUrl || request.url, productData.title, pageType, inputSettings.chunkSizeTokens);
                if (chunks.length > 0) {
                    const knowledgeDataset = await Dataset.open('knowledge_chunks');
                    await knowledgeDataset.pushData(chunks);
                }
            }
        } catch (error: any) {
            log.error(`Product extraction failed for ${request.url}: ${error.message}`);
            pageLog.status = 500;
        }
    } 
    // Extract Knowledge Chunks from text pages
    else if (['policy', 'faq', 'blog', 'collection', 'general'].includes(pageType) && inputSettings.includeSections.includes(pageType === 'general' ? 'general_pages' : pageType)) {
        if (inputSettings.outputMode === 'knowledge_only' || inputSettings.outputMode === 'both') {
            try {
                const title = $('title').text() || $('h1').first().text() || 'Unknown Page';
                const chunks = extractChunksFromPage($, request.loadedUrl || request.url, title, pageType, inputSettings.chunkSizeTokens);
                
                if (chunks.length > 0) {
                    const knowledgeDataset = await Dataset.open('knowledge_chunks');
                    await knowledgeDataset.pushData(chunks);
                }
                pageLog.extractor_used = 'chunking';
            } catch (error: any) {
                log.error(`Chunk extraction failed for ${request.url}: ${error.message}`);
                pageLog.status = 500;
            }
        }
    }

    // Push Page Log
    const pagesDataset = await Dataset.open('pages');
    await pagesDataset.pushData(pageLog);

    // Enqueue links
    await enqueueLinks({
        strategy: 'same-domain',
        label: 'default',
        transformRequestFunction: (req) => {
            // Apply filtering logic
            if (inputSettings.respectRobotsTxt) {
                // Robots txt is handled by CheerioCrawler options natively mostly, we can skip manual handling here 
            }
            // Skip typical noise
            const lowUrl = req.url.toLowerCase();
            if (lowUrl.includes('/cart') || lowUrl.includes('/checkout') || lowUrl.includes('/account') || lowUrl.includes('login') || lowUrl.includes('search')) {
                return false;
            }
            // Pass input settings forward to the next request
            if (!req.userData) req.userData = {};
            req.userData.input = inputSettings;
            return req;
        }
    });

};

router.addHandler('default', handleRequest);
router.addHandler('undefined', handleRequest); // Safeguard
router.addDefaultHandler(handleRequest);
