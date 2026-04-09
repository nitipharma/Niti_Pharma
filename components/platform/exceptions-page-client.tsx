"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExceptionStatusBadge } from "@/components/platform/status-badges"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ExceptionRecord, ExceptionStatus, ExceptionType } from "@/types/platform"

function buildUrl(
  type: ExceptionType | "all",
  status: ExceptionStatus | "all",
  dateRange: "7" | "30" | "90" | "all"
) {
  const qs = new URLSearchParams()
  if (type !== "all") qs.set("type", type)
  if (status !== "all") qs.set("status", status)
  if (dateRange !== "all") qs.set("dateRange", dateRange)
  const q = qs.toString()
  return `/api/exceptions${q ? `?${q}` : ""}`
}

function fmtType(t: ExceptionType) {
  return t.replace(/_/g, " ")
}

export function ExceptionsPageClient() {
  const [type, setType] = useState<ExceptionType | "all">("all")
  const [status, setStatus] = useState<ExceptionStatus | "all">("all")
  const [dateRange, setDateRange] = useState<"7" | "30" | "90" | "all">("90")

  const url = useMemo(
    () => buildUrl(type, status, dateRange),
    [type, status, dateRange]
  )
  const { data, loading, error } = useDemoFetch<ExceptionRecord[]>(url)

  return (
    <div className="container max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exceptions</h1>
        <p className="text-sm text-muted-foreground">
          Simulated variance cases for review and resolution.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          value={type}
          onValueChange={(v) => setType(v as typeof type)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="short-ship">Short-ship</SelectItem>
            <SelectItem value="invoice_mismatch">Invoice mismatch</SelectItem>
            <SelectItem value="overcharge">Overcharge</SelectItem>
            <SelectItem value="damaged_goods">Damaged goods</SelectItem>
            <SelectItem value="duplicate_invoice">Duplicate invoice</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as typeof status)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={dateRange}
          onValueChange={(v) => setDateRange(v as typeof dateRange)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Exception</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Δ Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Flagged</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {data?.map((e) => (
                    <tr key={e.id} className="border-b border-border/50">
                      <td className="px-4 py-2 font-mono text-xs">{e.id}</td>
                      <td className="px-4 py-2">{fmtType(e.type)}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {e.orderId}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {e.documentId ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        {e.amountDelta >= 0 ? "+" : ""}
                        ${e.amountDelta.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <ExceptionStatusBadge status={e.status} />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(e.dateFlagged).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/exceptions/${encodeURIComponent(e.id)}`}>
                            Open
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
  )
}
