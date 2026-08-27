import { Badge } from "@/components/ui/badge"
import { type Product } from "@/lib/data"

interface BadgeScheduleProps {
  schedule: Product["schedule"]
}

const styles: Record<Product["schedule"], string> = {
  OTC: "border-primary/25 bg-accent text-accent-foreground",
  Rx: "border-border bg-secondary text-secondary-foreground",
  "Schedule H":
    "border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
}

export function BadgeSchedule({ schedule }: BadgeScheduleProps) {
  return (
    <Badge variant="outline" className={`text-xs ${styles[schedule]}`}>
      {schedule}
    </Badge>
  )
}
