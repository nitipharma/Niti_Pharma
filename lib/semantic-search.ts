/**
 * On-device semantic catalog search.
 * Embeds the query in the browser (WebGPU when available, WASM otherwise)
 * and ranks products against precomputed embeddings served as a static file —
 * no server round-trip involved.
 */

import { embed, prepareModel, getActiveBackend, type EmbeddingBackend } from "./embeddings"
import { searchTopK } from "./vectors"
import type { Product } from "./data"

export type { EmbeddingBackend }

export interface SemanticResult {
  product: Product
  score: number
}

/** Warm up the model + embeddings index; resolves with the active backend. */
export async function prepareSemanticSearch(): Promise<EmbeddingBackend | null> {
  await prepareModel()
  return getActiveBackend()
}

/**
 * Rank products for a natural-language query. Returns up to `topK` products
 * ordered by cosine similarity; scores below `minScore` are dropped so
 * nonsense queries return nothing instead of random stock.
 */
export async function semanticSearch(
  query: string,
  products: Product[],
  topK = 60,
  minScore = 0.15
): Promise<SemanticResult[]> {
  const queryEmbedding = await embed(query)
  const hits = await searchTopK(queryEmbedding, topK)
  const byId = new Map(products.map((p) => [p.id, p]))

  const results: SemanticResult[] = []
  for (const hit of hits) {
    if (hit.score < minScore) continue
    const product = byId.get(hit.id)
    if (product) {
      results.push({ product, score: hit.score })
    }
  }
  return results
}
