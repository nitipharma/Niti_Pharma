import { readFile } from "fs/promises"
import path from "path"
import { validateProducts, type Product } from "@/types/product"
import type { ProductDocs } from "@/lib/data"

/**
 * Server-side data access. `lib/data.ts` loads via fetch with relative URLs,
 * which only works in the browser — server components must read the JSON
 * files from `public/data` directly.
 */

async function readJson(fileName: string): Promise<unknown> {
  const filePath = path.join(process.cwd(), "public", "data", fileName)
  const raw = await readFile(filePath, "utf-8")
  return JSON.parse(raw.replace(/^﻿/, ""))
}

let productsCache: Product[] | null = null

export async function getAllProductsServer(): Promise<Product[]> {
  if (productsCache === null) {
    const data = await readJson("products.json")
    if (!Array.isArray(data)) {
      throw new Error("Products data is not an array")
    }
    productsCache = validateProducts(data)
  }
  return productsCache
}

export async function getProductBySlugServer(slug: string): Promise<Product | null> {
  const products = await getAllProductsServer()
  return products.find((p) => p.slug === slug) || null
}

export async function getProductsByIdsServer(ids: string[]): Promise<Product[]> {
  const products = await getAllProductsServer()
  return products.filter((p) => ids.includes(p.id))
}

export async function getProductDocsServer(productId: string): Promise<ProductDocs | null> {
  const data = (await readJson("docs.json")) as Record<string, ProductDocs>
  return data[productId] || null
}
