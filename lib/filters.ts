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

  // Search filter - improved word-based matching
  if (filters.search) {
    const searchLower = filters.search.toLowerCase().trim()
    
    // Extract meaningful words (alphanumeric sequences, minimum 2 chars)
    // Split by spaces and also handle cases where words are concatenated
    const searchWords = searchLower
      .split(/[\s.,;:!?]+/)
      .flatMap(word => {
        // Split concatenated words (e.g., "ParacetamolTablets" -> ["paracetamol", "tablets"])
        // This handles camelCase and similar patterns
        const cleaned = word.replace(/[^a-z0-9]/g, '')
        if (cleaned.length < 2) return []
        
        // Try to split on capital letters or numbers
        const parts = cleaned.split(/(?=[A-Z])|(?=\d)/).filter(p => p.length >= 2)
        return parts.length > 0 ? parts : [cleaned]
      })
      .filter(word => word.length >= 2)
      // Remove duplicates
      .filter((word, index, self) => self.indexOf(word) === index)
    
    // If no valid words, use original search
    if (searchWords.length === 0) {
      searchWords.push(searchLower.replace(/[^a-z0-9]/g, ''))
    }
    
    filtered = filtered.filter((p) => {
      const brandLower = p.brand_name.toLowerCase()
      const manufacturerLower = getManufacturer(p).toLowerCase()
      const ndcLower = p.ndc?.toLowerCase() || ""
      const therapeuticClassLower = p.therapeutic_class.toLowerCase()
      
      // Check if the full search string matches (for exact matches)
      const fullMatch = 
        brandLower.includes(searchLower) ||
        manufacturerLower.includes(searchLower) ||
        ndcLower.includes(searchLower) ||
        p.actives.some(a => a.inn.toLowerCase().includes(searchLower))
      
      if (fullMatch) return true
      
      // Helper function to check if word matches (handles concatenated words)
      const wordMatches = (text: string, word: string): boolean => {
        // Direct match
        if (text.includes(word)) return true
        // Check if word is part of a concatenated string (e.g., "mgcalpol" contains "calpol")
        // Split text into potential words and check
        const textWords = text.split(/[\s\-_]+/)
        return textWords.some(tw => tw.includes(word) || word.includes(tw))
      }
      
      // Check if any significant word matches in brand name (highest priority)
      const brandMatches = searchWords.filter(word => wordMatches(brandLower, word))
      if (brandMatches.length > 0) return true
      
      // Check if words match across different fields
      const matches = searchWords.filter(word => 
        wordMatches(brandLower, word) ||
        wordMatches(manufacturerLower, word) ||
        wordMatches(ndcLower, word) ||
        p.actives.some(a => wordMatches(a.inn.toLowerCase(), word)) ||
        wordMatches(therapeuticClassLower, word)
      )
      
      // Match if at least one word matches (flexible matching)
      return matches.length > 0
    })
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



