"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import type { CustomerBillingInvoice } from "@/types/platform"

type Props = {
  outstanding: CustomerBillingInvoice[]
  paid: CustomerBillingInvoice[]
  totalOutstanding: number
}

export function CustomerBillingTab({
  outstanding,
  paid,
  totalOutstanding,
}: Props) {
  const { toast } = useToast()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">Total outstanding</p>
        <p className="text-2xl font-bold">
          ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Outstanding invoices</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Due</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {outstanding.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50">
                  <td className="px-3 py-2 font-mono text-xs">{inv.id}</td>
                  <td className="px-3 py-2">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{inv.dueDate}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Reminder sent",
                          description: "Simulated notification — no message was delivered.",
                        })
                      }
                    >
                      Send reminder
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Paid invoices (last 90 days)</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50">
                  <td className="px-3 py-2 font-mono text-xs">{inv.id}</td>
                  <td className="px-3 py-2">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {inv.paidAt ?? inv.dueDate}
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
