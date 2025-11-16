/**
 * Micro-telemetry for performance monitoring
 * Uses localStorage ring buffer for persistence
 */

const STORAGE_KEY = "niti_pharma_metrics"
const MAX_ENTRIES = 50 // Ring buffer size

export interface MetricEntry {
  timestamp: number
  session_id: string
  ocr_ms?: number
  parse_ms?: number
  embed_ms?: number
  match_ms?: number
  results_count?: number
  tier_counts?: {
    EXACT: number
    CLOSE: number
    ALTERNATIVE: number
  }
  first_load_bytes?: number
  barcode_detected?: boolean
  error?: string
}

let sessionId: string | null = null

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  return sessionId
}

function getMetrics(): MetricEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Failed to read metrics from localStorage:", error)
    return []
  }
}

function saveMetrics(metrics: MetricEntry[]): void {
  try {
    // Keep only last MAX_ENTRIES
    const trimmed = metrics.slice(-MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error("Failed to save metrics to localStorage:", error)
  }
}

/**
 * Record a metric entry
 */
export function recordMetric(entry: Partial<MetricEntry>): void {
  const fullEntry: MetricEntry = {
    timestamp: Date.now(),
    session_id: getSessionId(),
    ...entry,
  }

  const metrics = getMetrics()
  metrics.push(fullEntry)
  saveMetrics(metrics)

  // Log to console.table for debugging
  if (process.env.NODE_ENV === "development") {
    console.table([fullEntry])
  }
}

/**
 * Get all metrics
 */
export function getAllMetrics(): MetricEntry[] {
  return getMetrics()
}

/**
 * Get metrics for current session
 */
export function getSessionMetrics(): MetricEntry[] {
  const sessionId = getSessionId()
  return getMetrics().filter((m) => m.session_id === sessionId)
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear metrics:", error)
  }
}

/**
 * Calculate statistics from metrics
 */
export function calculateStats(metrics: MetricEntry[]): {
  count: number
  avgOcrMs: number
  avgParseMs: number
  avgEmbedMs: number
  avgMatchMs: number
  p95MatchMs: number
  avgResultsCount: number
  totalErrors: number
} {
  if (metrics.length === 0) {
    return {
      count: 0,
      avgOcrMs: 0,
      avgParseMs: 0,
      avgEmbedMs: 0,
      avgMatchMs: 0,
      p95MatchMs: 0,
      avgResultsCount: 0,
      totalErrors: 0,
    }
  }

  const ocrTimes = metrics.filter((m) => m.ocr_ms !== undefined).map((m) => m.ocr_ms!)
  const parseTimes = metrics.filter((m) => m.parse_ms !== undefined).map((m) => m.parse_ms!)
  const embedTimes = metrics.filter((m) => m.embed_ms !== undefined).map((m) => m.embed_ms!)
  const matchTimes = metrics.filter((m) => m.match_ms !== undefined).map((m) => m.match_ms!)
  const resultsCounts = metrics.filter((m) => m.results_count !== undefined).map((m) => m.results_count!)

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const percentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  return {
    count: metrics.length,
    avgOcrMs: avg(ocrTimes),
    avgParseMs: avg(parseTimes),
    avgEmbedMs: avg(embedTimes),
    avgMatchMs: avg(matchTimes),
    p95MatchMs: percentile(matchTimes, 95),
    avgResultsCount: avg(resultsCounts),
    totalErrors: metrics.filter((m) => m.error).length,
  }
}

/**
 * Performance timer helper
 */
export class PerformanceTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = performance.now()
  }

  end(): number {
    const duration = performance.now() - this.startTime
    if (process.env.NODE_ENV === "development") {
      console.log(`[Timer] ${this.label}: ${duration.toFixed(2)}ms`)
    }
    return duration
  }
}

/**
 * Track first load bytes
 */
export function trackFirstLoad(): void {
  if (typeof window === "undefined") return

  // Only track once per session
  if (sessionStorage.getItem("first_load_tracked")) return

  try {
    // Estimate page load size (rough approximation)
    const scripts = Array.from(document.querySelectorAll("script[src]"))
    const styles = Array.from(document.querySelectorAll("link[rel='stylesheet']"))
    
    // This is a rough estimate - actual size would require fetch
    const estimatedBytes = (scripts.length + styles.length) * 50000 // Rough estimate

    recordMetric({
      first_load_bytes: estimatedBytes,
    })

    sessionStorage.setItem("first_load_tracked", "true")
  } catch (error) {
    console.error("Failed to track first load:", error)
  }
}

