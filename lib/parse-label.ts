import { parseStrength, type ParsedUnit, isSolidFormUnit, isLiquidFormUnit } from "./units"

export type DosageForm = "tablet" | "capsule" | "syrup" | "injection" | "ointment"
export type ReleaseType = "IR" | "ER" | "SR" | "XR"

export interface ParsedActive {
  inn: string
  mg: number
  confidence: number
}

export interface ParsedLabel {
  brand_detected?: string
  dosage_form?: DosageForm
  release_type?: ReleaseType
  actives: ParsedActive[]
  notes: string[]
  confidence: number
}

/**
 * Normalize INN name using synonyms dictionary
 */
function normalizeINN(name: string, synonyms: Record<string, string>): string {
  const normalized = name.trim()
  
  // Direct match
  if (synonyms[normalized]) {
    return synonyms[normalized]
  }
  
  // Case-insensitive match
  const lower = normalized.toLowerCase()
  for (const [key, value] of Object.entries(synonyms)) {
    if (key.toLowerCase() === lower) {
      return value
    }
  }
  
  // Partial match (e.g., "Paracetamol BP" -> "Paracetamol")
  for (const [key, value] of Object.entries(synonyms)) {
    if (normalized.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(normalized.toLowerCase())) {
      return value
    }
  }
  
  return normalized
}

/**
 * Extract brand name from text
 */
function extractBrand(text: string): string | undefined {
  // Common patterns for brand names
  const brandPatterns = [
    /^([A-Z][A-Za-z0-9\s&]+?)(?:\s+\d+|\s+mg|\s+tablet|$)/i,
    /Brand[:\s]+([A-Z][A-Za-z0-9\s&]+)/i,
    /Trade[:\s]+Name[:\s]+([A-Z][A-Za-z0-9\s&]+)/i,
  ]
  
  const lines = text.split("\n").slice(0, 5) // Check first 5 lines
  
  for (const line of lines) {
    for (const pattern of brandPatterns) {
      const match = line.match(pattern)
      if (match && match[1]) {
        const brand = match[1].trim()
        // Filter out common non-brand words
        if (!/tablet|capsule|syrup|injection|ointment|mg|ml|composition/i.test(brand)) {
          return brand
        }
      }
    }
  }
  
  return undefined
}

/**
 * Detect dosage form from text
 */
function detectDosageForm(text: string): DosageForm | undefined {
  const lower = text.toLowerCase()
  
  // Check for explicit mentions
  if (/\btablet(s)?\b/i.test(lower) && !/\bcapsule/i.test(lower)) {
    return "tablet"
  }
  if (/\bcapsule(s)?\b/i.test(lower)) {
    return "capsule"
  }
  if (/\bsyrup\b/i.test(lower) || /\bsuspension\b/i.test(lower) || /\bper\s*5\s*ml/i.test(lower)) {
    return "syrup"
  }
  if (/\binjection\b/i.test(lower) || /\binjectable\b/i.test(lower) || /\bampoule\b/i.test(lower)) {
    return "injection"
  }
  if (/\bointment\b/i.test(lower) || /\bcream\b/i.test(lower) || /\bgel\b/i.test(lower)) {
    return "ointment"
  }
  
  return undefined
}

/**
 * Detect release type from text
 */
function detectReleaseType(text: string): ReleaseType | undefined {
  const upper = text.toUpperCase()
  
  if (/\bXR\b/.test(upper) || /\bEXTENDED\s+RELEASE\b/.test(upper)) {
    return "XR"
  }
  if (/\bER\b/.test(upper) || /\bEXTENDED\s+RELEASE\b/.test(upper)) {
    return "ER"
  }
  if (/\bSR\b/.test(upper) || /\bSUSTAINED\s+RELEASE\b/.test(upper)) {
    return "SR"
  }
  if (/\bIR\b/.test(upper) || /\bIMMEDIATE\s+RELEASE\b/.test(upper)) {
    return "IR"
  }
  
  return undefined
}

/**
 * Find composition section in text
 */
