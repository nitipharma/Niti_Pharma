/**
 * Unit conversion utilities for pharmaceutical label parsing
 */

export type Unit = "mg" | "mcg" | "g" | "IU" | "%" | "ml" | "mg/5ml"

export interface ParsedUnit {
  value: number
  unit: Unit
  normalizedMg: number
  confidence: number
}

/**
 * Convert various units to milligrams (mg)
 * For liquids, assumes mg per 5mL when unit is mg/5ml
 */
export function normalizeToMg(value: number, unit: string): ParsedUnit {
  const unitLower = unit.toLowerCase().trim()

  // Handle mg/5ml for syrups
  if (unitLower.includes("mg/5ml") || unitLower.includes("mg per 5ml") || unitLower.includes("mg/5 ml")) {
    return {
      value,
      unit: "mg/5ml",
      normalizedMg: value, // Keep as-is for liquids (per 5ml)
      confidence: 1.0,
    }
  }

  // Handle standard units
  switch (unitLower) {
    case "mg":
    case "milligram":
    case "milligrams":
      return {
        value,
        unit: "mg",
        normalizedMg: value,
        confidence: 1.0,
      }

    case "mcg":
    case "μg": // Greek mu
    case "µg": // micro sign
    case "ug":
    case "microgram":
    case "micrograms":
      return {
        value,
        unit: "mcg",
        normalizedMg: value / 1000,
        confidence: 1.0,
      }

    case "g":
    case "gm":
    case "gram":
    case "grams":
      return {
        value,
        unit: "g",
        normalizedMg: value * 1000,
        confidence: 1.0,
      }

    case "iu":
    case "i.u.":
    case "international unit":
    case "international units":
      // IU conversion is substance-dependent, use conservative estimate
      // Common: 1 IU Vitamin D3 ≈ 0.025 mcg ≈ 0.000025 mg
      // For most drugs, assume 1 IU ≈ 1 mcg ≈ 0.001 mg (conservative)
      return {
        value,
        unit: "IU",
        normalizedMg: value * 0.001, // Conservative conversion
        confidence: 0.6, // Lower confidence due to substance dependency
      }

    case "%":
    case "percent":
    case "percentage":
      // Percentage is context-dependent, cannot reliably convert
      return {
        value,
        unit: "%",
        normalizedMg: value, // Keep as percentage, cannot convert
        confidence: 0.3, // Very low confidence
      }

    case "ml":
    case "milliliter":
    case "milliliters":
      // Volume only, cannot convert to mg without density
      return {
        value,
        unit: "ml",
        normalizedMg: value, // Keep as-is
        confidence: 0.2, // Very low confidence
      }

    default:
      // Unknown unit: guessing mg in a pharmaceutical context is dangerous
      // (e.g. "5 mmol" recorded as 5 mg), so report near-zero confidence
      // and let callers discard the value
      return {
        value,
        unit: "mg",
        normalizedMg: value,
        confidence: 0.1,
      }
  }
}

/**
 * Extract number and unit from text
 * Handles formats like "500mg", "500 mg", "500mg/5ml", etc.
 */
export function parseStrength(text: string): ParsedUnit | null {
  // Normalize separators only — an aggressive character strip would destroy
  // units like "ml" and "µg" and corrupt the parsed strength
  const cleaned = text.replace(/[(),;:]/g, " ").trim()

  // Pattern: number followed by unit
  // Matches: "500mg", "500 mg", "500mg/5ml", "500 mg/5ml", "0.5g", "1000 IU", etc.
  const patterns = [
    // mg/5ml format
    /(\d+\.?\d*)\s*(mg\s*\/\s*5\s*ml|mg\s*per\s*5\s*ml|mg\/5ml)/i,
    // Standard unit formats
    /(\d+\.?\d*)\s*(mg|mcg|μg|µg|ug|g|gm|iu|i\.u\.|%|ml|milligram|microgram|gram|international\s+unit)/i,
    // Number only (assume mg)
    /(\d+\.?\d*)\s*$/,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match) {
      const value = parseFloat(match[1])
      const unit = match[2]?.trim() || "mg"

      if (!isNaN(value) && value > 0) {
        return normalizeToMg(value, unit)
      }
    }
  }

  return null
}

/**
 * Check if a unit is suitable for solid dosage forms (tablets, capsules)
 */
export function isSolidFormUnit(unit: Unit): boolean {
  return unit === "mg" || unit === "mcg" || unit === "g" || unit === "IU"
}

/**
 * Check if a unit is suitable for liquid dosage forms (syrups)
 */
export function isLiquidFormUnit(unit: Unit): boolean {
  return unit === "mg/5ml" || unit === "ml"
}

