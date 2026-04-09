"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  DashboardTimeSeriesPoint,
  DocumentVolumeByType,
  TopCustomerVolume,
} from "@/types/platform"

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  muted: "hsl(var(--muted-foreground))",
  amber: "rgb(245 158 11)",
  emerald: "rgb(16 185 129)",
}

function ChartTooltip() {
  return (
    <Tooltip
      contentStyle={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius)",
      }}
      labelStyle={{ color: "hsl(var(--foreground))" }}
    />
  )
}

export function DashboardCharts(props: {
  ordersOverTime: DashboardTimeSeriesPoint[]
  documentVolume: DocumentVolumeByType[]
  exceptionTrend: { date: string; rate: number }[]
  topCustomers: TopCustomerVolume[]
}) {
  const { ordersOverTime, documentVolume, exceptionTrend, topCustomers } = props

  const barData = documentVolume.map((d) => ({
    name: d.label,
    count: d.count,
  }))

  const hBarData = [...topCustomers]
    .reverse()
    .map((c) => ({
      name:
        c.customerName.length > 22
          ? `${c.customerName.slice(0, 20)}…`
          : c.customerName,
      fullName: c.customerName,
      orders: c.orderCount,
    }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders over time (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ordersOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} width={32} />
              <ChartTooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke={CHART_COLORS.emerald}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document volume by type</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={32} />
              <ChartTooltip />
              <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exception rate trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={exceptionTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} width={32} />
              <ChartTooltip />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={CHART_COLORS.amber}
                fill={CHART_COLORS.amber}
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top customers by order volume</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={hBarData}
              margin={{ left: 8, right: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 9 }}
              />
              <ChartTooltip />
              <Bar dataKey="orders" radius={[0, 4, 4, 0]}>
                {hBarData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i % 2 === 0
                        ? CHART_COLORS.emerald
                        : "hsl(var(--primary) / 0.75)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
