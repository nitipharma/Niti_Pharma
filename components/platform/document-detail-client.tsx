"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Document } from "@/types/platform"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function DocumentDetailClient({ doc }: { doc: Document }) {
  const fieldRows = useMemo(
    () => [
      { key: "vendor", label: "Vendor", value: doc.extractedFields.vendor },
      {
        key: "doc_number",
        label: "Document #",
        value: doc.extractedFields.doc_number,
      },
      { key: "date", label: "Date", value: doc.extractedFields.date },
      {
        key: "po_reference",
        label: "PO reference",
        value: doc.extractedFields.po_reference ?? "—",
      },
      {
        key: "total",
        label: "Total",
        value: `$${doc.extractedFields.total.toFixed(2)}`,
      },
    ],
    [doc]
  )

  const lineRows = doc.extractedFields.line_items

  const [visible, setVisible] = useState(0)
  useEffect(() => {
    setVisible(0)
    const total = fieldRows.length + lineRows.length
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setVisible(n)
      if (n >= total) window.clearInterval(id)
    }, 80)
    return () => window.clearInterval(id)
  }, [doc.id, fieldRows.length, lineRows.length])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Source document</CardTitle>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Simulated document — for illustration
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {doc.simulatedContent.vendorName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {doc.simulatedContent.vendorAddress}
            </p>
            <div className="mt-4 border-t pt-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.simulatedContent.lineItems.map((li, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="py-1 pr-2">{li.description}</td>
                      <td className="py-1 text-right">{li.qty}</td>
                      <td className="py-1 text-right">
                        ${li.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
              <span>Total</span>
              <span>${doc.simulatedContent.total.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Doc #{doc.simulatedContent.docNumber} · {doc.simulatedContent.date}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">AI extracted fields</CardTitle>
          <p className="text-xs text-muted-foreground">
            Extracted by document parser
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {fieldRows.map((row, i) => {
            const show = visible > i
            return (
              <div
                key={row.key}
                className={cn(
                  "flex items-start justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm transition-opacity duration-200",
                  show ? "opacity-100" : "opacity-0"
                )}
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="flex items-center gap-1 text-right font-medium">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  {row.value}
                </span>
              </div>
            )
          })}
          <p className="pt-2 text-xs font-medium text-muted-foreground">
            Line items
          </p>
          {lineRows.map((li, i) => {
            const show = visible > fieldRows.length + i
            return (
              <div
                key={i}
                className={cn(
                  "rounded-md border border-border/60 px-3 py-2 text-xs transition-opacity",
                  show ? "opacity-100" : "opacity-0"
                )}
              >
                <div className="flex justify-between gap-2">
                  <span>{li.description}</span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    {li.qty} × ${li.unit_price.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Validation result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                doc.validation.overall === "VALIDATED"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                  : "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-100"
              }
            >
              {doc.validation.overall}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Confidence: {doc.confidence}%
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Ordered</th>
                  <th className="pb-2 text-right">Extracted</th>
                  <th className="pb-2 text-center">Match</th>
                </tr>
              </thead>
              <tbody>
                {doc.validation.lineComparisons.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-2">{row.productName}</td>
                    <td className="py-2 text-right">{row.orderedQty}</td>
                    <td className="py-2 text-right">{row.extractedQty}</td>
                    <td className="py-2 text-center">
                      {row.match ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-red-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {doc.validation.mismatchDetail && (
            <p className="text-sm text-amber-900 dark:text-amber-100">
              {doc.validation.mismatchDetail}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
