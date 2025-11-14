import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Breadcrumb } from "@/components/breadcrumb"
import { BadgeSchedule } from "@/components/badge-schedule"
import { BadgeColdChain } from "@/components/badge-coldchain"
import { AvailabilityPill } from "@/components/availability-pill"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getProductBySlug, getProductsByIds, getProductDocs } from "@/lib/data"
import { FileText, ExternalLink } from "lucide-react"
import type { Metadata } from "next"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  
  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  return {
    title: `${product.name} - Niti Pharma`,
    description: `${product.name} by ${product.manufacturer}. ${product.category} - ${product.strength}`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const substitutes = await getProductsByIds(product.substitutes)
  const docs = getProductDocs(product.id)

  return (
    <div className="container py-4 sm:py-8 px-4 sm:px-6">
      <Breadcrumb
        items={[
          { label: "Catalog", href: "/catalog" },
          { label: product.name },
        ]}
      />

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted mb-4">
            <Image
              src={product.images[0] || "/api/placeholder/400/400"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold pr-2">{product.name}</h1>
              <BadgeSchedule schedule={product.schedule} />
            </div>
            <p className="text-base sm:text-lg text-muted-foreground mb-4">
              {product.manufacturer}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
              <BadgeColdChain coldChain={product.cold_chain} />
              <AvailabilityPill inStock={product.in_stock} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">
              ₹{product.price_mrp.toFixed(2)}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">NDC</TableCell>
                      <TableCell className="break-all">{product.ndc}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">GTIN</TableCell>
                      <TableCell className="break-all">{product.gtin}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">HSN</TableCell>
                      <TableCell className="break-all">{product.hsn}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Category</TableCell>
                      <TableCell>{product.category}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Form</TableCell>
                      <TableCell>{product.form}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Strength</TableCell>
                      <TableCell>{product.strength}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Pack Size</TableCell>
                      <TableCell>{product.pack_size}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Storage</TableCell>
                      <TableCell>{product.storage}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {docs && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" asChild className="w-full justify-start">
                  <a href={docs.sdsUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Safety Data Sheet (SDS)
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <a href={docs.labelUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Product Label
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {substitutes.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Eligible Substitutes</h2>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {substitutes.map((sub) => (
              <Card key={sub.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Link
                    href={`/product/${sub.slug}`}
                    className="font-semibold hover:underline text-sm sm:text-base"
                  >
                    {sub.name}
                  </Link>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {sub.manufacturer}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <BadgeSchedule schedule={sub.schedule} />
                    <AvailabilityPill inStock={sub.in_stock} />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-primary">
                    ₹{sub.price_mrp.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



