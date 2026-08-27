const stats = [
  { label: "SKUs in catalog", value: "30,000+" },
  { label: "On-time delivery", value: "98.5%" },
  { label: "States served", value: "15+" },
  { label: "Years in distribution", value: "25+" },
]

export function StatsCards() {
  return (
    <section className="border-b border-border/60 bg-muted/40">
      <div className="container px-4 sm:px-6">
        <dl className="grid grid-cols-2 divide-border/60 py-8 max-lg:gap-y-8 lg:grid-cols-4 lg:divide-x lg:py-10">
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 text-center lg:px-8">
              <dd className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                {stat.value}
              </dd>
              <dt className="mt-1.5 text-sm text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
