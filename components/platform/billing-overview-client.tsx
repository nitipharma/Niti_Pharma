"use client"

import { useMemo, useState } from "react"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

type InvoiceRow = {
  id: string
  orderId: string
  amount: number
  dueDate: string
  paidAt: string | null
  status: string
  customer: { name: string; email: string | null }
}

export function BillingOverviewClient() {
  const { toast } = useToast()
  const { data: invoices, loading } = useDemoFetch<InvoiceRow[]>(
    "/api/billing/invoices"
  )

  const metrics = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const rows = invoices ?? []
    const outstanding = rows.filter(
      (i) => i.status === "outstanding" || i.status === "overdue"
    )
    const overdue = outstanding.filter((i) => new Date(i.dueDate) < now)
    const collected = rows
      .filter((i) => i.status === "paid" && i.paidAt)
      .filter((i) => new Date(i.paidAt!) >= monthStart)
    return {
      totalOutstanding: outstanding.reduce((s, i) => s + i.amount, 0),
      totalOverdue: overdue.reduce((s, i) => s + i.amount, 0),
      collectedMonth: collected.reduce((s, i) => s + i.amount, 0),
      awaitingCount: outstanding.length,
    }
  }, [invoices])

  const bulk = async () => {
    const res = await fetch("/api/billing/reminders/bulk", { method: "POST" })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "Bulk send failed",
        description: typeof json?.error === "string" ? json.error : "Error",
      })
      return
    }
    toast({
      title: "Reminders sent",
      description: `Sent ${String(json.sent)} (errors: ${String(json.errors)})`,
    })
  }

  return (
    <div className="container max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Outstanding invoices and collections (admin).
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void bulk()}>
          Send reminders (overdue)
        </Button>
      </div>

      {loading || !invoices ? (
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
                Total outstanding
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              $
              {metrics.totalOutstanding.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total overdue</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-red-700 dark:text-red-300">
              $
              {metrics.totalOverdue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Collected this month
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              $
              {metrics.collectedMonth.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Awaiting payment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {metrics.awaitingCount}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoices ?? []).map((i) => (
                    <tr key={i.id} className="border-b border-border/50">
                      <td className="px-4 py-2 font-mono text-xs">{i.id}</td>
                      <td className="px-4 py-2">{i.customer.name}</td>
                      <td className="px-4 py-2 font-mono text-xs">{i.orderId}</td>
                      <td className="px-4 py-2">${i.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(i.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">{i.status}</td>
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
