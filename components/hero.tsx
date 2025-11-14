"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-32">
      <div className="container relative z-10 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Premium Pharmaceutical
            <span className="text-primary"> Distribution</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base text-muted-foreground sm:text-lg md:text-xl px-2">
            Trusted B2B distributor serving pharmacies nationwide with
            comprehensive product catalog, reliable delivery, and full compliance.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center px-4 sm:px-0">
            <Button asChild size="lg" className="text-sm sm:text-base w-full sm:w-auto">
              <Link href="/catalog">
                Browse Catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-sm sm:text-base w-full sm:w-auto">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}



