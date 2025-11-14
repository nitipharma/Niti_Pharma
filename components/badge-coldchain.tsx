import { Badge } from "@/components/ui/badge"
import { Snowflake } from "lucide-react"

interface BadgeColdChainProps {
  coldChain: boolean
}

export function BadgeColdChain({ coldChain }: BadgeColdChainProps) {
  if (!coldChain) return null

  return (
    <Badge variant="outline" className="text-xs">
      <Snowflake className="h-3 w-3 mr-1" aria-hidden="true" />
      Cold Chain
    </Badge>
  )
}



