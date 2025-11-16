"use client"

import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileText, Thermometer, ShieldCheck, AlertCircle } from "lucide-react"

// Static recalls data for demo
const recalls = [
  {
    id: "REC-2024-001",
    date: "2024-01-15",
    product: "Paracetamol 500mg Tablets",
    lot: "LOT-2023-ABC-123",
    reason: "Labeling error - incorrect expiry date",
    status: "Active",
    severity: "low",
  },
  {
    id: "REC-2024-002",
    date: "2024-02-03",
    product: "Amoxicillin 250mg Capsules",
    lot: "LOT-2023-XYZ-456",
    reason: "Potential packaging defect",
    status: "Resolved",
    severity: "medium",
  },
  {
    id: "REC-2024-003",
    date: "2024-02-20",
    product: "Ibuprofen 400mg Tablets",
    lot: "LOT-2024-DEF-789",
    reason: "Temperature excursion during transport",
    status: "Active",
    severity: "high",
  },
]

export default function CompliancePage() {
  return (
    <div className="container py-4 sm:py-8 px-4 sm:px-6">
      <Breadcrumb items={[{ label: "Compliance" }]} />

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 sm:mb-4">
          Compliance & Quality
        </h1>
        <p className="text-sm sm:text-lg text-muted-foreground">
          We maintain the highest standards of compliance, quality, and regulatory adherence in all
          our operations.
        </p>
      </div>

      {/* Three Main Cards */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-8 sm:mb-12">
        {/* Traceability & Lot Tracking */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>Traceability & Lot Tracking</CardTitle>
            <CardDescription>Complete product traceability throughout the supply chain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Serialization</h4>
                <p className="text-sm text-muted-foreground">
                  All products are serialized with unique identifiers (GTIN, Serial Number, Lot,
                  Expiry) enabling complete traceability from manufacturer to end customer.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Transaction History</h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive transaction history maintained for all products, ensuring full
                  traceability and compliance with DSCSA requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Lot Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Advanced lot tracking system enables rapid identification and isolation of
                  products in case of recalls or quality issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cold-Chain Integrity */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Thermometer className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>Cold-Chain Integrity</CardTitle>
            <CardDescription>Temperature-controlled storage and transport</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Temperature Monitoring</h4>
                <p className="text-sm text-muted-foreground">
                  Continuous temperature monitoring during storage and transport using calibrated
                  data loggers and real-time alerts for temperature excursions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Validated Equipment</h4>
                <p className="text-sm text-muted-foreground">
                  All cold storage facilities and transport vehicles are validated and maintained
                  according to GDP guidelines, ensuring product integrity.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Complete temperature records maintained for all cold-chain shipments, available
                  for audit and regulatory review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licensing & Audits */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>Licensing & Audits</CardTitle>
            <CardDescription>Regulatory compliance and quality certifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Wholesale Drug License</h4>
                <p className="text-sm text-muted-foreground">
                  Valid wholesale drug license issued by state regulatory authorities, ensuring
                  compliance with all distribution requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Good Distribution Practices</h4>
                <p className="text-sm text-muted-foreground">
                  Full adherence to Good Distribution Practices (GDP) guidelines, ensuring product
                  quality and integrity throughout the distribution process.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Regular Audits</h4>
                <p className="text-sm text-muted-foreground">
                  Regular internal and external audits conducted to ensure continuous compliance
                  with all regulatory requirements and quality standards.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recalls & Notices Panel */}
      <Card className="mb-8 sm:mb-12">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Recalls & Notices</CardTitle>
          </div>
          <CardDescription>
            Current and recent product recalls and safety notices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recalls.map((recall) => (
              <div
                key={recall.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{recall.product}</h4>
                      <Badge
                        variant={
                          recall.severity === "high"
                            ? "destructive"
                            : recall.severity === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {recall.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Lot:</span> {recall.lot}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Reason:</span> {recall.reason}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={recall.status === "Active" ? "destructive" : "outline"}>
                      {recall.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(recall.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{recall.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Important Notice</h3>
              <p className="text-sm text-muted-foreground">
                This website and its content are provided for informational purposes only. The
                information contained herein is not intended to be a substitute for professional
                medical advice, diagnosis, or treatment. Always seek the advice of your physician
                or other qualified health provider with any questions you may have regarding a
                medical condition or medication. Never disregard professional medical advice or
                delay in seeking it because of something you have read on this website.
              </p>
              <p className="text-sm text-muted-foreground">
                Product information, including but not limited to indications, dosages, and
                contraindications, should be verified with the manufacturer&apos;s prescribing
                information. Niti Pharma does not provide medical advice or recommendations
                regarding the use of any pharmaceutical products.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
