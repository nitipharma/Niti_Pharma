#!/usr/bin/env node

/**
 * Script to compute embeddings for all products and save to binary format
 *
 * Usage: node scripts/compute-embeddings.mjs
 *
 * This script:
 * 1. Reads public/data/products.json
 * 2. Composes descriptor strings for each product
 * 3. Generates embeddings using @huggingface/transformers
 * 4. Saves embeddings as Float32Array binary to public/data (served statically)
 * 5. Saves metadata JSON alongside it
 *
 * The descriptor leads with the composition (so label-photo matching stays
 * aligned with lib/match.ts composeQuery) and appends brand name and
 * therapeutic class so natural-language catalog search has signal too.
 */

import { readFileSync, writeFileSync } from "fs"
import { pipeline } from "@huggingface/transformers"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2"
const EMBEDDING_DIM = 384

/**
 * Common indication/use phrases per therapeutic class so natural-language
 * queries ("fever syrup for kids", "acidity relief") land on the right
 * products, not just ones sharing a dosage form.
 */
const CLASS_INDICATIONS = {
  Analgesic: "pain relief fever headache body ache",
  Antacid: "acidity heartburn gastric reflux stomach",
  Antianxiety: "anxiety stress sleep calm",
  Antibiotic: "bacterial infection antibacterial",
  Antidepressant: "depression mood mental health",
  Antidiabetic: "diabetes blood sugar glucose control",
  Antidiarrheal: "diarrhea loose motion stomach upset",
  Antiemetic: "vomiting nausea motion sickness",
  Antifungal: "fungal infection skin itch ringworm",
  Antihistamine: "allergy cold sneezing runny nose itching",
  Antihypertensive: "high blood pressure hypertension",
  Antiviral: "viral infection herpes flu",
  Bronchodilator: "asthma breathing wheezing cough respiratory",
  Cardiac: "heart cardiac cholesterol",
  Corticosteroid: "inflammation swelling steroid",
  Laxative: "constipation bowel movement",
  Mineral: "supplement deficiency bones health",
  Vitamin: "supplement immunity nutrition health",
}

function composeDescriptor(product) {
  const parts = []

  if (product.actives && product.actives.length > 0) {
    const activeStr = product.actives
      .map((a) => `${a.inn} ${a.mg}${product.dosage_form === "syrup" ? "mg/5ml" : "mg"}`)
      .join(" + ")
    parts.push(activeStr)
  }

  if (product.dosage_form) {
    parts.push(product.dosage_form)
  }

  if (product.release_type && product.release_type !== "IR") {
    parts.push(product.release_type)
  }

  if (product.brand_name) {
    parts.push(product.brand_name)
  }

  if (product.therapeutic_class) {
    parts.push(product.therapeutic_class)
    const indications = CLASS_INDICATIONS[product.therapeutic_class]
    if (indications) {
      parts.push(indications)
    }
  }

  return parts.join(" | ")
}

async function main() {
  console.log("Loading products...")
  const dataDir = join(__dirname, "..", "public", "data")
  const productsPath = join(dataDir, "products.json")

  // Read file and handle potential BOM
  let fileContent = readFileSync(productsPath, "utf-8")
  if (fileContent.charCodeAt(0) === 0xfeff) {
    fileContent = fileContent.slice(1)
  }

  const products = JSON.parse(fileContent)

  console.log(`Found ${products.length} products`)
  console.log(`Loading embedding model: ${MODEL_NAME}...`)

  // q8 matches the browser's WASM path so query and corpus share a space
  const extractor = await pipeline("feature-extraction", MODEL_NAME, {
    dtype: "q8",
  })

  console.log("Generating embeddings...")
  const embeddings = []
  const ids = []

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const descriptor = composeDescriptor(product)

    const result = await extractor(descriptor, {
      pooling: "mean",
      normalize: true,
    })

    let embedding = Array.from(result.data)

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

    if ((i + 1) % 50 === 0 || i === products.length - 1) {
      console.log(`  ${i + 1}/${products.length}`)
    }
  }

  console.log("Saving embeddings...")

  const flatEmbeddings = new Float32Array(embeddings.flat())
  const binPath = join(dataDir, "product_embeddings.bin")
  writeFileSync(binPath, Buffer.from(flatEmbeddings.buffer))

  const metadata = {
    dim: EMBEDDING_DIM,
    count: products.length,
    // Cache-buster for the .bin fetch — bump on every regeneration
    version: Date.now(),
    ids: ids,
  }
  const metaPath = join(dataDir, "product_embeddings.meta.json")
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
