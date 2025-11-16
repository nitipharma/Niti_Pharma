import { type ParsedLabel, type ParsedActive } from "./parse-label"
import { type Product } from "./data"
import { embed } from "./embeddings"
import { searchTopK, type SearchResult } from "./vectors"
import { recordMetric, PerformanceTimer } from "./metrics"

export type MatchTier = "EXACT" | "CLOSE" | "ALTERNATIVE"

export interface MatchedProduct {
  product: Product
  tier: MatchTier
  score: number
  notes?: string[]
}

export interface MatchResults {
  results: MatchedProduct[]
  notAvailable: boolean
}

/**
 * Compose query string from parsed label data
 * Format: "INN1 mg + INN2 mg | dosage_form | release_type"
 */
function composeQuery(parsed: ParsedLabel): string {
  const parts: string[] = []

  // Add active ingredients
  if (parsed.actives && parsed.actives.length > 0) {
    const activeStr = parsed.actives
      .map((a) => {
        const mgStr = parsed.dosage_form === "syrup" ? `${a.mg}mg/5ml` : `${a.mg}mg`
        return `${a.inn} ${mgStr}`
      })
      .join(" + ")
    parts.push(activeStr)
  }

  // Add dosage form
  if (parsed.dosage_form) {
    parts.push(parsed.dosage_form)
  }

  // Add release type
  if (parsed.release_type && parsed.release_type !== "IR") {
    parts.push(parsed.release_type)
  }

  return parts.join(" | ")
}

/**
 * Normalize INN names for comparison (case-insensitive, trim)
 */
function normalizeINN(inn: string): string {
  return inn.trim().toLowerCase()
}

/**
 * Check if two INN sets are identical
 */
function sameINNSet(actives1: ParsedActive[], actives2: { inn: string; mg: number }[]): boolean {
  if (actives1.length !== actives2.length) {
    return false
  }

  const set1 = new Set(actives1.map((a) => normalizeINN(a.inn)))
  const set2 = new Set(actives2.map((a) => normalizeINN(a.inn)))

  if (set1.size !== set2.size) {
    return false
  }

  for (const inn of set1) {
    if (!set2.has(inn)) {
      return false
    }
  }

  return true
}

/**
 * Calculate mean relative strength error between two active sets
 * Returns a value between 0 and 1, where 0 is perfect match
 */
function meanRelativeStrengthError(
  actives1: ParsedActive[],
  actives2: { inn: string; mg: number }[]
): number {
  if (actives1.length === 0 || actives2.length === 0) {
    return 1.0
  }

  // Create maps for easier lookup
  const map1 = new Map(actives1.map((a) => [normalizeINN(a.inn), a.mg]))
  const map2 = new Map(actives2.map((a) => [normalizeINN(a.inn), a.mg]))

  const errors: number[] = []

  for (const [inn, mg1] of map1) {
    const mg2 = map2.get(inn)
    if (mg2 !== undefined) {
      const avg = (mg1 + mg2) / 2
      if (avg > 0) {
        const error = Math.abs(mg1 - mg2) / avg
        errors.push(error)
      }
    }
  }

  if (errors.length === 0) {
    return 1.0
  }

  return errors.reduce((sum, e) => sum + e, 0) / errors.length
}

/**
 * Check if strengths are within tolerance
 */
function strengthsWithinTolerance(
  actives1: ParsedActive[],
  actives2: { inn: string; mg: number }[],
  tolerance: number
): boolean {
  const error = meanRelativeStrengthError(actives1, actives2)
  return error <= tolerance
}

/**
 * Calculate brand similarity (simple string similarity)
 * Returns a value between 0 and 1
 */
function brandSimilarity(brand1?: string, brand2?: string): number {
  if (!brand1 || !brand2) {
    return 0
  }

  const b1 = brand1.toLowerCase().trim()
  const b2 = brand2.toLowerCase().trim()

  if (b1 === b2) {
    return 1.0
  }

  // Check if one contains the other
  if (b1.includes(b2) || b2.includes(b1)) {
    return 0.7
  }

  // Simple word overlap
  const words1 = new Set(b1.split(/\s+/))
  const words2 = new Set(b2.split(/\s+/))
  const intersection = new Set([...words1].filter((w) => words2.has(w)))
  const union = new Set([...words1, ...words2])

  if (union.size === 0) {
    return 0
  }

  return intersection.size / union.size
}

/**
 * Score a product match
 */
