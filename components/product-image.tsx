"use client"

import Image from "next/image"
import { useState } from "react"

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
}

export function ProductImage({ src, alt, className, sizes }: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <span>No Image Available</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      onError={() => setHasError(true)}
    />
  )
}

