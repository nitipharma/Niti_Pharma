import { Suspense } from "react"
import { ReconciliationPageClient } from "@/components/platform/reconciliation-page-client"

export default function ReconciliationPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ReconciliationPageClient />
    </Suspense>
  )
}
