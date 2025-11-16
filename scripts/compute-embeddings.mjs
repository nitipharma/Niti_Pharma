#!/usr/bin/env node

/**
 * Script to compute embeddings for all products and save to binary format
 * 
 * Usage: node scripts/compute-embeddings.mjs
 * 
 * This script:
 * 1. Reads products.json
 * 2. Composes descriptor strings for each product
 * 3. Generates embeddings using @xenova/transformers
 * 4. Saves embeddings as Float32Array binary file
 * 5. Saves metadata JSON file
 */

import { readFileSync, writeFileSync } from "fs"
import { pipeline } from "@xenova/transformers"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2"
const EMBEDDING_DIM = 384

/**
 * Compose a descriptor string for a product
 * Format: "Active1 mg + Active2 mg | dosage_form | release_type"
 */
function composeDescriptor(product) {
  const parts = []
  
  // Add active ingredients
  if (product.actives && product.actives.length > 0) {
    const activeStr = product.actives
      .map((a) => `${a.inn} ${a.mg}${product.dosage_form === "syrup" ? "mg/5ml" : "mg"}`)
      .join(" + ")
    parts.push(activeStr)
  }
  
  // Add dosage form
  if (product.dosage_form) {
    parts.push(product.dosage_form)
  }
  
  // Add release type
  if (product.release_type && product.release_type !== "IR") {
    parts.push(product.release_type)
  }
  
  return parts.join(" | ")
}

async function main() {
  console.log("Loading products...")
  const productsPath = join(__dirname, "..", "data", "products.json")
  
  // Read file and handle potential BOM
  let fileContent = readFileSync(productsPath, "utf-8")
  // Remove BOM if present
  if (fileContent.charCodeAt(0) === 0xfeff) {
    fileContent = fileContent.slice(1)
  }
  
  const products = JSON.parse(fileContent)
  
  console.log(`Found ${products.length} products`)
  console.log(`Loading embedding model: ${MODEL_NAME}...`)
  
  // Load the embedding pipeline
  const extractor = await pipeline("feature-extraction", MODEL_NAME, {
    quantized: true,
  })
  
  console.log("Generating embeddings...")
  const embeddings = []
  const ids = []
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const descriptor = composeDescriptor(product)
    
    console.log(`[${i + 1}/${products.length}] ${product.brand_name}: ${descriptor}`)
    
    // Generate embedding
    const result = await extractor(descriptor, {
      pooling: "mean",
      normalize: true,
    })
    
    // Extract embedding vector
    let embedding
    if (result.data) {
      embedding = Array.from(result.data)
    } else if (Array.isArray(result)) {
      embedding = result.flat(Infinity)
    } else {
      embedding = Object.values(result).flat(Infinity)
    }
    
    // Ensure correct dimension
    if (embedding.length !== EMBEDDING_DIM) {
      const normalized = new Array(EMBEDDING_DIM).fill(0)
      const copyLength = Math.min(embedding.length, EMBEDDING_DIM)
      for (let j = 0; j < copyLength; j++) {
        normalized[j] = embedding[j]
      }
      embedding = normalized
    }
    
    embeddings.push(embedding)
    ids.push(product.id)
  }
  
  console.log("Saving embeddings...")
  
  // Convert to Float32Array and write binary file
  const flatEmbeddings = new Float32Array(embeddings.flat())
  const binPath = join(__dirname, "..", "data", "product_embeddings.bin")
  writeFileSync(binPath, Buffer.from(flatEmbeddings.buffer))
  
  // Write metadata
  const metadata = {
    dim: EMBEDDING_DIM,
    count: products.length,
    ids: ids,
  }
  const metaPath = join(__dirname, "..", "data", "product_embeddings.meta.json")
  writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
  
  console.log(`✓ Saved ${products.length} embeddings to ${binPath}`)
  console.log(`✓ Saved metadata to ${metaPath}`)
  console.log(`  Dimension: ${EMBEDDING_DIM}`)
  console.log(`  Total size: ${flatEmbeddings.byteLength} bytes`)
}

main().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})

