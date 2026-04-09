"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DocumentStatusBadge } from "@/components/platform/status-badges"
import type { Document, DocumentType } from "@/types/platform"

function buildUrl(tab: string, search: string) {
  const qs = new URLSearchParams()
  if (tab !== "all") qs.set("type", tab)
  if (search.trim()) qs.set("search", search.trim())
  const q = qs.toString()
  return `/api/documents${q ? `?${q}` : ""}`
}

function fmtType(t: DocumentType) {
  if (t === "purchase_order") return "PO"
  if (t === "delivery_record") return "Delivery"
  return "Invoice"
}

export function DocumentsPageClient() {
  const [tab, setTab] = useState<string>("all")
  const [search, setSearch] = useState("")
  const url = useMemo(() => buildUrl(tab, search), [tab, search])
  const { data, loading, error } = useDemoFetch<Document[]>(url)

  return (
    <div className="container max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI document processing</h1>
        <p className="text-sm text-muted-foreground">
          Simulated extraction and validation pipeline for invoices, POs, and delivery records.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="invoice">Invoices</TabsTrigger>
          <TabsTrigger value="purchase_order">Purchase Orders</TabsTrigger>
          <TabsTrigger value="delivery_record">Delivery Records</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-4">
        <Input
          placeholder="Search doc ID, customer, or order…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Doc ID</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {data?.map((d) => (
                      <tr key={d.id} className="border-b border-border/50">
                        <td className="px-4 py-2 font-mono text-xs">{d.id}</td>
                        <td className="px-4 py-2">{fmtType(d.type)}</td>
                        <td className="px-4 py-2">{d.vendorOrCustomer}</td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {d.date}
                        </td>
                        <td className="px-4 py-2">
                          ${d.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          <DocumentStatusBadge status={d.status} />
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {d.matchedOrderId ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/documents/${encodeURIComponent(d.id)}`}>
                              Review
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 text-sm leading-relaxed">
          In production this workflow processed 1,000+ documents/month, reducing manual
          verification from 8–10 hrs/day to ~1.5–2 hrs/day through exception-based review.
        </CardContent>
      </Card>
    </div>
  )
}
