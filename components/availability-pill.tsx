import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

interface AvailabilityPillProps {
  inStock: boolean
}

export function AvailabilityPill({ inStock }: AvailabilityPillProps) {
  return (
    <Badge
      variant={inStock ? "default" : "secondary"}
      className="text-xs"
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



