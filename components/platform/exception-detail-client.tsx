"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ExceptionStatusBadge } from "@/components/platform/status-badges"
import { getRecommendedAction } from "@/lib/demo-data"
import type { ExceptionRecord, Order } from "@/types/platform"
import { useToast } from "@/components/ui/use-toast"

type Props = {
  exc: ExceptionRecord
  order: Order | undefined
}

export function ExceptionDetailClient({ exc, order }: Props) {
  const { toast } = useToast()
  const [status, setStatus] = useState(exc.status)
  const [notes, setNotes] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Exception</p>
          <h1 className="font-mono text-xl font-bold">{exc.id}</h1>
          <div className="mt-2">
            <ExceptionStatusBadge status={status} />
          </div>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Flagged</p>
          <p>{new Date(exc.dateFlagged).toLocaleString()}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variance summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Type:</span>{" "}
            {exc.type.replace(/_/g, " ")}
          </p>
          <p>
            <span className="text-muted-foreground">Order:</span>{" "}
            <Link
              href={`/orders/${encodeURIComponent(exc.orderId)}`}
              className="font-mono text-primary underline-offset-4 hover:underline"
            >
              {exc.orderId}
            </Link>
          </p>
          {exc.documentId && (
            <p>
              <span className="text-muted-foreground">Document:</span>{" "}
              <Link
                href={`/documents/${encodeURIComponent(exc.documentId)}`}
                className="font-mono text-primary underline-offset-4 hover:underline"
              >
                {exc.documentId}
              </Link>
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Amount Δ:</span>{" "}
            {exc.amountDelta >= 0 ? "+" : ""}${exc.amountDelta.toFixed(2)}
          </p>
          {order && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Ordered vs received (line 1)
              </p>
              <p className="mt-1">
                Ordered qty: {order.lineItems[0]?.orderedQty ?? "—"} · Delivered
                qty: {order.lineItems[0]?.deliveredQty ?? "—"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommended action</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{getRecommendedAction(exc.type)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolution notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add internal notes (not saved — demo only)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <Button
            type="button"
            onClick={() => {
              setStatus("Resolved")
              toast({
                title: "Marked resolved",
                description: "Status updated for this browser session only.",
              })
            }}
          >
            Mark resolved
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
