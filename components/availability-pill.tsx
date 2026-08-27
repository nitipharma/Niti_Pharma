import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

interface AvailabilityPillProps {
  inStock: boolean
}

export function AvailabilityPill({ inStock }: AvailabilityPillProps) {
  return (
    <Badge
      variant="outline"
      className={
        inStock
          ? "border-primary/25 bg-accent text-accent-foreground text-xs"
          : "border-border bg-muted text-muted-foreground text-xs"
      }
    >
      {inStock ? (
        <>
          <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
          In Stock
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
          Out of Stock
        </>
      )}
    </Badge>
  )
}



