import { Hero } from "@/components/hero"
import { StatsCards } from "@/components/stats-cards"
import { ValueProps } from "@/components/value-props"
import { HowItWorks, PlatformTeaser, CtaBand } from "@/components/home-sections"

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsCards />
      <ValueProps />
      <HowItWorks />
      <PlatformTeaser />
      <CtaBand />
    </>
  )
}
