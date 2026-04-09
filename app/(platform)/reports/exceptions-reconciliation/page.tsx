"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExceptions, getReconciliationRecords } from "@/lib/demo-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartShell } from "@/components/platform/chart-shell"

export default function ExceptionsReconciliationReportPage() {
  const exceptions = useMemo(() => getExceptions(), [])
  const recon = useMemo(() => getReconciliationRecords(), [])

  const byType = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of exceptions) {
      m.set(e.type, (m.get(e.type) ?? 0) + 1)
    }
    return Array.from(m.entries()).map(([name, count]) => ({
      name: name.replace(/_/g, " "),
      count,
    }))
  }, [exceptions])

  const resolved = exceptions.filter((e) => e.status === "Resolved").length
  const resolutionRate =
    exceptions.length === 0 ? 0 : Math.round((100 * resolved) / exceptions.length)

  const clean = recon.filter((r) => r.status === "Clean").length
  const reconRate = recon.length === 0 ? 0 : Math.round((100 * clean) / recon.length)

  return (
    <div className="container max-w-5xl space-y-8 px-4 py-8 sm:px-6 print:py-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports">← Reports</Link>
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Export PDF
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Exceptions & reconciliation</h1>
        <p className="text-sm text-muted-foreground">Simulated resolution metrics</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exception resolution rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{resolutionRate}%</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg time to resolve</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">~2.4 days</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">3-way clean match</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{reconRate}%</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exceptions by type</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartShell heightClass="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis width={32} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </ChartShell>
        </CardContent>
      </Card>
    </div>
  )
}
