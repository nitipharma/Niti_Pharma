import type { MetadataRoute } from "next"
import { getAllProductsServer } from "@/lib/data-server"
import { getSiteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/coverage`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/platform`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ]

  const products = await getAllProductsServer().catch(() => [])
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/product/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
