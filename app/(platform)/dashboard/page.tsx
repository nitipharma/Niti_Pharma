import dynamic from "next/dynamic"
import {
  getDashboardMetrics,
  getDocumentVolumeByType,
  getExceptionRateTrendLast30,
  getOrdersOverTimeLast30Days,
  getRecentOrders,
  getTopCustomersByVolume,
} from "@/lib/demo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/platform/status-badges"
import { Package, FileStack, AlertTriangle, Clock, Truck } from "lucide-react"

const DashboardCharts = dynamic(
  () =>
    import("@/components/platform/dashboard-charts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[280px] animate-pulse rounded-xl border bg-muted/40"
          />
        ))}
      </div>
    ),
  }
)

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export default function DashboardPage() {
  const metrics = getDashboardMetrics()
  const ordersOverTime = getOrdersOverTimeLast30Days()
  const documentVolume = getDocumentVolumeByType()
  const exceptionTrend = getExceptionRateTrendLast30()
  const topCustomers = getTopCustomersByVolume(8)
  const recent = getRecentOrders(10)

  return (
    <div className="container max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Operations dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulated distributor operations overview — metrics refresh daily.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders this month</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ordersThisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents processed</CardTitle>
            <FileStack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.documentsProcessed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.exceptionsFlagged}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.exceptionsResolvedPercent}% resolved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual review saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold leading-tight">
              {metrics.manualReviewHoursSavedLabel}
            </div>
            <p className="text-xs text-muted-foreground">vs. full manual entry</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-time delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.onTimeDeliveryRate}%</div>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts
        ordersOverTime={ordersOverTime}
        documentVolume={documentVolume}
        exceptionTrend={exceptionTrend}
        topCustomers={topCustomers}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Order</th>
                  <th className="pb-2 pr-3 font-medium">Customer</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Amount</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-mono text-xs">{o.id}</td>
                    <td className="py-2 pr-3">{o.customerName}</td>
                    <td className="py-2 pr-3">{o.productCategory}</td>
                    <td className="py-2 pr-3">
                      ${o.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 pr-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="py-2 text-muted-foreground">{fmtDate(o.placedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
