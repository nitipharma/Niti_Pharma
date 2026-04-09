import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getDocumentsForOrder,
  getExceptionsForOrder,
  getOrderById,
  getOrderTimeline,
} from "@/lib/demo-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrderStatusBadge } from "@/components/platform/status-badges"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, Circle } from "lucide-react"

function fmtDocType(t: string) {
  return t.replace(/_/g, " ")
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = getOrderById(decodeURIComponent(id))
  if (!order) notFound()

  const docs = getDocumentsForOrder(order.id)
  const excs = getExceptionsForOrder(order.id)
  const timeline = getOrderTimeline(order.id)

  return (
    <div className="container max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h1 className="text-2xl font-bold font-mono">{order.id}</h1>
          <p className="mt-1 text-muted-foreground">{order.customerName}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            {excs.length > 0 && (
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200">
                Exception linked
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-muted-foreground">Placed</p>
          <p>{new Date(order.placedAt).toLocaleString()}</p>
          <p className="mt-2 text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">
            ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link href={`/reconciliation?highlight=${encodeURIComponent(order.id)}`}>
          View reconciliation
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lineItems.map((li, i) => (
                <TableRow key={i}>
                  <TableCell>{li.productName}</TableCell>
                  <TableCell className="text-right">{li.orderedQty}</TableCell>
                  <TableCell className="text-right">{li.deliveredQty}</TableCell>
                  <TableCell className="text-right">
                    ${li.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${li.lineTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked documents</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 last:border-0">
                <span>
                  <span className="font-mono text-xs">{d.id}</span>{" "}
                  <span className="text-muted-foreground">({fmtDocType(d.type)})</span>
                </span>
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={`/documents/${encodeURIComponent(d.id)}`}>Open</Link>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {timeline.map((step) => (
              <li key={step.id} className="relative">
                <span className="absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-background">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
                <p className="font-medium">{step.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(step.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
