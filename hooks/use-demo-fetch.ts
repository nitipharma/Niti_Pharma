"use client"

import { useEffect, useState } from "react"

export function useDemoFetch<T>(url: string): {
  data: T | null
  loading: boolean
  error: string | null
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`)
        }
        const json = (await res.json()) as T
        if (!cancelled) {
          setData(json)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [url])

  return { data, loading, error }
}
