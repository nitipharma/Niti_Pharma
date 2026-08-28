// Client-side only - use dynamic import to avoid SSR issues
let transformersModule: any = null

export type EmbeddingBackend = "webgpu" | "wasm"

// Loaded from CDN at runtime with webpackIgnore: bundling transformers v3
// through webpack breaks on onnxruntime-web's prebuilt bundles, and the
// model weights stream from the Hugging Face CDN regardless. Keep this
// version in sync with the devDependency used by scripts/compute-embeddings.
const TRANSFORMERS_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"

async function getTransformers() {
  if (typeof window === "undefined") {
    throw new Error("Embeddings can only be used in the browser")
  }

  if (!transformersModule) {
    transformersModule = await import(
      /* webpackIgnore: true */ TRANSFORMERS_CDN_URL
    )
    const { env } = transformersModule

    // Configure for browser usage only
    env.allowLocalModels = false
    env.allowRemoteModels = true
  }

  return transformersModule
}

/** Detect WebGPU with a real adapter request — `navigator.gpu` alone can lie. */
async function detectWebGPU(): Promise<boolean> {
  try {
    const gpu = (navigator as any).gpu
    if (!gpu) return false
    const adapter = await gpu.requestAdapter()
    return adapter !== null
  } catch {
    return false
  }
}

// Use a smaller model for faster loading
const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2"
const EMBEDDING_DIM = 384

let embeddingPipeline: any = null
let activeBackend: EmbeddingBackend | null = null
let modelLoadingPromise: Promise<any> | null = null
const embeddingCache = new Map<string, Float32Array>()

/**
 * Prepare the embedding model (prefetch for faster first use).
 * Tries WebGPU first and falls back to WASM if the device or browser
 * doesn't support it.
 */
export async function prepareModel(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if (embeddingPipeline) {
    return Promise.resolve()
  }

  if (modelLoadingPromise) {
    return modelLoadingPromise
  }

  modelLoadingPromise = (async () => {
    const { pipeline } = await getTransformers()

    const backends: EmbeddingBackend[] = (await detectWebGPU())
      ? ["webgpu", "wasm"]
      : ["wasm"]

    let lastError: unknown = null
    for (const backend of backends) {
      try {
        embeddingPipeline = await pipeline("feature-extraction", DEFAULT_MODEL, {
          device: backend,
          // q8 matches the precomputed catalog embeddings; WebGPU runs fp32
          // for unsupported q8 ops but stays in the same embedding space.
          dtype: backend === "wasm" ? "q8" : "fp32",
        })
        activeBackend = backend
        return
      } catch (error) {
        console.warn(`Embedding backend ${backend} failed, trying next`, error)
        lastError = error
      }
    }

    modelLoadingPromise = null
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to load embedding model")
  })()

  return modelLoadingPromise
}

/** Which backend the model actually loaded on (null until loaded). */
export function getActiveBackend(): EmbeddingBackend | null {
  return activeBackend
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
