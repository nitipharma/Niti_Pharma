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
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Product</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[120px]">Manufacturer</TableHead>
              <TableHead className="hidden md:table-cell min-w-[100px]">Category</TableHead>
              <TableHead className="min-w-[100px]">Schedule</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[120px]">Storage</TableHead>
              <TableHead className="min-w-[100px]">Price</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
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
                  <div className="text-xs text-muted-foreground mt-1 sm:hidden">
                    {product.manufacturer} • {product.category}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{product.manufacturer}</TableCell>
                <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                <TableCell>
                  <BadgeSchedule schedule={product.schedule} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    {product.storage}
                    {product.cold_chain && <BadgeColdChain coldChain={true} />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">₹{product.price_mrp.toFixed(2)}</TableCell>
                <TableCell>
                  <AvailabilityPill inStock={product.in_stock} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}



