import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, AlertTriangle, Truck } from "lucide-react"

const items = [
  {
    href: "/reports/monthly-orders",
    title: "Monthly order volume",
    description: "Orders per day, by customer, and by category",
    icon: BarChart3,
  },
  {
    href: "/reports/document-processing",
    title: "Document processing",
    description: "Volume, accuracy, exceptions, processing time",
    icon: FileText,
  },
  {
    href: "/reports/exceptions-reconciliation",
    title: "Exceptions & reconciliation",
    description: "Types, resolution rate, time to resolve",
    icon: AlertTriangle,
  },
  {
    href: "/reports/delivery-performance",
    title: "Delivery performance",
    description: "On-time rate, delays, carrier performance",
    icon: Truck,
  },
]

export default function ReportsIndexPage() {
  return (
    <div className="container max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reporting</h1>
        <p className="text-sm text-muted-foreground">
          Pre-built operational reports — print-friendly layouts.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <item.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary">Open report →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
