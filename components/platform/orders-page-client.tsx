"use client"

import { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrderStatusBadge } from "@/components/platform/status-badges"
import { Skeleton } from "@/components/ui/skeleton"
import { downloadTextFile, exportOrdersCsv } from "@/lib/csv-export"
import type { SerializedOrder } from "@/lib/serializers/order"
import { ChevronLeft, ChevronRight, Download, Plus, Upload } from "lucide-react"

const PAGE_SIZE = 20

type OrderFilterStatus =
  | "all"
  | "processing"
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "exception"

function buildOrdersUrl(params: {
  search: string
  status: OrderFilterStatus
  dateRange: "7" | "30" | "90" | "all"
  sort: "date" | "amount" | "status"
  sortDir: "asc" | "desc"
}) {
  const qs = new URLSearchParams()
  if (params.search.trim()) qs.set("search", params.search.trim())
  qs.set("status", params.status)
  qs.set("dateRange", params.dateRange)
  qs.set("sort", params.sort)
  qs.set("sortDir", params.sortDir)
  return `/api/orders?${qs.toString()}`
}

export function OrdersPageClient() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<OrderFilterStatus>("all")
  const [dateRange, setDateRange] = useState<"7" | "30" | "90" | "all">("30")
  const [sort, setSort] = useState<"date" | "amount" | "status">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)

  const url = useMemo(
    () => buildOrdersUrl({ search, status, dateRange, sort, sortDir }),
    [search, status, dateRange, sort, sortDir]
  )

  const { data, loading, error } = useDemoFetch<SerializedOrder[]>(url)

  const totalPages = data ? Math.max(1, Math.ceil(data.length / PAGE_SIZE)) : 1
  const pageRows = useMemo(() => {
    if (!data) return []
    const start = (page - 1) * PAGE_SIZE
    return data.slice(start, start + PAGE_SIZE)
  }, [data, page])

  const onExport = useCallback(() => {
    if (!data?.length) return
    downloadTextFile(
      `orders-export-${new Date().toISOString().slice(0, 10)}.csv`,
      exportOrdersCsv(data)
    )
  }, [data])

  return (
    <div className="container max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Search and filter your wholesale orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="default" size="sm" asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New order
            </Link>
          </Button>
          <Button type="button" variant="secondary" size="sm" asChild>
            <Link href="/orders/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload PO
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={!data?.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Order ID or customer…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as OrderFilterStatus)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="in_transit">In transit</SelectItem>
              <SelectItem value="out_for_delivery">Out for delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="exception">Exception</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={dateRange}
            onValueChange={(v) => {
              setDateRange(v as typeof dateRange)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as typeof sort)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort: Date</SelectItem>
                <SelectItem value="amount">Sort: Amount</SelectItem>
                <SelectItem value="status">Sort: Status</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortDir}
              onValueChange={(v) => {
                setSortDir(v as typeof sortDir)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((o) => (
                      <tr key={o.id} className="border-b border-border/50">
                        <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                        <td className="px-4 py-3">{o.customerName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(o.placedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          ${o.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/orders/${encodeURIComponent(o.id)}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {data?.length ?? 0} orders
                  {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
