import { ProductData, ProductVariant } from '../types.js';
import { extractGenericProduct } from './generic.js';

export function extractShopifyProduct($: any, url: string): ProductData {
    // Fallback to generic first, we will overwrite with Shopify specifics
    const baseData = extractGenericProduct($, url);

    // Try to find the inner Shopify variable, typically buried in inline scripts
    let shopifyProductJson: any = null;
    
    // Look for application/json text or variable declarations
    $('script').each((_: any, el: any) => {
        const text = $(el).html() || '';
        
        // Match `var meta = {"product":{...}}`
        if (text.includes('var meta =') || text.includes('window.meta =')) {
            try {
                const match = text.match(/product":(\\{.*\\}),"page"/);
                if (match && match[1]) {
                    shopifyProductJson = JSON.parse(match[1]);
                }
            } catch (e) {}
        }

        // Match typical product json script tags
        if ($(el).attr('type') === 'application/json' && $(el).attr('data-product-json')) {
            try {
                shopifyProductJson = JSON.parse(text);
            } catch (e) {}
        }
    });

    if (!shopifyProductJson) {
        return baseData; // Use generic extraction if we couldn't find Shopify product JSON
    }

    // Enhance base data with rich Shopify payload
    const variants: ProductVariant[] = (shopifyProductJson.variants || []).map((v: any) => ({
        id: v.id ? v.id.toString() : undefined,
        title: v.title,
        price: v.price ? v.price / 100 : undefined, // Shopify exposes price in cents often, or direct. Let's assume cents if it's large. Wait, shopify json usually returns it directly as cents in `price` field of variant
        sku: v.sku,
        availability: v.available ? 'in_stock' : 'out_of_stock'
    }));

    // Fix price if it's in cents
    for (const v of variants) {
        if (v.price && v.price > 100000) { v.price = v.price / 100; } // Very crude check, better to rely on baseData.price for the primary price
    }

    return {
        ...baseData,
        product_id: shopifyProductJson.id ? shopifyProductJson.id.toString() : baseData.product_id,
        handle: shopifyProductJson.handle || baseData.handle,
        brand: shopifyProductJson.vendor || baseData.brand,
        variants: variants.length > 0 ? variants : baseData.variants,
        // if generic price failed, rely on shopify variant price
        price: baseData.price || (variants[0] ? variants[0].price : undefined)
    };
}
