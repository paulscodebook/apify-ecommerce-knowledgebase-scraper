# Ecommerce Store Knowledgebase Scraper

An advanced, production-ready Apify Actor designed to scrape ecommerce websites (with a strong focus on Shopify) to extract both **structured product catalogs** and **AI-ready RAG chunks**.

This actor is purpose-built for AI teams, agencies, and ecommerce brands that need to ingest a domain’s content into LLM support bots, semantic search pipelines, merchandising copilots, or internal vector databases.

## Why use this over a generic crawler?
* **Ecommerce-Aware**: It automatically identifies and classifies URLs into Product, Collection, Policy, FAQ, and Blog page types.
* **Shopify Optimized**: Employs specific logic to dig into native Shopify payload structures (e.g. `product.json` payloads, variant variables) enabling reliable, resilient extractions compared to CSS selectors.
* **LLM & RAG Native**: It doesn't just dump HTML. It cleans pages, stripping headers, footers, and noise, and intelligently chunks the main text content via Markdown boundary detection, estimating token sizes automatically.
* **Configurable Outputs**: Choose to output catalog data, knowledge chunks, or both depending on your pipeline requirements.

## Ideal Use Cases
- **AI Support Bots**: Train OpenAI, Anthropic, or dialogue systems on the exact latest return policies, shipping times, and FAQs directly from the source.
- **Semantic Product Search**: Ingest `products` datasets into Pinecone, Weaviate, or Qdrant to enable rich natural language querying over catalogs.
- **Knowledge Ingestion Pipelines**: Integrate directly with Make, n8n, or Langchain to automatically synchronize website knowledge to your enterprise RAG stack.

## Output Modes

The actor allows you to selectively choose what output formats you desire via `outputMode` using the `includeSections` controls:

### 1. Catalog Only
Extracts clean, normalized product data pushed to the `products` dataset.
```json
{
  "url": "https://example.com/products/cool-shirt",
  "title": "Cool Graphic T-Shirt",
  "price": 29.99,
  "currency": "USD",
  "availability": "in_stock",
  "brand": "Example Brand",
  "variants": [
    {"title": "Small", "price": 29.99, "sku": "SHIRT-S"},
    {"title": "Large", "price": 29.99, "sku": "SHIRT-L"}
  ]
}
```

### 2. Knowledge Only (RAG Chunks)
Pushes clean text chunks properly bounded and estimated for tokens into the `knowledge_chunks` dataset.
```json
{
  "url": "https://example.com/policies/shipping-policy",
  "title": "Shipping Policy - International Shipping",
  "section_type": "policy_section",
  "source_kind": "policy",
  "text": "We offer international shipping to over 100 countries. Standard international shipping takes 10-15 business days...",
  "token_estimate": 45
}
```

## Input Configuration

| Field | Type | Description |
|---|---|---|
| `startUrls` | Array | URLs or Sitemaps to begin crawling. |
| `includeSections` | Array | Types of pages to process (`products`, `policies`, `faq`, etc.) |
| `outputMode` | String | `catalog_only`, `knowledge_only`, or `both`. |
| `maxPages` | Integer | Hard limit of pages to traverse (cost control). |
| `chunkSizeTokens` | Integer | Target maximum token size for RAG chunks. |

## Limitations
- **Render Heavy Sites**: Currently operates on a high-speed `CheerioCrawler`. Highly complex SPAs without Server-Side Rendering (SSR) might have some data hidden. Shopify and most modern ecommerce platforms provide SSR or JSON-LD which this actor consumes natively.
- **Paywalls/Logins**: Does not support bypassing logins or captchas outside of Apify's standard proxy rotation parameters.
