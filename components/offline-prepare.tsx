"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, CheckCircle2, Loader2, WifiOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { prepareModel } from "@/lib/embeddings"
import { getAllProducts } from "@/lib/data"

interface OfflinePrepareProps {
  onComplete?: () => void
}

export function OfflinePrepare({ onComplete }: OfflinePrepareProps) {
  const [isPreparing, setIsPreparing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [isReady, setIsReady] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if already prepared
    checkPreparedStatus()
  }, [])

  const checkPreparedStatus = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("caches" in window)) {
        return
      }
      // getRegistration resolves immediately; serviceWorker.ready would
      // hang forever when no service worker is registered (e.g. in dev)
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        return
      }

      const hasCache = await caches.has("niti-pharma-data-v2")
      if (!hasCache) {
        return
      }

      // Check if data files are cached
      const cache = await caches.open("niti-pharma-data-v2")
      const dataFiles = [
        "/data/products.json",
        "/data/product_embeddings.bin",
        "/data/product_embeddings.meta.json",
        "/data/inn_synonyms.json",
      ]

      const cached = await Promise.all(
        dataFiles.map((url) => cache.match(url))
      )

      if (cached.every((c) => c !== undefined)) {
        setIsReady(true)
      }
    } catch (error) {
      console.error("Error checking prepared status:", error)
    }
  }

  const prepareOffline = async () => {
    setIsPreparing(true)
    setProgress(0)
    setStatus("Initializing...")

    try {
      // Step 1: Register service worker
      setProgress(10)
      setStatus("Registering service worker...")
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          })
          // Wait for service worker to be ready
          await navigator.serviceWorker.ready
          console.log("Service Worker registered:", registration)
        } catch (error) {
          console.error("Service Worker registration failed:", error)
          // Continue even if registration fails (might already be registered)
        }
      } else {
        throw new Error("Service Worker not supported in this browser")
      }

      // Step 2: Cache data files
      setProgress(20)
      setStatus("Caching data files...")
      const dataFiles = [
        "/data/products.json",
        "/data/product_embeddings.bin",
        "/data/product_embeddings.meta.json",
        "/data/inn_synonyms.json",
      ]

      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CACHE_URLS",
          urls: dataFiles,
        })
      }

      // Also cache directly. A file that fails to cache means offline mode
      // will not actually work, so surface it instead of warning silently.
      const cache = await caches.open("niti-pharma-data-v2")
      const failed: string[] = []
      await Promise.all(
        dataFiles.map(async (url, index) => {
          try {
            await cache.add(url)
            setProgress(20 + (index + 1) * (30 / dataFiles.length))
          } catch (error) {
            console.error(`Failed to cache ${url}:`, error)
            failed.push(url)
          }
        })
      )
      if (failed.length > 0) {
        throw new Error(`Failed to cache required files: ${failed.join(", ")}`)
      }

      // Step 3: Preload embedding model
      setProgress(50)
      setStatus("Loading AI model...")
      await prepareModel()
      setProgress(70)

      // Step 4: Preload products
      setProgress(75)
      setStatus("Loading product catalog...")
      await getAllProducts()
      setProgress(85)

      // Step 5: Preload Tesseract (it will cache automatically)
      setProgress(90)
      setStatus("Preparing OCR engine...")
      // Tesseract.js will cache automatically on first use
      // We just need to trigger it
      try {
        const { createWorker } = await import("tesseract.js")
        const worker = await createWorker("eng")
        await worker.terminate()
      } catch (error) {
        console.warn("Tesseract preload failed:", error)
      }

      setProgress(100)
      setStatus("Ready for offline use!")
      setIsReady(true)
      setIsPreparing(false)

      toast({
        title: "Offline preparation complete!",
        description: "The app is now ready to work offline.",
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error("Offline preparation failed:", error)
      toast({
        title: "Preparation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      setIsPreparing(false)
    }
  }

  if (isReady) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>Ready for offline use</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={prepareOffline}
        disabled={isPreparing}
        className="gap-2"
      >
        {isPreparing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing...
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Prepare for offline
          </>
        )}
      </Button>
      {isPreparing && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      )}
    </div>
  )
}

