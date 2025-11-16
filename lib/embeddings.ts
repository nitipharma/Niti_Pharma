import { pipeline, env } from "@xenova/transformers"

// Disable local model files, use CDN
env.allowLocalModels = false
env.allowRemoteModels = true

// Use a smaller model for faster loading
const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2"
const EMBEDDING_DIM = 384

let embeddingPipeline: any = null
let modelLoadingPromise: Promise<any> | null = null
const embeddingCache = new Map<string, Float32Array>()

/**
 * Prepare the embedding model (prefetch for faster first use)
 */
export async function prepareModel(): Promise<void> {
  if (embeddingPipeline) {
    return Promise.resolve()
  }

  if (modelLoadingPromise) {
    return modelLoadingPromise
  }

  modelLoadingPromise = (async () => {
    try {
      embeddingPipeline = await pipeline(
        "feature-extraction",
        DEFAULT_MODEL,
        {
          quantized: true, // Use quantized model for smaller size
          progress_callback: (progress: any) => {
            if (progress.status === "progress") {
              console.log(`Loading model: ${Math.round(progress.progress * 100)}%`)
            }
          },
        }
      )
    } catch (error) {
      console.error("Failed to load embedding model:", error)
      modelLoadingPromise = null
      throw error
    }
  })()

  return modelLoadingPromise
}

/**
 * Generate embedding for a text string
 * Results are cached by text
 */
export async function embed(text: string): Promise<Float32Array> {
  // Check cache first
  const cacheKey = text.trim().toLowerCase()
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!
  }

  // Ensure model is loaded
  if (!embeddingPipeline) {
    await prepareModel()
  }

  if (!embeddingPipeline) {
    throw new Error("Failed to load embedding model")
  }

  try {
    // Generate embedding
    const result = await embeddingPipeline(text, {
      pooling: "mean", // Mean pooling for sentence embeddings
      normalize: true, // Normalize for cosine similarity
    })

    // Convert to Float32Array
    // The result is typically a tensor, extract the data
    let embedding: Float32Array

    if (result.data) {
      // If it's a tensor with .data property
      embedding = new Float32Array(result.data)
    } else if (Array.isArray(result)) {
      // If it's a nested array
      const flattened = result.flat(Infinity) as number[]
      embedding = new Float32Array(flattened)
    } else if (result instanceof Float32Array) {
      embedding = result
    } else {
      // Try to extract from tensor-like object
      const values = Object.values(result).flat(Infinity) as number[]
      embedding = new Float32Array(values)
    }

    // Ensure correct dimension
    if (embedding.length !== EMBEDDING_DIM) {
      // If dimension doesn't match, take first EMBEDDING_DIM or pad with zeros
      const normalized = new Float32Array(EMBEDDING_DIM)
      const copyLength = Math.min(embedding.length, EMBEDDING_DIM)
      normalized.set(embedding.subarray(0, copyLength))
      embedding = normalized
    }

    // Normalize the embedding for cosine similarity
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm
      }
    }

    // Cache the result
    embeddingCache.set(cacheKey, embedding)

    return embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

/**
 * Clear the embedding cache
 */
export function clearCache(): void {
  embeddingCache.clear()
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return embeddingCache.size
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
  return embeddingPipeline !== null
}

