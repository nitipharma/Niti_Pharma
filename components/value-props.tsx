"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Truck, FileCheck, HeadphonesIcon } from "lucide-react"
import { motion } from "framer-motion"

const props = [
  {
    icon: Shield,
    title: "Full Compliance",
    description: "DSCSA compliant with complete traceability and documentation support.",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description: "Fast, secure delivery with cold-chain management for temperature-sensitive products.",
  },
  {
    icon: FileCheck,
    title: "Quality Assured",
    description: "All products meet regulatory standards with proper licensing and certifications.",
  },
  {
    icon: HeadphonesIcon,
    title: "Expert Support",
    description: "Dedicated account management and 24/7 customer support for your pharmacy needs.",
  },
]

export function ValueProps() {
  return (
    <section className="py-12 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Why Choose Niti Pharma
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We provide comprehensive pharmaceutical distribution services with
            a focus on quality, compliance, and customer satisfaction.
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {props.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <prop.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{prop.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {prop.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}



