import { ProductCard } from "./product-card"
import { type Product } from "@/lib/data"

interface CatalogGridProps {
  products: Product[]
}

export function CatalogGrid({ products }: CatalogGridProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}



