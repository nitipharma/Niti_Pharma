import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { BadgeSchedule } from "./badge-schedule"
import { BadgeColdChain } from "./badge-coldchain"
import { AvailabilityPill } from "./availability-pill"
import { type Product } from "@/lib/data"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.slug}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02]">
        <CardHeader className="p-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-muted">
            <Image
              src={product.images[0] || "/api/placeholder/400/400"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">
              {product.name}
            </h3>
            <BadgeSchedule schedule={product.schedule} />
          </div>
          <p className="text-xs text-muted-foreground">
            {product.manufacturer}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <BadgeColdChain coldChain={product.cold_chain} />
            <AvailabilityPill inStock={product.in_stock} />
          </div>
          <div className="pt-2">
            <p className="text-sm font-medium">
              ₹{product.price_mrp.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.pack_size}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}



