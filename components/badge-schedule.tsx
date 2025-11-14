import { Badge } from "@/components/ui/badge"
import { type Product } from "@/lib/data"

interface BadgeScheduleProps {
  schedule: Product["schedule"]
}

export function BadgeSchedule({ schedule }: BadgeScheduleProps) {
  const variants: Record<Product["schedule"], { variant: "default" | "secondary" | "destructive"; label: string }> = {
    OTC: { variant: "default", label: "OTC" },
    Rx: { variant: "secondary", label: "Rx" },
    "Schedule H": { variant: "destructive", label: "Schedule H" },
  }

  const config = variants[schedule]

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  )
}



