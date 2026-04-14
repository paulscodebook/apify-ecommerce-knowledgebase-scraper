import { Actor, log } from 'apify';
import { CheerioCrawler, Sitemap } from 'crawlee';
import { router } from './routes.js';
import { InputSettings } from './types.js';

await Actor.init();

// Read the input settings
const input = await Actor.getInput<InputSettings>();

if (!input || !input.startUrls || input.startUrls.length === 0) {
    throw new Error('Input must include startUrls array.');
}

const proxyConfiguration = await Actor.createProxyConfiguration(
    input.proxyConfiguration || { useApifyProxy: true }
);

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl: input.maxPages || 1000,
    maxConcurrency: 50,
    requestHandler: router,
    // Add User Agent rotation or default realistic UA
    preNavigationHooks: [
        (_crawlingContext, requestAsBrowserOptions) => {
            requestAsBrowserOptions.headerGeneratorOptions = {
                devices: ['desktop', 'mobile'],
                locales: ['en-US'],
            };
        },
    ],
    failedRequestHandler: async ({ request, log }) => {
        log.error(`Request ${request.url} failed completely.`);
    },
});

const startRequests = input.startUrls.map(req => ({
    url: req.url,
    userData: { input } // Inject input settings to be readable in router
}));

// Automatically attempt to find and enqueue sitemaps if the start url is just a domain
const initialRequests = [];
for (const req of startRequests) {
    if (req.url.endsWith('sitemap.xml')) {
        try {
            const { urls } = await Sitemap.load(req.url);
            initialRequests.push(...urls.map(u => ({ url: u, userData: { input } })));
            log.info(`Enqueued ${urls.length} URLs from sitemap ${req.url}`);
        } catch (e: any) {
            log.warning(`Failed to load sitemap ${req.url}: ${e.message}`);
        }
    } else {
        initialRequests.push(req);
    }
}

await crawler.run(initialRequests);

// Ensure we gracefully exit the Apify actor and flush storage
await Actor.exit();
