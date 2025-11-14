import { Product } from "./data"

export type SortOption = "relevance" | "name" | "price" | "availability"

export type Filters = {
  search: string
  manufacturers: string[]
  categories: string[]
  schedules: string[]
  coldChain: boolean | null
  inStock: boolean | null
  sort: SortOption
}

export function filterProducts(products: Product[], filters: Filters): Product[] {
  let filtered = [...products]

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.ndc.toLowerCase().includes(searchLower) ||
        p.manufacturer.toLowerCase().includes(searchLower)
    )
  }

  // Manufacturer filter
  if (filters.manufacturers.length > 0) {
    filtered = filtered.filter((p) =>
      filters.manufacturers.includes(p.manufacturer)
    )
  }

  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter((p) =>
      filters.categories.includes(p.category)
    )
  }

  // Schedule filter
  if (filters.schedules.length > 0) {
    filtered = filtered.filter((p) =>
      filters.schedules.includes(p.schedule)
    )
  }

  // Cold chain filter
  if (filters.coldChain !== null) {
    filtered = filtered.filter((p) => p.cold_chain === filters.coldChain)
  }

  // In stock filter
  if (filters.inStock !== null) {
    filtered = filtered.filter((p) => p.in_stock === filters.inStock)
  }

  // Sort
  switch (filters.sort) {
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "price":
      filtered.sort((a, b) => a.price_mrp - b.price_mrp)
      break
    case "availability":
      filtered.sort((a, b) => {
        if (a.in_stock && !b.in_stock) return -1
        if (!a.in_stock && b.in_stock) return 1
        return 0
      })
      break
    case "relevance":
    default:
      // Keep original order (or could implement relevance scoring)
      break
  }

  return filtered
}



