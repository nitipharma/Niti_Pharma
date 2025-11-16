"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createWorker, type Worker } from "tesseract.js"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, X, FileImage, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseLabel, type ParsedLabel } from "@/lib/parse-label"
import { getSynonyms } from "@/lib/data"
import { decodeBarcode, findProductByGTIN } from "@/lib/barcode"
import { getAllProducts } from "@/lib/data"
import { recordMetric, PerformanceTimer } from "@/lib/metrics"

export interface OCRResult {
  text: string
  lines: string[]
  imageMeta: { width: number; height: number }
  parsed?: ParsedLabel
  barcodeProductId?: string // If barcode found, this is the product ID
}

interface LabelOCRProps {
  onResult: (result: OCRResult) => void
  onClose?: () => void
}

// Tesseract.js automatically uses IndexedDB for caching traineddata
// We just need to configure it properly
async function createCachedWorker(): Promise<Worker> {
  // Tesseract.js v4+ automatically caches traineddata in IndexedDB
  // The cache key is managed internally by tesseract.js
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      // Suppress verbose logging, but keep progress updates
      if (m.status === "recognizing text") {
        // Progress is handled in the recognize call
      }
    },
    // Tesseract.js will automatically use IndexedDB for caching
    // No additional configuration needed
  })

  return worker
}

// Image preprocessing: resize, grayscale, contrast
function preprocessImage(
  image: HTMLImageElement,
  maxDimension: number = 1600
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = image
  if (width > height) {
    if (width > maxDimension) {
      height = (height * maxDimension) / width
      width = maxDimension
    }
  } else {
    if (height > maxDimension) {
      width = (width * maxDimension) / height
      height = maxDimension
    }
  }

  canvas.width = width
  canvas.height = height

  // Draw image
  ctx.drawImage(image, 0, 0, width, height)

  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Convert to grayscale and apply contrast
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale: weighted average
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

    // Apply contrast (factor > 1 increases contrast)
    const contrast = 1.2
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
    const newGray = Math.max(0, Math.min(255, factor * (gray - 128) + 128))

    data[i] = newGray // R
    data[i + 1] = newGray // G
    data[i + 2] = newGray // B
    // data[i + 3] stays as alpha
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function LabelOCR({ onResult, onClose }: LabelOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPEG, PNG, etc.)")
      return
    }

    setSelectedFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    setIsProcessing(true)
    setProgress(0)
    setStatus("Loading image...")

    try {
      // Load and preprocess image
      const img = await loadImage(file)
      setStatus("Preprocessing image...")
      setProgress(20)

      const canvas = preprocessImage(img)
      
      // Try barcode scanning first (fast path)
      setStatus("Scanning for barcode...")
      setProgress(25)
      
      try {
        const barcode = await decodeBarcode(img)
        if (barcode) {
          // Barcode found! Try to find product
          const products = await getAllProducts()
          const product = await findProductByGTIN(barcode, products)
          
          if (product) {
            setProgress(100)
            setStatus("Barcode found!")
            
            // Record barcode detection metric
            recordMetric({
              barcode_detected: true,
            })
            
            // Return barcode result immediately
            const result: OCRResult = {
              text: `Barcode: ${barcode}`,
              lines: [`Barcode: ${barcode}`],
              imageMeta: {
                width: canvas.width,
                height: canvas.height,
              },
              barcodeProductId: product.id,
            }
            
            URL.revokeObjectURL(previewUrl)
            
            setTimeout(() => {
              onResult(result)
              setIsProcessing(false)
            }, 500)
            return
          }
        }
      } catch (error) {
        // Barcode scan failed, continue with OCR
        console.warn("Barcode scan failed, continuing with OCR:", error)
      }
      
      setStatus("Initializing OCR engine...")
      setProgress(30)

      // Create worker with caching
      if (!workerRef.current) {
        workerRef.current = await createCachedWorker()
      }
      const worker = workerRef.current

      setStatus("Recognizing text...")
      setProgress(40)

      // Perform OCR with timing
      const ocrTimer = new PerformanceTimer("OCR")
      const { data } = await worker.recognize(canvas, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progressValue = 40 + (m.progress || 0) * 0.6 // 40-100%
            setProgress(Math.round(progressValue))
          }
        },
      })
      const ocrMs = ocrTimer.end()

      setProgress(100)
      setStatus("Parsing label data...")

      // Process result
      const lines = data.lines.map((line) => line.text.trim()).filter((line) => line.length > 0)
      
      // Parse the OCR text to extract structured data
      const parseTimer = new PerformanceTimer("Parse")
      const synonyms = await getSynonyms()
      const parsed = parseLabel(data.text, synonyms)
      const parseMs = parseTimer.end()

      // Record metrics
      recordMetric({
        ocr_ms: ocrMs,
        parse_ms: parseMs,
        barcode_detected: false,
      })
      
      const result: OCRResult = {
        text: data.text,
        lines,
        imageMeta: {
          width: canvas.width,
          height: canvas.height,
        },
        parsed,
      }

      // Cleanup preview URL
      URL.revokeObjectURL(previewUrl)

      // Callback with result
      setTimeout(() => {
        onResult(result)
        setIsProcessing(false)
      }, 500)
    } catch (error) {
      console.error("OCR error:", error)
      recordMetric({
        error: error instanceof Error ? error.message : "Unknown error",
      })
      alert(`OCR failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsProcessing(false)
      setStatus("Error occurred")
    }
  }, [onResult])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0])
      }
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0])
      }
    },
    [handleFile]
  )

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setPreview(null)
    setIsProcessing(false)
    setProgress(0)
    setStatus("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate().catch(console.error)
        workerRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isProcessing && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        {!preview && !isProcessing && (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop an image here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports JPEG, PNG, and other image formats
              </p>
            </div>
          </div>
        )}

        {preview && !isProcessing && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 w-full object-contain rounded border"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleReset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                <FileImage className="h-4 w-4 mr-2" />
                Change Image
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4">
            {preview && (
              <div className="relative">
                <img
                  src={preview}
                  alt="Processing"
                  className="max-h-64 w-full object-contain rounded border opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{status}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

