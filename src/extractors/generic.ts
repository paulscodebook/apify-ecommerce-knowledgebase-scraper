import { ProductData, ProductVariant } from '../types.js';
import { extractPrice, cleanText } from '../utils/cleaning.js';

export function extractGenericProduct($: any, url: string): ProductData {
    // Attempt to find JSON-LD product data
    let jsonLdData: any = null;
    $('script[type="application/ld+json"]').each((_: any, el: any) => {
        try {
            const parsed = JSON.parse($(el).html() || '{}');
            // Can be array or object
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of items) {
                if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
                    jsonLdData = item;
                    break;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    });

    const title = jsonLdData?.name || $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
    const descriptionHtml = jsonLdData?.description || $('meta[property="og:description"]').attr('content') || '';
    const descriptionText = cleanText(descriptionHtml);

    let price = jsonLdData?.offers?.price ? parseFloat(jsonLdData.offers.price) : undefined;
    let currency = jsonLdData?.offers?.priceCurrency || $('meta[property="og:price:currency"]').attr('content');
    
    if (price === undefined) {
        price = extractPrice($('meta[property="og:price:amount"]').attr('content'));
    }

    const brand = jsonLdData?.brand?.name || $('meta[property="og:site_name"]').attr('content');
    const images: string[] = [];
    
    if (jsonLdData?.image) {
        if (Array.isArray(jsonLdData.image)) {
            images.push(...jsonLdData.image);
        } else if (typeof jsonLdData.image === 'string') {
            images.push(jsonLdData.image);
        }
    }
    
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && !images.includes(ogImage)) images.push(ogImage);

    processImages(images);

    // Naive variant setup since generic sites don't easily expose variants
    const variants: ProductVariant[] = [];
    if (title && price !== undefined) {
        variants.push({
            title: title,
            price: price,
            availability: jsonLdData?.offers?.availability?.includes('InStock') ? 'in_stock' : undefined
        });
    }

    // Categories / breadcrumbs placeholder
    const categories: string[] = [];

    return {
        url,
        title: title || 'Unknown Product',
        description_html: descriptionHtml,
        description_text: descriptionText,
        price,
        currency,
        images,
        brand,
        categories,
        variants,
        json_ld: jsonLdData,
        last_seen_at: new Date().toISOString()
    };
}

function processImages(images: string[]) {
    // remove duplicates and fix relative urls if needed (assuming absolute for now via OG)
    for (let i = 0; i < images.length; i++) {
        if (images[i].startsWith('//')) {
            images[i] = 'https:' + images[i];
        }
    }
}
