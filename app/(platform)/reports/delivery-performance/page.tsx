"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardMetrics, getReportingAggregates } from "@/lib/demo-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartShell } from "@/components/platform/chart-shell"

export default function DeliveryPerformanceReportPage() {
  const metrics = useMemo(() => getDashboardMetrics(), [])
  const { carrierPerformance, delayReasons } = useMemo(
    () => getReportingAggregates(),
    []
  )

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
        <h1 className="text-2xl font-bold">Delivery performance</h1>
        <p className="text-sm text-muted-foreground">Carrier and delay mix (simulated)</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">On-time delivery rate</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{metrics.onTimeDeliveryRate}%</CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Carrier on-time %</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartShell heightClass="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="carrier" />
                <YAxis domain={[80, 100]} width={28} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="onTime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </ChartShell>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delay reasons (count)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartShell heightClass="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayReasons}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="reason" tick={{ fontSize: 9 }} />
                <YAxis width={28} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </ChartShell>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
