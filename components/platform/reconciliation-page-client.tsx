"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { downloadTextFile, exportReconciliationCsv } from "@/lib/csv-export"
import type { Order, ReconciliationRecord } from "@/types/platform"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { ChartShell } from "@/components/platform/chart-shell"

function MatchIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-emerald-600" />
  ) : (
    <X className="mx-auto h-4 w-4 text-red-600" />
  )
}

const DONUT_COLORS = ["#10b981", "#f59e0b", "#64748b"]

export function ReconciliationPageClient() {
  const searchParams = useSearchParams()
  const highlight = searchParams.get("highlight")

  const { data: rows, loading: loadingR, error: errR } =
    useDemoFetch<ReconciliationRecord[]>("/api/reconciliation")
  const { data: monthOrders, loading: loadingO, error: errO } = useDemoFetch<
    Order[]
  >("/api/orders?dateRange=30&sort=date&sortDir=desc")

  const loading = loadingR || loadingO
  const error = errR || errO

  const summary = useMemo(() => {
    if (!rows || !monthOrders) return null
    const ids = new Set(monthOrders.map((o) => o.id))
    const subset = rows.filter((r) => ids.has(r.orderId))
    return {
      total: subset.length,
      clean: subset.filter((r) => r.status === "Clean").length,
      pending: subset.filter((r) => r.status === "Pending").length,
      needsReview: subset.filter((r) => r.status === "Needs Review").length,
    }
  }, [rows, monthOrders])

  const pieData = useMemo(() => {
    if (!summary) return []
    return [
      { name: "Clean", value: summary.clean },
      { name: "Needs review", value: summary.needsReview },
      { name: "Pending", value: summary.pending },
    ].filter((d) => d.value > 0)
  }, [summary])

  const exportCsv = () => {
    if (!rows) return
    downloadTextFile(
      `reconciliation-${new Date().toISOString().slice(0, 10)}.csv`,
      exportReconciliationCsv(rows)
    )
  }

  const [filter, setFilter] = useState<"all" | "issues">("all")
  const displayRows = useMemo(() => {
    if (!rows) return []
    if (filter === "issues") {
      return rows.filter((r) => r.status !== "Clean")
    }
    return rows
  }, [rows, filter])

  return (
    <div className="container max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Three-way match across PO, invoice, and delivery records (simulated).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            type="button"
            variant={filter === "issues" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("issues")}
          >
            Needs review only
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={!rows?.length}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading || !summary ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Orders this month (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{summary.total}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fully reconciled</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {summary.clean}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{summary.pending}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {summary.needsReview}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Match health</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <ChartShell heightClass="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartShell>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Reconciliation table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 text-center font-medium">PO</th>
                      <th className="px-4 py-3 text-center font-medium">Invoice</th>
                      <th className="px-4 py-3 text-center font-medium">Delivery</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((r) => (
                      <tr
                        key={r.orderId}
                        className={cn(
                          "border-b border-border/50",
                          highlight === r.orderId && "bg-amber-500/10"
                        )}
                      >
                        <td className="px-4 py-2 font-mono text-xs">{r.orderId}</td>
                        <td className="px-4 py-2">
                          <MatchIcon ok={r.poMatched} />
                        </td>
                        <td className="px-4 py-2">
                          <MatchIcon ok={r.invoiceMatched} />
                        </td>
                        <td className="px-4 py-2">
                          <MatchIcon ok={r.deliveryMatched} />
                        </td>
                        <td className="px-4 py-2">
                          {r.status === "Clean" && (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              Clean
                            </span>
                          )}
                          {r.status === "Pending" && (
                            <span className="text-amber-700 dark:text-amber-300">
                              Pending
                            </span>
                          )}
                          {r.status === "Needs Review" && (
                            <span className="text-amber-800 dark:text-amber-200">
                              Needs review
                            </span>
                          )}
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
    </div>
  )
}
