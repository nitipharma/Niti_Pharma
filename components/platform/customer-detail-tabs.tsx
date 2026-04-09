"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerBillingTab } from "@/components/platform/customer-billing-tab"
import type { Document, Order } from "@/types/platform"

type Props = {
  customerId: string
  orders: Order[]
  docs: Document[]
  excCount: number
}

export function CustomerDetailTabs({
  customerId,
  orders,
  docs,
  excCount,
}: Props) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order history (last 20)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/orders/${encodeURIComponent(o.id)}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {o.id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(o.placedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${o.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>{o.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {docs.map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <span className="font-mono text-xs">{d.id}</span>
                  <Link
                    href={`/documents/${encodeURIComponent(d.id)}`}
                    className="text-primary text-xs underline-offset-4 hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{excCount}</p>
            <p className="text-sm text-muted-foreground">
              Open and historical cases linked to this account
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="billing" className="mt-4">
        <CustomerBillingTab customerId={customerId} />
      </TabsContent>
    </Tabs>
  )
}
