import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getCustomerById,
  getCustomerBilling,
  getCustomerMetrics,
  getDocumentsForCustomer,
  getExceptionsForCustomer,
  getOrdersForCustomer,
} from "@/lib/demo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerDetailTabs } from "@/components/platform/customer-detail-tabs"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = getCustomerById(decodeURIComponent(id))
  if (!customer) notFound()

  const metrics = getCustomerMetrics(customer.id)
  const orders = getOrdersForCustomer(customer.id, 20)
  const docs = getDocumentsForCustomer(customer.id).slice(0, 15)
  const excs = getExceptionsForCustomer(customer.id)
  const billing = getCustomerBilling(customer.id)

  return (
    <div className="container max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <Link
        href="/customers"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Customers
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {customer.type} · {customer.region} · {customer.city}, {customer.state}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg order value</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            ${metrics.avgOrderValue.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-time rate</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">{metrics.onTimeRate}%</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exception rate</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {metrics.exceptionRate}%
          </CardContent>
        </Card>
      </div>

      <CustomerDetailTabs
        orders={orders}
        docs={docs}
        excCount={excs.length}
        billing={billing}
      />
    </div>
  )
}
