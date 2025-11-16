import { type Product, validateProducts } from "@/types/product"

// Lazy load JSON data using fetch to avoid build issues
let productsData: any = null
let innSynonymsData: any = null
let coverageData: any = null
let docsData: any = null

async function loadProductsData() {
  if (!productsData) {
    const response = await fetch("/data/products.json")
    productsData = await response.json()
  }
  return productsData
}

async function loadInnSynonymsData() {
  if (!innSynonymsData) {
    const response = await fetch("/data/inn_synonyms.json")
    innSynonymsData = await response.json()
  }
  return innSynonymsData
}

async function loadCoverageData() {
  if (!coverageData) {
    const response = await fetch("/data/coverage.json")
    coverageData = await response.json()
  }
  return coverageData
}

async function loadDocsData() {
  if (!docsData) {
    const response = await fetch("/data/docs.json")
    docsData = await response.json()
  }
  return docsData
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
let validatedProducts: Product[] | null = null

export async function getAllProducts(): Promise<Product[]> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 100))
  
  if (validatedProducts === null) {
    const data = await loadProductsData()
    validatedProducts = validateProducts(data)
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
  const data = await loadCoverageData()
  return data as Coverage[]
}

export async function getProductDocs(productId: string): Promise<ProductDocs | null> {
  const data = await loadDocsData()
  return (data as Record<string, ProductDocs>)[productId] || null
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
  const data = await loadInnSynonymsData()
  return data as INNSynonyms
}

export async function getCanonicalINN(inn: string): Promise<string> {
  const synonyms = await getSynonyms()
  return synonyms[inn] || inn
}

// Helper functions for component compatibility
export function getManufacturer(product: Product): string {
  const parts = product.brand_name.split(" ")
  return parts[0]
}

export function getStrength(product: Product): string {
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
    ointment: "Ointment"
  }
  return formMap[product.dosage_form] || product.dosage_form
}
