import Link from "next/link"
import { PLATFORM_LINKS } from "@/lib/platform-nav"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "Platform workspace",
  description:
    "Overview of the distributor demo: orders, documents, tracking, and billing.",
}

export default function PlatformWorkspacePage() {
  return (
    <div className="container max-w-4xl space-y-10 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Distributor demo
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform workspace</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Wholesale operations in this environment: intake, AI-assisted documents,
          shipment visibility, exceptions, reconciliation, and billing. Open any
          module below or use{" "}
          <span className="text-foreground">Platform</span> in the header.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORM_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="group block outline-none">
            <Card className="h-full border-border/80 shadow-soft transition-all group-hover:border-primary/35 group-hover:shadow-lifted">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{item.label}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-xs font-medium text-primary opacity-90 transition-transform group-hover:opacity-100">
                  Open →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
