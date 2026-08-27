import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  ClipboardList,
  PackageSearch,
  Truck,
  LayoutDashboard,
  ScanText,
  GitCompareArrows,
  MapPin,
} from "lucide-react"

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Register your pharmacy",
    description:
      "Share your drug license and GST details once. Our team verifies your account and sets up your pricing.",
  },
  {
    icon: PackageSearch,
    step: "02",
    title: "Order the way you prefer",
    description:
      "Search 30,000+ SKUs in the catalog, upload a purchase order, or snap a photo of a label — we match it to stock.",
  },
  {
    icon: Truck,
    step: "03",
    title: "Receive, verified",
    description:
      "Scheduled dispatch with lot and expiry on every line, cold chain where required, and tracking until it reaches your counter.",
  },
]

export function HowItWorks() {
  return (
    <section className="border-y border-border/60 bg-muted/40 py-16 md:py-24">
      <div className="container px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            From order to counter in three steps
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-xl border bg-card p-6 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground/60">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const platformFeatures = [
  {
    icon: LayoutDashboard,
    title: "Operations dashboard",
    description: "Order volume, exceptions, and delivery performance at a glance.",
  },
  {
    icon: ScanText,
    title: "AI document intake",
    description: "Invoices and POs read by OCR + AI extraction, not manual entry.",
  },
  {
    icon: GitCompareArrows,
    title: "Three-way reconciliation",
    description: "PO, invoice, and delivery records matched line by line.",
  },
]

export function PlatformTeaser() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary via-primary to-[hsl(186_70%_18%)] text-primary-foreground shadow-lifted dark:from-[hsl(172_45%_16%)] dark:via-[hsl(180_40%_13%)] dark:to-[hsl(195_40%_10%)] dark:text-foreground">
          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-40" />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-wider opacity-80">
                Distributor platform
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                See the software that runs our operation
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed opacity-85">
                Explore a live demo of our internal workspace — orders,
                shipment tracking, document processing, reconciliation, and
                billing, all on simulated data.
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="mt-8 shadow-soft"
              >
                <Link href="/platform">
                  Explore the demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ul className="relative grid content-center gap-4">
              {platformFeatures.map((feature) => (
                <li
                  key={feature.title}
                  className="flex items-start gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm dark:bg-white/5"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 dark:bg-white/10">
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{feature.title}</span>
                    <span className="block text-sm opacity-80">
                      {feature.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CtaBand() {
  return (
    <section className="border-t border-border/60 bg-muted/40 py-16 md:py-20">
      <div className="container px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" aria-hidden />
            Headquartered in Kalyan, Maharashtra — serving 15+ states
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Ready to simplify your supply?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tell us about your pharmacy and we&apos;ll set you up with pricing,
            credit terms, and a delivery schedule that fits.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-soft">
              <Link href="/contact">
                Contact sales
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/coverage">Check coverage</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
