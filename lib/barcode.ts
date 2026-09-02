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
 * Normalize a barcode to canonical GTIN-14 form.
 * Per GS1, GTIN-8/12/13 are stored right-aligned and zero-padded to 14
 * digits, so padding both sides makes comparison exact.
 */
export function normalizeGTIN(barcode: string): string {
  const digits = barcode.replace(/\D/g, "")
  if (digits.length === 0 || digits.length > 14) {
    return digits
  }
  return digits.padStart(14, "0")
}

/**
 * Find product by GTIN using canonical GTIN-14 comparison.
 * No substring fallback: a partial match could return the wrong product,
 * which is unacceptable for pharmaceutical identification.
 */
export async function findProductByGTIN(
  gtin: string,
  products: Array<{ gtin: string; id: string }>
): Promise<{ id: string; gtin: string } | null> {
  const normalized = normalizeGTIN(gtin)
  if (normalized.length !== 14) {
    return null
  }

  return products.find((p) => normalizeGTIN(p.gtin) === normalized) || null
}

