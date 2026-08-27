import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { BadgeSchedule } from "./badge-schedule"
import { BadgeColdChain } from "./badge-coldchain"
import { AvailabilityPill } from "./availability-pill"
import { type Product, getManufacturer, getStrength } from "@/lib/data"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden shadow-soft transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lifted">
        <CardHeader className="p-0">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.brand_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                <span>No Image</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex-1 text-sm font-semibold line-clamp-2 transition-colors group-hover:text-primary">
              {product.brand_name}
            </h3>
            <BadgeSchedule schedule={product.schedule} />
          </div>
          <p className="text-xs text-muted-foreground">
            {getManufacturer(product)}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <BadgeColdChain coldChain={product.cold_chain} />
            <AvailabilityPill inStock={product.in_stock} />
          </div>
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              {getStrength(product)} • {product.pack_size}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}



