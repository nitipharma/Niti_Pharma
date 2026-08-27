import { notFound } from "next/navigation"
import Link from "next/link"
import { ProductImage } from "@/components/product-image"
import { Breadcrumb } from "@/components/breadcrumb"
import { BadgeSchedule } from "@/components/badge-schedule"
import { BadgeColdChain } from "@/components/badge-coldchain"
import { AvailabilityPill } from "@/components/availability-pill"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getManufacturer, getStrength, getFormDisplay } from "@/lib/data"
import {
  getProductBySlugServer as getProductBySlug,
  getProductsByIdsServer as getProductsByIds,
  getProductDocsServer as getProductDocs,
} from "@/lib/data-server"
import { FileText, ExternalLink } from "lucide-react"
import type { Metadata } from "next"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const product = await getProductBySlug(slug)
    
    if (!product) {
      return {
        title: "Product Not Found",
      }
    }

    return {
      title: product.brand_name,
      description: `${product.brand_name} by ${getManufacturer(product)}. ${product.therapeutic_class} - ${getStrength(product)}`,
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Product",
      description: "Product information",
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params

  let product
  try {
    product = await getProductBySlug(slug)
  } catch (error) {
    console.error("Error loading product page:", error)
    return (
      <div className="container py-4 sm:py-8 px-4 sm:px-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error Loading Product</h1>
          <p className="text-muted-foreground mb-4">
            An error occurred while loading the product. Please try again.
          </p>
          <Link href="/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Outside the try so the NEXT_NOT_FOUND throw isn't swallowed by the catch
  if (!product) {
    notFound()
  }

  const substitutes = product.substitutes && product.substitutes.length > 0
    ? await getProductsByIds(product.substitutes).catch(() => [])
    : []

  const docs = await getProductDocs(product.id).catch(() => null)

  return (
    <div className="container py-4 sm:py-8 px-4 sm:px-6">
      <Breadcrumb
        items={[
          { label: "Catalog", href: "/catalog" },
          { label: product.brand_name },
        ]}
      />

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted mb-4">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <ProductImage
                src={product.images[0]}
                alt={product.brand_name || "Product image"}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <span>No Image Available</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold pr-2">{product.brand_name}</h1>
              <BadgeSchedule schedule={product.schedule} />
            </div>
            <p className="text-base sm:text-lg text-muted-foreground mb-4">
              {getManufacturer(product)}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
              <BadgeColdChain coldChain={product.cold_chain} />
              <AvailabilityPill inStock={product.in_stock} />
            </div>
            <div className="text-sm text-muted-foreground mb-4 sm:mb-6">
              <p className="font-medium">{getStrength(product) || "N/A"}</p>
              <p>{product.pack_size || "N/A"}</p>
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
                      <TableCell className="break-all">{product.ndc || "N/A"}</TableCell>
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
                      <TableCell className="font-medium">Therapeutic Class</TableCell>
                      <TableCell>{product.therapeutic_class}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Dosage Form</TableCell>
                      <TableCell>{getFormDisplay(product)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Release Type</TableCell>
                      <TableCell>{product.release_type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Active Ingredients</TableCell>
                      <TableCell>
                        {product.actives && product.actives.length > 0 ? (
                          product.actives.map((active, idx) => (
                            <span key={idx}>
                              {active.inn} {active.mg}mg{product.dosage_form === "syrup" ? "/5ml" : ""}
                              {idx < product.actives.length - 1 ? " + " : ""}
                            </span>
                          ))
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Pack Size</TableCell>
                      <TableCell>{product.pack_size}</TableCell>
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
              <Card key={sub.id} className="shadow-soft transition-shadow hover:border-primary/30 hover:shadow-lifted">
                <CardHeader>
                  <Link
                    href={`/product/${sub.slug}`}
                    className="font-semibold hover:underline text-sm sm:text-base"
                  >
                    {sub.brand_name}
                  </Link>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {getManufacturer(sub)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <BadgeSchedule schedule={sub.schedule} />
                    <AvailabilityPill inStock={sub.in_stock} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getStrength(sub)} • {sub.pack_size}
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