function scoreProduct(
  parsed: ParsedLabel,
  product: Product,
  cosineScore: number
): { score: number; notes: string[] } {
  const notes: string[] = []
  let score = 0

  // 100 points for exact INN match
  const exactINNMatch = sameINNSet(parsed.actives, product.actives)
  if (exactINNMatch) {
    score += 100
    notes.push("Exact INN match")
  } else {
    notes.push("INN mismatch")
  }

  // 50 points for strength match (1 - mean relative error)
  const strengthError = meanRelativeStrengthError(parsed.actives, product.actives)
  const strengthScore = 50 * (1 - strengthError)
  score += Math.max(0, strengthScore)
  if (strengthError < 0.02) {
    notes.push("Exact strength match")
  } else if (strengthError < 0.1) {
    notes.push("Close strength match")
  } else {
    notes.push("Strength mismatch")
  }

  // 20 points for form and release match
  let formReleaseScore = 0
  if (parsed.dosage_form && product.dosage_form === parsed.dosage_form) {
    formReleaseScore += 10
    notes.push("Dosage form match")
  } else if (parsed.dosage_form) {
    notes.push("Dosage form mismatch")
  }

  if (parsed.release_type && product.release_type === parsed.release_type) {
    formReleaseScore += 10
    notes.push("Release type match")
  } else if (parsed.release_type && product.release_type) {
    notes.push("Release type mismatch")
  }

  score += formReleaseScore

  // 10 points for brand similarity (optional)
  if (parsed.brand_detected) {
    const brandSim = brandSimilarity(parsed.brand_detected, product.brand_name)
    score += 10 * brandSim
    if (brandSim > 0.5) {
      notes.push("Brand similarity")
    }
  }

  // Add cosine similarity as a tie-breaker (small weight)
  score += cosineScore * 5

  return { score, notes }
}

/**
 * Determine tier for a matched product
 */
function determineTier(
  parsed: ParsedLabel,
  product: Product,
  score: number
): MatchTier {
  // EXACT: same INN set, strengths within ±2%, same form & release
  const exactINNMatch = sameINNSet(parsed.actives, product.actives)
  const exactStrength = strengthsWithinTolerance(parsed.actives, product.actives, 0.02)
  const exactForm = !parsed.dosage_form || product.dosage_form === parsed.dosage_form
  const exactRelease = !parsed.release_type || product.release_type === parsed.release_type

  if (exactINNMatch && exactStrength && exactForm && exactRelease) {
    return "EXACT"
  }

  // CLOSE: same INN set, strengths within ±10%, same form (release may differ)
  const closeStrength = strengthsWithinTolerance(parsed.actives, product.actives, 0.1)

  if (exactINNMatch && closeStrength && exactForm) {
    return "CLOSE"
  }

  // ALTERNATIVE: same therapeutic class or other matches
  return "ALTERNATIVE"
}

/**
 * Match products based on parsed label data
 */
export async function matchProducts(
  parsed: ParsedLabel,
  products: Product[]
): Promise<MatchResults> {
  const matchTimer = new PerformanceTimer("Match")
  
  // Create product lookup map
  const productMap = new Map(products.map((p) => [p.id, p]))

  // Compose query and get embedding
  const queryString = composeQuery(parsed)
  const embedTimer = new PerformanceTimer("Embed")
  const queryEmbedding = await embed(queryString)
  const embedMs = embedTimer.end()

  // Get top-50 candidates using cosine similarity
  const candidates = await searchTopK(queryEmbedding, 50)

  // Score and tier all candidates
  const matched: MatchedProduct[] = []

  for (const candidate of candidates) {
    const product = productMap.get(candidate.id)
    if (!product) {
      continue
    }

    // Score the product
    const { score, notes } = scoreProduct(parsed, product, candidate.score)

    // Determine tier
    const tier = determineTier(parsed, product, score)

    matched.push({
      product,
      tier,
      score,
      notes,
    })
  }

  // Filter ALTERNATIVE tier: only include if therapeutic class matches or high cosine score
  // Note: ParsedLabel doesn't include therapeutic_class, so we rely on cosine similarity
  const filtered = matched.filter((m) => {
    if (m.tier !== "ALTERNATIVE") {
      return true
    }

    // Include if cosine similarity is high (lexical fallback)
    const candidate = candidates.find((c) => c.id === m.product.id)
    if (candidate && candidate.score > 0.6) {
      return true
    }

    // Include if at least one INN matches (partial match)
    const parsedINNs = new Set(parsed.actives.map((a) => normalizeINN(a.inn)))
    const productINNs = new Set(m.product.actives.map((a) => normalizeINN(a.inn)))
    const hasCommonINN = [...parsedINNs].some((inn) => productINNs.has(inn))
    
    if (hasCommonINN) {
      return true
    }

    return false
  })

  // Sort by tier priority (EXACT > CLOSE > ALTERNATIVE) then by score
  const tierPriority: Record<MatchTier, number> = {
    EXACT: 3,
    CLOSE: 2,
    ALTERNATIVE: 1,
  }

  filtered.sort((a, b) => {
    const tierDiff = tierPriority[b.tier] - tierPriority[a.tier]
    if (tierDiff !== 0) {
      return tierDiff
    }
    return b.score - a.score
  })

  // Group by tier and take top 5
  const exact = filtered.filter((m) => m.tier === "EXACT").slice(0, 5)
  const close = filtered.filter((m) => m.tier === "CLOSE").slice(0, 5)
  const alternative = filtered.filter((m) => m.tier === "ALTERNATIVE").slice(0, 5)

  const results: MatchedProduct[] = [...exact, ...close, ...alternative].slice(0, 5)
  const matchMs = matchTimer.end()

  // Calculate tier counts
  const tierCounts = {
    EXACT: exact.length,
    CLOSE: close.length,
    ALTERNATIVE: alternative.length,
  }

  // Record metrics
  recordMetric({
    embed_ms: embedMs,
    match_ms: matchMs,
    results_count: results.length,
    tier_counts: tierCounts,
  })

  return {
    results,
    notAvailable: results.length === 0,
  }
}

