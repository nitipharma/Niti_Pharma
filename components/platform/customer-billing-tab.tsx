"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Me = { isAdmin: boolean }

type InvoiceRow = {
  id: string
  orderId: string
  amount: number
  dueDate: string
  paidAt?: string | null
  status: string
  customer: { name: string; email: string | null }
}

type Props = {
  customerId: string
}

export function CustomerBillingTab({ customerId }: Props) {
  const { toast } = useToast()
  const { data: me } = useDemoFetch<Me>("/api/me")
  const url = `/api/billing/invoices?customerId=${encodeURIComponent(customerId)}`
  const { data: invoices, loading } = useDemoFetch<InvoiceRow[]>(url)

  const outstanding = useMemo(
    () =>
      (invoices ?? []).filter(
        (i) => i.status === "outstanding" || i.status === "overdue"
      ),
    [invoices]
  )

  const paid90 = useMemo(() => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    return (invoices ?? []).filter((i) => {
      if (i.status !== "paid" || !i.paidAt) return false
      return new Date(i.paidAt).getTime() >= cutoff
    })
  }, [invoices])

  const totalOutstanding = useMemo(
    () => outstanding.reduce((s, i) => s + i.amount, 0),
    [outstanding]
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sendReminder = async (id: string) => {
    const res = await fetch(
      `/api/billing/invoices/${encodeURIComponent(id)}/reminder`,
      { method: "POST" }
    )
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "Could not send",
        description: typeof json?.error === "string" ? json.error : "Error",
      })
      return
    }
    toast({
      title: "Reminder sent",
      description: `Reminder sent to ${String(json.sentTo)}`,
    })
  }

  const markPaid = async (id: string) => {
    const res = await fetch(`/api/billing/invoices/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    })
    if (!res.ok) {
      toast({ variant: "destructive", title: "Could not update invoice" })
      return
    }
    toast({ title: "Marked paid" })
    window.location.reload()
  }

  if (loading || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total outstanding
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            $
            {totalOutstanding.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue amount</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-700 dark:text-red-300">
            $
            {outstanding
              .filter((i) => new Date(i.dueDate) < today)
              .reduce((s, i) => s + i.amount, 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid this month</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            $
            {(invoices ?? [])
              .filter((i) => {
                if (i.status !== "paid" || !i.paidAt) return false
                const d = new Date(i.paidAt)
                return (
                  d.getMonth() === today.getMonth() &&
                  d.getFullYear() === today.getFullYear()
                )
              })
              .reduce((s, i) => s + i.amount, 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Outstanding invoices</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Due</th>
                <th className="px-3 py-2 font-medium">Days</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {outstanding.map((inv) => {
                const due = new Date(inv.dueDate)
                const days = Math.ceil(
                  (due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
                )
                const overdue = due < today
                return (
                  <tr key={inv.id} className="border-b border-border/50">
                    <td className="px-3 py-2 font-mono text-xs">{inv.id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{inv.orderId}</td>
                    <td className="px-3 py-2">${inv.amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {due.toLocaleDateString()}
                    </td>
                    <td
                      className={
                        overdue ? "text-red-700 dark:text-red-300" : undefined
                      }
                    >
                      {overdue ? `${-days} overdue` : `${days}d`}
                    </td>
                    <td className="px-3 py-2">{inv.status}</td>
                    <td className="px-3 py-2 text-right">
                      {me.isAdmin && (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void sendReminder(inv.id)}
                          >
                            Send reminder
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void markPaid(inv.id)}
                          >
                            Mark paid
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Payment history (last 90 days)</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {paid90.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50">
                  <td className="px-3 py-2 font-mono text-xs">{inv.id}</td>
                  <td className="px-3 py-2 font-mono text-xs">{inv.orderId}</td>
                  <td className="px-3 py-2">${inv.amount.toFixed(2)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {inv.paidAt
                      ? new Date(inv.paidAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
