import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, FileCheck, RotateCcw, Award } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compliance - Niti Pharma",
  description: "DSCSA compliance, licensing, returns, recalls, and 340B program support.",
}

export default function CompliancePage() {
  return (
    <div className="container py-4 sm:py-8 px-4 sm:px-6">
      <Breadcrumb items={[{ label: "Compliance" }]} />
      
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 sm:mb-4">Compliance & Quality</h1>
        <p className="text-sm sm:text-lg text-muted-foreground">
          We maintain the highest standards of compliance, quality, and regulatory adherence
          in all our operations.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-8 sm:mb-12">
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>DSCSA Compliance</CardTitle>
            <CardDescription>
              Drug Supply Chain Security Act compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Transaction Information (TI)</h4>
                <p className="text-sm text-muted-foreground">
                  Complete transaction information for all product transfers, including
                  product identifiers, transaction dates, and trading partner details.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Transaction Statement (TS)</h4>
                <p className="text-sm text-muted-foreground">
                  Standardized transaction statements confirming compliance with all
                  applicable requirements for each transaction.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Transaction History (TH)</h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive transaction history maintained for all products,
                  ensuring full traceability throughout the supply chain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>Licensing & Certifications</CardTitle>
            <CardDescription>
              Regulatory compliance and quality certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Wholesale Drug License</h4>
                <p className="text-sm text-muted-foreground">
                  Valid wholesale drug license issued by state regulatory authorities,
                  ensuring compliance with all distribution requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Good Distribution Practices (GDP)</h4>
                <p className="text-sm text-muted-foreground">
                  Adherence to Good Distribution Practices guidelines, ensuring product
                  quality and integrity throughout the distribution process.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">ISO Certifications</h4>
                <p className="text-sm text-muted-foreground">
                  ISO 9001:2015 certified quality management system, demonstrating
                  commitment to continuous improvement and customer satisfaction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <RotateCcw className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>Returns & Recalls</CardTitle>
            <CardDescription>
              Product return and recall management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Return Policy</h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive return policy for damaged, expired, or incorrectly
                  shipped products. All returns processed in accordance with regulatory
                  requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Recall Management</h4>
                <p className="text-sm text-muted-foreground">
                  Rapid response system for product recalls, ensuring immediate
                  notification and efficient product retrieval when necessary.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Complete documentation and traceability for all returns and recalls,
                  maintaining full compliance with regulatory requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Award className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>340B Program Support</CardTitle>
            <CardDescription>
              Support for covered entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">340B Eligible</h4>
                <p className="text-sm text-muted-foreground">
                  We support the 340B Drug Pricing Program, providing discounted
                  pricing to eligible covered entities including hospitals, clinics,
                  and health centers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Program Compliance</h4>
                <p className="text-sm text-muted-foreground">
                  Full compliance with 340B program requirements, including proper
                  documentation, pricing verification, and audit support.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dedicated Support</h4>
                <p className="text-sm text-muted-foreground">
                  Dedicated account management and support for 340B covered entities,
                  ensuring smooth program participation and compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



