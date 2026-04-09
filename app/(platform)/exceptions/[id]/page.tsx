import Link from "next/link"
import { notFound } from "next/navigation"
import { getExceptionById, getOrderById } from "@/lib/demo-data"
import { ExceptionDetailClient } from "@/components/platform/exception-detail-client"
import { Button } from "@/components/ui/button"

export default async function ExceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const exc = getExceptionById(decodeURIComponent(id))
  if (!exc) notFound()
  const order = getOrderById(exc.orderId)

  return (
    <div className="container max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/exceptions">← Exceptions</Link>
      </Button>
      <ExceptionDetailClient exc={exc} order={order} />
    </div>
  )
}
