import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"

/**
 * Decode barcode from image element or canvas
 * Tries multiple formats: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, etc.
 */
export async function decodeBarcode(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<string | null> {
  const reader = new BrowserMultiFormatReader()

  // Convert to canvas for consistent processing
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  // Get image dimensions and draw to canvas
  let width: number, height: number
  if (imageElement instanceof HTMLImageElement) {
    width = imageElement.naturalWidth || imageElement.width
    height = imageElement.naturalHeight || imageElement.height
    canvas.width = width
    canvas.height = height
    ctx.drawImage(imageElement, 0, 0)
  } else {
    width = imageElement.width
    height = imageElement.height
    canvas.width = width
    canvas.height = height
    ctx.drawImage(imageElement, 0, 0)
  }

  // Convert canvas to image element for ZXing decoding
  try {
    const img = new Image()
    img.src = canvas.toDataURL()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
    const result = await reader.decodeFromImageElement(img)
    if (result && result.getText()) {
      return result.getText()
    }
  } catch (error) {
    // NotFoundException is expected if no barcode found
    if (!(error instanceof NotFoundException)) {
      console.warn("Barcode decode error:", error)
    }
  }

  // If original failed, try with contrast-boosted grayscale version
  try {
    // Get image data and apply contrast boost
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Convert to grayscale and boost contrast
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

      // Boost contrast (factor > 1 increases contrast)
      const contrast = 1.5
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
      const newGray = Math.max(0, Math.min(255, factor * (gray - 128) + 128))

      data[i] = newGray // R
      data[i + 1] = newGray // G
      data[i + 2] = newGray // B
      // data[i + 3] stays as alpha
    }

    ctx.putImageData(imageData, 0, 0)

    // Try decoding from contrast-boosted image
    const img = new Image()
    img.src = canvas.toDataURL()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
    const result = await reader.decodeFromImageElement(img)
    if (result && result.getText()) {
      return result.getText()
    }
  } catch (error) {
    // NotFoundException is expected if no barcode found
    if (!(error instanceof NotFoundException)) {
      console.warn("Barcode decode error (contrast-boosted):", error)
    }
  }

  return null
}

/**
 * Normalize barcode to GTIN format (remove leading zeros, ensure 13 digits)
 */
export function normalizeGTIN(barcode: string): string {
  // Remove any non-digit characters
  const digits = barcode.replace(/\D/g, "")

  // EAN-13/UPC-A: 13 digits (UPC-A has leading 0)
  // EAN-8: 8 digits
  // UPC-E: 8 digits (can be expanded to UPC-A)

  // If it's 12 digits (UPC-A without check digit or with leading 0), pad to 13
  if (digits.length === 12) {
    return "0" + digits
  }

  // If it's 8 digits (EAN-8 or UPC-E), we can't directly convert to EAN-13
  // Return as-is for now
  if (digits.length === 8) {
    return digits
  }

  // Return 13-digit format
  return digits.length >= 13 ? digits.slice(0, 13) : digits
}

/**
 * Find product by GTIN
 */
export async function findProductByGTIN(
  gtin: string,
  products: Array<{ gtin: string; id: string }>
): Promise<{ id: string; gtin: string } | null> {
  const normalized = normalizeGTIN(gtin)

  // Try exact match first
  let product = products.find((p) => p.gtin === normalized || p.gtin === gtin)
  if (product) {
    return product
  }

  // Try matching last 12 digits (UPC-A format)
  if (normalized.length === 13) {
    const upcA = normalized.slice(1) // Remove leading 0
    product = products.find((p) => p.gtin.endsWith(upcA) || p.gtin === upcA)
    if (product) {
      return product
    }
  }

  // Try matching any substring
  product = products.find((p) => p.gtin.includes(normalized) || normalized.includes(p.gtin))
  if (product) {
    return product
  }

  return null
}

