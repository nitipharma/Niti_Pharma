"use client"

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const stats = [
  { label: "SKUs Available", value: "30,000+", description: "Comprehensive catalog" },
  { label: "On-Time Delivery", value: "98.5%", description: "Reliable service" },
  { label: "States Covered", value: "15+", description: "Nationwide reach" },
  { label: "Years Experience", value: "25+", description: "Trusted partner" },
]

export function StatsCards() {
  return (
    <section className="py-6 sm:py-10 md:py-14 lg:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="w-full"
            >
              <Card className="h-full border border-border/60 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 hover:border-primary/30 group">
                <CardContent className="p-3 sm:p-4 md:p-5 lg:p-7 text-center relative overflow-hidden flex flex-col justify-center min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Decorative accent line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 space-y-0.5 sm:space-y-1">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-primary leading-none tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-foreground leading-tight px-0.5">
                      {stat.label}
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/70 font-normal leading-tight hidden sm:block">
                      {stat.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}



