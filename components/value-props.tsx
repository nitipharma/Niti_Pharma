import { Shield, Truck, FileCheck, Headset } from "lucide-react"

const props = [
  {
    icon: Shield,
    title: "Compliance first",
    description:
      "Licensed wholesale operations with batch-level traceability and complete documentation on every shipment.",
  },
  {
    icon: Truck,
    title: "Dependable delivery",
    description:
      "Scheduled routes across 15+ states, with validated cold-chain transport for temperature-sensitive lines.",
  },
  {
    icon: FileCheck,
    title: "Quality assured",
    description:
      "Products sourced from licensed manufacturers, checked against regulatory standards before they leave our warehouse.",
  },
  {
    icon: Headset,
    title: "A team that answers",
    description:
      "Dedicated account managers who know your pharmacy, plus support that picks up when something needs fixing.",
  },
]

export function ValueProps() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why pharmacies choose us
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Built for the way pharmacies actually work
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Distribution is a trust business. Ours is earned order by order —
            with stock that arrives complete, documented, and on time.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {props.map((prop) => (
            <div
              key={prop.title}
              className="group rounded-xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-lifted"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <prop.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{prop.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
