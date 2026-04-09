"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { Customer, Order } from "@/types/platform"

export function CustomersPageClient() {
  const { data: customers, loading: lc, error: ec } =
    useDemoFetch<Customer[]>("/api/customers")
  const { data: recentOrders, loading: lo, error: eo } = useDemoFetch<Order[]>(
    "/api/orders?dateRange=30&sort=date&sortDir=desc"
  )

  const loading = lc || lo
  const error = ec || eo

  const rows = useMemo(() => {
    if (!customers || !recentOrders) return []
    const spend = new Map<string, number>()
    const count = new Map<string, number>()
    for (const o of recentOrders) {
      spend.set(o.customerId, (spend.get(o.customerId) ?? 0) + o.totalAmount)
      count.set(o.customerId, (count.get(o.customerId) ?? 0) + 1)
    }
    return customers.map((c) => ({
      ...c,
      ordersThisMonth: count.get(c.id) ?? 0,
      spend: spend.get(c.id) ?? 0,
    }))
  }, [customers, recentOrders])

  return (
    <div className="container max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer operations</h1>
        <p className="text-sm text-muted-foreground">
          CRM-lite view of pharmacy and clinic accounts (simulated).
        </p>
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
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Region</th>
                    <th className="px-4 py-3 font-medium">Orders (30d)</th>
                    <th className="px-4 py-3 font-medium">Spend (30d)</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2 capitalize">{c.type}</td>
                      <td className="px-4 py-2">{c.region}</td>
                      <td className="px-4 py-2">{c.ordersThisMonth}</td>
                      <td className="px-4 py-2">
                        ${c.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={
                            c.accountStatus === "active"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
                          }
                        >
                          {c.accountStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/customers/${encodeURIComponent(c.id)}`}
                          className="text-primary text-sm underline-offset-4 hover:underline"
                        >
                          View
                        </Link>
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
