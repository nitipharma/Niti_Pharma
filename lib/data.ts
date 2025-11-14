import productsData from "@/data/products.json"
import coverageData from "@/data/coverage.json"
import docsData from "@/data/docs.json"

export type Product = {
  id: string
  slug: string
  name: string
  ndc: string
  gtin: string
  hsn: string
  manufacturer: string
  category: string
  form: string
  strength: string
  pack_size: string
  schedule: "OTC" | "Rx" | "Schedule H"
  cold_chain: boolean
  in_stock: boolean
  price_mrp: number
  storage: string
  images: string[]
  substitutes: string[]
}

export type Coverage = {
  state: string
  cities: string[]
  service_days: string
}

export type ProductDocs = {
  sdsUrl: string
  labelUrl: string
}

export async function getAllProducts(): Promise<Product[]> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 100))
  return productsData as Product[]
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getAllProducts()
  return products.find((p) => p.slug === slug) || null
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const products = await getAllProducts()
  return products.filter((p) => ids.includes(p.id))
}

export function getAllCoverage(): Coverage[] {
  return coverageData as Coverage[]
}

export function getProductDocs(productId: string): ProductDocs | null {
  return (docsData as Record<string, ProductDocs>)[productId] || null
}

export function getUniqueManufacturers(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.manufacturer))).sort()
}

export function getUniqueCategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.category))).sort()
}



