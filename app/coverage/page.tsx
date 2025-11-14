import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllCoverage } from "@/lib/data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Coverage - Niti Pharma",
  description: "Nationwide pharmaceutical distribution coverage across 15+ states.",
}

export default function CoveragePage() {
  const coverage = getAllCoverage()

  return (
    <div className="container py-8">
      <Breadcrumb items={[{ label: "Coverage" }]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Service Coverage</h1>
        <p className="text-lg text-muted-foreground">
          We provide reliable pharmaceutical distribution services across India with
          fast delivery times and comprehensive coverage.
        </p>
      </div>

      <div className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Coverage Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">15+ States Covered</p>
                <p className="text-sm text-muted-foreground">
                  Nationwide distribution network
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coverage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Cities</TableHead>
                  <TableHead>Service Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverage.map((item) => (
                  <TableRow key={item.state}>
                    <TableCell className="font-medium">{item.state}</TableCell>
                    <TableCell>{item.cities.join(", ")}</TableCell>
                    <TableCell>{item.service_days}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



