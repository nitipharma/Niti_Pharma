import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Platform demo pages and APIs aren't useful in search results
        disallow: ["/api/", "/dashboard", "/orders", "/tracking", "/documents", "/exceptions", "/reconciliation", "/reports", "/billing", "/customers"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
