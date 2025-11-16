"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgeSchedule } from "./badge-schedule"
import { BadgeColdChain } from "./badge-coldchain"
import { AvailabilityPill } from "./availability-pill"
import { EmptyState } from "./empty-state"
import { type MatchedProduct, type MatchTier } from "@/lib/match"
import { getManufacturer, getStrength } from "@/lib/data"
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

interface MatchResultsPanelProps {
  results: MatchedProduct[]
  notAvailable: boolean
}

const tierConfig: Record<
  MatchTier,
  { title: string; icon: React.ReactNode; badgeVariant: "default" | "secondary" | "outline" }
> = {
  EXACT: {
    title: "Exact Matches",
    icon: <CheckCircle2 className="h-4 w-4" />,
    badgeVariant: "default",
  },
  CLOSE: {
    title: "Close Matches",
    icon: <AlertCircle className="h-4 w-4" />,
    badgeVariant: "secondary",
  },
  ALTERNATIVE: {
    title: "Therapeutic Alternatives",
    icon: <ArrowRight className="h-4 w-4" />,
    badgeVariant: "outline",
  },
}

export function MatchResultsPanel({ results, notAvailable }: MatchResultsPanelProps) {
  if (notAvailable || results.length === 0) {
    return (
      <EmptyState
        title="Product Not Available"
        description="We couldn't find any matching products in our inventory. Please try adjusting the composition or contact our sales team for assistance."
      />
    )
  }

  // Group results by tier
  const exact = results.filter((r) => r.tier === "EXACT")
  const close = results.filter((r) => r.tier === "CLOSE")
  const alternative = results.filter((r) => r.tier === "ALTERNATIVE")

  return (
    <div className="space-y-6">
      {/* Exact Matches */}
      {exact.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {tierConfig.EXACT.icon}
            <h2 className="text-xl font-semibold">{tierConfig.EXACT.title}</h2>
            <Badge variant={tierConfig.EXACT.badgeVariant}>{exact.length}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exact.map((match) => (
              <ProductMatchCard key={match.product.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Close Matches */}
      {close.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {tierConfig.CLOSE.icon}
            <h2 className="text-xl font-semibold">{tierConfig.CLOSE.title}</h2>
            <Badge variant={tierConfig.CLOSE.badgeVariant}>{close.length}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {close.map((match) => (
              <ProductMatchCard key={match.product.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Therapeutic Alternatives */}
      {alternative.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {tierConfig.ALTERNATIVE.icon}
            <h2 className="text-xl font-semibold">{tierConfig.ALTERNATIVE.title}</h2>
            <Badge variant={tierConfig.ALTERNATIVE.badgeVariant}>{alternative.length}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alternative.map((match) => (
              <ProductMatchCard key={match.product.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductMatchCard({ match }: { match: MatchedProduct }) {
  const { product } = match

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {product.brand_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {getManufacturer(product)}
            </p>
          </div>
          <BadgeSchedule schedule={product.schedule} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{product.therapeutic_class}</p>
          <p className="text-xs text-muted-foreground">
            {getStrength(product)} • {product.pack_size}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <BadgeColdChain coldChain={product.cold_chain} />
          <AvailabilityPill inStock={product.in_stock} />
        </div>

        {match.notes && match.notes.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            {match.notes.slice(0, 2).map((note, idx) => (
              <div key={idx}>• {note}</div>
            ))}
          </div>
        )}

        <Link
          href={`/product/${product.slug}`}
          className="flex items-center text-sm text-primary hover:underline"
        >
          View details
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </CardContent>
    </Card>
  )
}

