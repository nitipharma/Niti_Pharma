import Link from "next/link"
import { notFound } from "next/navigation"
import { getDocumentById } from "@/lib/demo-data"
import { DocumentDetailClient } from "@/components/platform/document-detail-client"
import { Button } from "@/components/ui/button"

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const doc = getDocumentById(decodeURIComponent(id))
  if (!doc) notFound()

  return (
    <div className="container max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link href="/documents">← Documents</Link>
          </Button>
          <h1 className="font-mono text-xl font-bold">{doc.id}</h1>
          <p className="text-sm text-muted-foreground">
            {doc.type.replace(/_/g, " ")} · {doc.vendorOrCustomer}
          </p>
        </div>
      </div>

      <DocumentDetailClient doc={doc} />

      <CardMetricHighlight />
    </div>
  )
}

function CardMetricHighlight() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm leading-relaxed">
      In production this workflow processed 1,000+ documents/month, reducing manual
      verification from 8–10 hrs/day to ~1.5–2 hrs/day through exception-based review.
    </div>
  )
}
