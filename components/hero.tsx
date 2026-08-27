"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  ShieldCheck,
  Snowflake,
  Truck,
  PackageCheck,
  FileCheck,
} from "lucide-react"
import { motion } from "framer-motion"

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Backdrop: faint grid + brand glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative grid items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-28">
        {/* Copy */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3.5 py-1.5 text-xs font-medium text-accent-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Licensed B2B pharmaceutical wholesaler
          </p>
          <h1 className="max-w-xl text-balance text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
            The dependable way to keep your pharmacy stocked
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Niti Pharma supplies 30,000+ SKUs to pharmacies across India — with
            cold-chain logistics, batch-level traceability, and delivery
            schedules you can plan around.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-soft">
              <Link href="/catalog">
                Browse catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" aria-hidden />
              GDP-aligned processes
            </li>
            <li className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-primary" aria-hidden />
              Validated cold chain
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" aria-hidden />
              Next-day metro delivery
            </li>
          </ul>
        </motion.div>

        {/* Visual: stylised order flow */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="relative mx-auto hidden w-full max-w-md sm:block"
          aria-hidden="true"
        >
          <div className="rounded-2xl border bg-card p-5 shadow-lifted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Purchase order</p>
                <p className="font-semibold tabular-nums">PO-2417 · Apex Pharmacy</p>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                In transit
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: "Order received", time: "09:12", done: true },
                { label: "Batches picked & verified", time: "10:04", done: true },
                { label: "Cold-chain dispatch", time: "11:30", done: true },
                { label: "Out for delivery", time: "ETA 14:15", done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span
                    className={
                      step.done
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary"
                        : "flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground"
                    }
                  >
                    {step.done ? (
                      <PackageCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Truck className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium">{step.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {step.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
              <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">Line items</p>
                <p className="text-sm font-semibold tabular-nums">42 SKUs · 3 cold-chain</p>
              </div>
              <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">Reefer temp</p>
                <p className="text-sm font-semibold tabular-nums">2–8 °C · stable</p>
              </div>
            </div>
          </div>

          {/* Floating compliance chip */}
          <div className="absolute -bottom-5 -left-4 flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 shadow-lifted">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <div className="text-xs">
              <p className="font-semibold leading-tight">Batch traceability</p>
              <p className="text-muted-foreground">Lot & expiry on every line</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
