import { Suspense } from "react"
import { OrderDetailClient } from "@/components/platform/order-detail-client"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const auth = await getAuthProfile()
  const canEditAsAdmin = auth ? isAdmin(auth.profile) : false

  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl space-y-4 px-4 py-8 sm:px-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <OrderDetailClient
        orderId={decodeURIComponent(id)}
        canEditAsAdmin={canEditAsAdmin}
      />
    </Suspense>
  )
}