function findCompositionSection(text: string): string {
  const lower = text.toLowerCase()
  
  // Keywords that indicate composition section
  const sectionKeywords = [
    "composition",
    "each tablet contains",
    "each capsule contains",
    "each 5ml contains",
    "each ml contains",
    "active ingredients",
    "active ingredient",
    "ingredients",
    "constituents",
    "contains",
  ]
  
  const lines = text.split("\n")
  let startIndex = -1
  
  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase()
    if (sectionKeywords.some((keyword) => lineLower.includes(keyword))) {
      startIndex = i
      break
    }
  }
  
  if (startIndex === -1) {
    // No explicit section found, return first 20 lines
    return lines.slice(0, 20).join("\n")
  }
  
  // Extract section (next 15 lines or until blank line + 5 more)
  let endIndex = startIndex + 15
  let blankLineCount = 0
  
  for (let i = startIndex + 1; i < lines.length && i < startIndex + 20; i++) {
    if (lines[i].trim() === "") {
      blankLineCount++
      if (blankLineCount > 1) {
        endIndex = i
        break
      }
    } else {
      blankLineCount = 0
    }
  }
  
  return lines.slice(startIndex, endIndex).join("\n")
}

/**
 * Extract active ingredients with strengths
 */
function extractActives(
  text: string,
  synonyms: Record<string, string>
): ParsedActive[] {
  const actives: ParsedActive[] = []
  const lines = text.split("\n")
  
  // Get all known INNs (both keys and values from synonyms)
  const knownINNs = new Set<string>()
  for (const [key, value] of Object.entries(synonyms)) {
    knownINNs.add(value)
    knownINNs.add(key)
  }
  const uniqueINNs = Array.from(knownINNs)
  
  // Common INN patterns (capitalized words, often at start of line)
  const innPatterns = [
    // Pattern: "Paracetamol 500mg" or "Paracetamol 500 mg"
    /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\.?\d*\s*(?:mg|mcg|g|IU|%|mg\/5ml|mg per 5ml|mg\/5\s*ml))/i,
    // Pattern: "Each tablet contains: Paracetamol 500mg"
    /(?:contains?|:)\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\.?\d*\s*(?:mg|mcg|g|IU|%|mg\/5ml|mg per 5ml|mg\/5\s*ml))/i,
    // Pattern: "Paracetamol - 500mg" or "Paracetamol: 500mg"
    /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s*[-:]\s*(\d+\.?\d*\s*(?:mg|mcg|g|IU|%|mg\/5ml|mg per 5ml|mg\/5\s*ml))/i,
    // Pattern: "Paracetamol (500mg)" or "Paracetamol (500 mg)"
    /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s*\((\d+\.?\d*\s*(?:mg|mcg|g|IU|%|mg\/5ml|mg per 5ml|mg\/5\s*ml))\)/i,
  ]
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.length < 5) continue
    
    // Try pattern matching first
    for (const pattern of innPatterns) {
      const match = trimmedLine.match(pattern)
      if (match) {
        const innName = match[1].trim()
        const strengthText = match[2].trim()
        
        // Skip if it looks like a brand name or non-INN word
        if (/tablet|capsule|syrup|injection|brand|trade|name|composition/i.test(innName)) {
          continue
        }
        
        const parsedStrength = parseStrength(strengthText)
        if (parsedStrength && parsedStrength.confidence > 0.3) {
          const normalizedINN = normalizeINN(innName, synonyms)
          actives.push({
            inn: normalizedINN,
            mg: parsedStrength.normalizedMg,
            confidence: parsedStrength.confidence * 0.9, // Slight penalty for pattern matching
          })
          break // Found a match, move to next line
        }
      }
    }
    
    // Try known INN matching (more reliable)
    for (const inn of uniqueINNs) {
      // Use word boundary to avoid partial matches
      const innRegex = new RegExp(`\\b${inn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i")
      if (innRegex.test(trimmedLine)) {
        // Look for strength near the INN (within 50 chars)
        const innIndex = trimmedLine.toLowerCase().indexOf(inn.toLowerCase())
        const searchStart = Math.max(0, innIndex - 20)
        const searchEnd = Math.min(trimmedLine.length, innIndex + inn.length + 50)
        const searchText = trimmedLine.substring(searchStart, searchEnd)
        
        const strengthMatch = searchText.match(/(\d+\.?\d*\s*(?:mg|mcg|g|IU|%|mg\/5ml|mg per 5ml|mg\/5\s*ml))/i)
        if (strengthMatch) {
          const parsedStrength = parseStrength(strengthMatch[1])
          if (parsedStrength && parsedStrength.confidence > 0.3) {
            actives.push({
              inn: normalizeINN(inn, synonyms),
              mg: parsedStrength.normalizedMg,
              confidence: parsedStrength.confidence * 0.95, // Higher confidence for known INN
            })
            break // Found a match, move to next line
          }
        }
      }
    }
  }
  
  // Remove duplicates (same INN, keep highest confidence)
  const uniqueActives = new Map<string, ParsedActive>()
  for (const active of actives) {
    const existing = uniqueActives.get(active.inn)
    if (!existing || active.confidence > existing.confidence) {
      uniqueActives.set(active.inn, active)
    }
  }
  
  return Array.from(uniqueActives.values())
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(
  text: string,
  actives: ParsedActive[],
  hasCompositionSection: boolean,
  dosageForm?: DosageForm,
  releaseType?: ReleaseType
): number {
  let confidence = 0.5 // Base confidence
  
  // Boost for composition section
  if (hasCompositionSection) {
    confidence += 0.2
  }
  
  // Boost for each active with good confidence
  const avgActiveConfidence = actives.length > 0
    ? actives.reduce((sum, a) => sum + a.confidence, 0) / actives.length
    : 0
  
  confidence += avgActiveConfidence * 0.2
  
  // Boost for dosage form detection
  if (dosageForm) {
    confidence += 0.05
  }
  
  // Boost for release type detection
  if (releaseType) {
    confidence += 0.05
  }
  
  // Penalize if no actives found
  if (actives.length === 0) {
    confidence *= 0.5
  }
  
  // Penalize conflicting units (e.g., mg and mg/5ml together)
  const hasSolidUnits = actives.some((a) => {
    // Check if mg value suggests solid form
    return a.mg > 0 && a.mg < 10000
  })
  const hasLiquidUnits = actives.some((a) => {
    // Check if mg value suggests liquid form (per 5ml)
    return a.mg > 0 && a.mg < 1000
  })
  
  if (hasSolidUnits && hasLiquidUnits && actives.length > 1) {
    confidence *= 0.8 // Slight penalty for mixed units
  }
  
  return Math.min(1.0, Math.max(0.0, confidence))
}

/**
 * Parse OCR text to extract structured pharmaceutical data
 */
export function parseLabel(
  ocr: string,
  synonyms: Record<string, string>
): ParsedLabel {
  const text = ocr.trim()
  const notes: string[] = []
  
  if (!text) {
    return {
      actives: [],
      notes: ["Empty OCR text"],
      confidence: 0.0,
    }
  }
  
  // Extract brand
  const brand_detected = extractBrand(text)
  
  // Detect dosage form
  const dosage_form = detectDosageForm(text)
  
  // Detect release type
  const release_type = detectReleaseType(text)
  
  // Find composition section
  const compositionSection = findCompositionSection(text)
  const hasCompositionSection = compositionSection !== text
  
  // Extract actives
  const actives = extractActives(compositionSection, synonyms)
  
  // Add notes
  if (!hasCompositionSection) {
    notes.push("No explicit composition section found")
  }
  if (actives.length === 0) {
    notes.push("No active ingredients detected")
  }
  if (actives.length > 5) {
    notes.push(`Detected ${actives.length} actives (may include false positives)`)
  }
  
  // Calculate confidence
  const confidence = calculateConfidence(
    text,
    actives,
    hasCompositionSection,
    dosage_form,
    release_type
  )
  
  return {
    brand_detected,
    dosage_form,
    release_type,
    actives,
    notes,
    confidence,
  }
}

