import { type Product, validateProducts } from "@/types/product"

// JSON data served from /public/data. On the server we read the files from
// disk (relative fetch URLs are not supported in Node); in the browser we
// fetch them over HTTP so the service worker can cache them for offline use.
async function loadJson<T>(file: string): Promise<T> {
  if (typeof window === "undefined") {
    const { promises: fs } = await import("fs")
    const { join } = await import("path")
    const raw = await fs.readFile(join(process.cwd(), "public", "data", file), "utf-8")
    return JSON.parse(raw.replace(/^﻿/, "")) as T
  }

  const response = await fetch(`/data/${file}`)
  if (!response.ok) {
    throw new Error(`Failed to load /data/${file}: HTTP ${response.status}`)
  }
  const text = await response.text()
  const cleanText = text.replace(/^﻿/, "").trim()
  if (cleanText.startsWith("<!")) {
    throw new Error(`Received HTML instead of JSON for /data/${file}`)
  }
  return JSON.parse(cleanText) as T
}

// Deduplicate concurrent loads and cache results per file
const jsonCache = new Map<string, Promise<unknown>>()

function loadJsonCached<T>(file: string): Promise<T> {
  let promise = jsonCache.get(file)
  if (!promise) {
    promise = loadJson<T>(file).catch((error) => {
      jsonCache.delete(file) // allow retry after a failure
      throw error
    })
    jsonCache.set(file, promise)
  }
  return promise as Promise<T>
}

export type { Product } from "@/types/product"

export type Coverage = {
  state: string
  cities: string[]
  service_days: string
}

export type ProductDocs = {
  sdsUrl: string
  labelUrl: string
}

export type INNSynonyms = Record<string, string>

// Cache validated products
let validatedProducts: Promise<Product[]> | null = null

export function getAllProducts(): Promise<Product[]> {
  if (!validatedProducts) {
    validatedProducts = loadJsonCached<unknown>("products.json")
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Products data is not an array")
        }
        return validateProducts(data)
      })
      .catch((error) => {
        validatedProducts = null // allow retry after a failure
        console.error("Error loading products:", error)
        throw error instanceof Error
          ? new Error(`Failed to load products: ${error.message}`)
          : new Error("Failed to load products: Unknown error")
      })
  }
  return validatedProducts
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getAllProducts()
  return products.find((p) => p.slug === slug) || null
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const products = await getAllProducts()
  return products.filter((p) => ids.includes(p.id))
}

export async function getAllCoverage(): Promise<Coverage[]> {
  return loadJsonCached<Coverage[]>("coverage.json")
}

export async function getProductDocs(productId: string): Promise<ProductDocs | null> {
  const data = await loadJsonCached<Record<string, ProductDocs>>("docs.json")
  return data[productId] || null
}

export function getUniqueManufacturers(products: Product[]): string[] {
  // Extract manufacturer from brand_name (first word before space)
  const manufacturers = products.map((p) => {
    const parts = p.brand_name.split(" ")
    return parts[0]
  })
  return Array.from(new Set(manufacturers)).sort()
}

export function getUniqueCategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.therapeutic_class))).sort()
}

export async function getSynonyms(): Promise<INNSynonyms> {
  return loadJsonCached<INNSynonyms>("inn_synonyms.json")
}

export async function getCanonicalINN(inn: string): Promise<string> {
  const synonyms = await getSynonyms()
  return synonyms[inn] || inn
}

// Helper functions for component compatibility
export function getManufacturer(product: Product): string {
  if (!product.brand_name) {
    return "N/A"
  }
  const parts = product.brand_name.split(" ")
  return parts[0] || "N/A"
}

export function getStrength(product: Product): string {
  if (!product.actives || product.actives.length === 0) {
    return "N/A"
  }
  if (product.dosage_form === "syrup") {
    return product.actives.map(a => `${a.mg}mg/5ml`).join(" + ")
  }
  return product.actives.map(a => `${a.mg}mg`).join(" + ")
}

export function getFormDisplay(product: Product): string {
  const formMap: Record<string, string> = {
    tablet: "Tablet",
    capsule: "Capsule",
    syrup: "Syrup",
    injection: "Injection",
    ointment: "Ointment",
    powder: "Powder"
  }
  return formMap[product.dosage_form] || product.dosage_form
}
