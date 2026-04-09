"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrders, getReportingAggregates, getTopCustomersByVolume } from "@/lib/demo-data"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChartShell } from "@/components/platform/chart-shell"

export default function MonthlyOrdersReportPage() {
  const orders30 = useMemo(
    () => getOrders({ dateRange: "30", sort: "date", sortDir: "desc" }),
    []
  )
  const byDay = useMemo(() => {
    const out: { date: string; orders: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const count = orders30.filter((o) => o.placedAt.slice(0, 10) === key)
        .length
      out.push({ date: key, orders: count })
    }
    return out
  }, [orders30])

  const topCust = useMemo(() => getTopCustomersByVolume(8), [])
  const { ordersByCategory } = useMemo(() => getReportingAggregates(), [])
  const pieData = ordersByCategory.map((x) => ({ name: x.name, value: x.value }))
  const COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"]

  return (
    <div className="container max-w-6xl space-y-8 px-4 py-8 sm:px-6 print:py-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports">← Reports</Link>
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Export PDF
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Monthly order volume</h1>
        <p className="text-sm text-muted-foreground">Last 30 days · simulated</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders per day</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartShell heightClass="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis width={28} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          </ChartShell>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By customer (top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartShell heightClass="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCust} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" />
                <YAxis dataKey="customerName" type="category" width={120} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="orderCount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </ChartShell>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By product category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartShell heightClass="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            </ChartShell>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
