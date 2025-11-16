import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const productsPath = join(__dirname, "..", "data", "products.json")
const metaPath = join(__dirname, "..", "data", "product_embeddings.meta.json")

const products = JSON.parse(readFileSync(productsPath, "utf-8"))
const metadata = {
  dim: 384,
  count: products.length,
  ids: products.map((p) => p.id),
}

writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
console.log(`Generated metadata for ${products.length} products`)

