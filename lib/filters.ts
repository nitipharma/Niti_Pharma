import { Product, getManufacturer } from "./data"

export type SortOption = "relevance" | "name" | "availability"

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

  // Search filter - word-based matching
  if (filters.search) {
    const searchLower = filters.search.toLowerCase().trim()

    // Tokenize into words and standalone numbers ("calpol 500mg" ->
    // ["calpol", "500mg", "500"])
    const searchWords = Array.from(
      new Set(
        searchLower
          .split(/[^a-z0-9.]+/)
          .flatMap((word) => {
            const words = word.length >= 2 ? [word] : []
            const numbers = word.match(/\d+/g) || []
            return words.concat(numbers.filter((n) => n.length >= 2 && n !== word))
          })
      )
    )

    if (searchWords.length > 0) {
      // Short queries are typed by hand: require every word to match.
      // Long queries come from OCR text dumps where much of the text is
      // noise, so require at least two matching words instead.
      const requiredMatches = searchWords.length <= 3 ? searchWords.length : 2

      filtered = filtered.filter((p) => {
        const haystack = [
          p.brand_name,
          getManufacturer(p),
          p.ndc || "",
          p.therapeutic_class,
          ...p.actives.map((a) => `${a.inn} ${a.mg}mg ${a.mg}`),
        ]
          .join(" ")
          .toLowerCase()

        // Full search string match always wins
        if (haystack.includes(searchLower)) return true

        const matches = searchWords.filter((word) => haystack.includes(word))
        return matches.length >= requiredMatches
      })
    }
  }

  // Manufacturer filter
  if (filters.manufacturers.length > 0) {
    filtered = filtered.filter((p) =>
      filters.manufacturers.includes(getManufacturer(p))
    )
  }

  // Category filter (therapeutic_class)
  if (filters.categories.length > 0) {
    filtered = filtered.filter((p) =>
      filters.categories.includes(p.therapeutic_class)
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
      filtered.sort((a, b) => a.brand_name.localeCompare(b.brand_name))
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



