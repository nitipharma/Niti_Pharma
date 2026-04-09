"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDocumentVolumeByType, getDocuments, getExceptions } from "@/lib/demo-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartShell } from "@/components/platform/chart-shell"

export default function DocumentProcessingReportPage() {
  const vol = useMemo(() => getDocumentVolumeByType(), [])
  const docs = useMemo(() => getDocuments(), [])
  const exc = useMemo(() => getExceptions(), [])

  const accuracy = 97.2
  const barData = vol.map((v) => ({ name: v.label, count: v.count }))

  return (
    <div className="container max-w-5xl space-y-8 px-4 py-8 sm:px-6 print:py-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports">← Reports</Link>
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Export PDF
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Document processing</h1>
        <p className="text-sm text-muted-foreground">Simulated pipeline KPIs</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total documents</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{docs.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Extraction accuracy</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{accuracy}%+</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exception rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {((exc.length / Math.max(1, docs.length)) * 100).toFixed(1)}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg processing time</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">~3.2 sec / document</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume by type</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartShell heightClass="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis width={36} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </ChartShell>
        </CardContent>
      </Card>
    </div>
  )
}
