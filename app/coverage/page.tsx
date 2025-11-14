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
    <div className="container py-4 sm:py-8 px-4 sm:px-6">
      <Breadcrumb items={[{ label: "Coverage" }]} />
      
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 sm:mb-4">Service Coverage</h1>
        <p className="text-sm sm:text-lg text-muted-foreground">
          We provide reliable pharmaceutical distribution services across India with
          fast delivery times and comprehensive coverage.
        </p>
      </div>

      <div className="mb-8 sm:mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Coverage Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center px-4">
                <p className="text-base sm:text-lg font-semibold mb-2">15+ States Covered</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nationwide distribution network
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Coverage Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">State</TableHead>
                    <TableHead className="min-w-[200px]">Cities</TableHead>
                    <TableHead className="min-w-[100px]">Service Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coverage.map((item) => (
                    <TableRow key={item.state}>
                      <TableCell className="font-medium">{item.state}</TableCell>
                      <TableCell>
                        <span className="block sm:inline">{item.cities.join(", ")}</span>
                      </TableCell>
                      <TableCell>{item.service_days}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



