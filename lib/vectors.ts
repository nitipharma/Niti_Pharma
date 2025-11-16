/**
 * Vector search utilities for product embeddings
 * Loads precomputed embeddings and performs cosine similarity search
 */

export interface EmbeddingMetadata {
  dim: number
  count: number
  ids: string[]
}

export interface SearchResult {
  id: string
  score: number
  index: number
}

let embeddingsData: Float32Array | null = null
let metadata: EmbeddingMetadata | null = null
let loadingPromise: Promise<void> | null = null

/**
 * Load embeddings binary file and metadata
 */
async function loadEmbeddings(): Promise<void> {
  if (embeddingsData && metadata) {
    return Promise.resolve()
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    try {
      // Load metadata
      const metaResponse = await fetch("/data/product_embeddings.meta.json")
      if (!metaResponse.ok) {
        throw new Error(`Failed to load metadata: ${metaResponse.statusText}`)
      }
      metadata = await metaResponse.json()

      // Load binary embeddings
      const binResponse = await fetch("/data/product_embeddings.bin")
      if (!binResponse.ok) {
        throw new Error(`Failed to load embeddings: ${binResponse.statusText}`)
      }
      const arrayBuffer = await binResponse.arrayBuffer()

      // Convert to Float32Array
      embeddingsData = new Float32Array(arrayBuffer)

      // Validate dimensions
      const expectedSize = metadata.count * metadata.dim
      if (embeddingsData.length !== expectedSize) {
        throw new Error(
          `Embedding size mismatch: expected ${expectedSize}, got ${embeddingsData.length}`
        )
      }
    } catch (error) {
      console.error("Error loading embeddings:", error)
      loadingPromise = null
      throw error
    }
  })()

  return loadingPromise
}

/**
 * Compute cosine similarity between two normalized vectors
 * Both vectors must be normalized (unit length)
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`)
  }

  let dotProduct = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
  }

  return dotProduct // Already normalized, so dot product = cosine similarity
}

/**
 * Get embedding vector for a product by index
 */
function getProductEmbedding(index: number): Float32Array {
  if (!embeddingsData || !metadata) {
    throw new Error("Embeddings not loaded")
  }

  if (index < 0 || index >= metadata.count) {
    throw new Error(`Index out of range: ${index} (max: ${metadata.count - 1})`)
  }

  const start = index * metadata.dim
  const end = start + metadata.dim
  return embeddingsData.subarray(start, end)
}

/**
 * Perform top-k cosine similarity search
 * @param queryEmbedding - Normalized query embedding vector
 * @param k - Number of results to return
 * @returns Array of search results sorted by score (descending)
 */
export async function searchTopK(
  queryEmbedding: Float32Array,
  k: number = 10
): Promise<SearchResult[]> {
  // Ensure embeddings are loaded
  await loadEmbeddings()

  if (!embeddingsData || !metadata) {
    throw new Error("Embeddings not loaded")
  }

  if (queryEmbedding.length !== metadata.dim) {
    throw new Error(
      `Query dimension mismatch: expected ${metadata.dim}, got ${queryEmbedding.length}`
    )
  }

  // Normalize query embedding if not already normalized
  const norm = Math.sqrt(
    queryEmbedding.reduce((sum, val) => sum + val * val, 0)
  )
  const normalizedQuery = norm > 0 
    ? new Float32Array(queryEmbedding.map((v) => v / norm))
    : queryEmbedding

  // Compute similarities for all products
  const results: SearchResult[] = []

  for (let i = 0; i < metadata.count; i++) {
    const productEmbedding = getProductEmbedding(i)
    const score = cosineSimilarity(normalizedQuery, productEmbedding)
    
    results.push({
      id: metadata.ids[i],
      score,
      index: i,
    })
  }

  // Sort by score (descending) and take top k
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, k)
}

/**
 * Get embedding for a specific product ID
 */
export async function getProductEmbeddingById(
  productId: string
): Promise<Float32Array | null> {
  await loadEmbeddings()

  if (!metadata) {
    return null
  }

  const index = metadata.ids.indexOf(productId)
  if (index === -1) {
    return null
  }

  return getProductEmbedding(index)
}

/**
 * Check if embeddings are loaded
 */
export function areEmbeddingsLoaded(): boolean {
  return embeddingsData !== null && metadata !== null
}

/**
 * Get metadata
 */
export async function getMetadata(): Promise<EmbeddingMetadata | null> {
  await loadEmbeddings()
  return metadata
}

/**
 * Clear loaded embeddings (useful for testing or memory management)
 */
export function clearEmbeddings(): void {
  embeddingsData = null
  metadata = null
  loadingPromise = null
}

