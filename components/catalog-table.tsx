"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BadgeSchedule } from "./badge-schedule"
import { BadgeColdChain } from "./badge-coldchain"
import { AvailabilityPill } from "./availability-pill"
import { type Product } from "@/lib/data"

interface CatalogTableProps {
  products: Product[]
}

export function CatalogTable({ products }: CatalogTableProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Manufacturer</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="cursor-pointer">
              <TableCell>
                <Link
                  href={`/product/${product.slug}`}
                  className="font-medium hover:underline"
                >
                  {product.name}
                </Link>
                <div className="text-xs text-muted-foreground mt-1">
                  {product.strength} • {product.pack_size}
                </div>
              </TableCell>
              <TableCell>{product.manufacturer}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>
                <BadgeSchedule schedule={product.schedule} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {product.storage}
                  {product.cold_chain && <BadgeColdChain coldChain={true} />}
                </div>
              </TableCell>
              <TableCell>₹{product.price_mrp.toFixed(2)}</TableCell>
              <TableCell>
                <AvailabilityPill inStock={product.in_stock} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}



