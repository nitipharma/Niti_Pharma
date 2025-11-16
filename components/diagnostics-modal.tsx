"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getAllMetrics, calculateStats, clearMetrics, type MetricEntry } from "@/lib/metrics"
import { Trash2, Download } from "lucide-react"

interface DiagnosticsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiagnosticsModal({ open, onOpenChange }: DiagnosticsModalProps) {
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [stats, setStats] = useState(calculateStats([]))

  useEffect(() => {
    if (open) {
      loadMetrics()
    }
  }, [open])

  const loadMetrics = () => {
    const allMetrics = getAllMetrics()
    setMetrics(allMetrics)
    setStats(calculateStats(allMetrics))
  }

  const handleClear = () => {
    if (confirm("Clear all metrics? This cannot be undone.")) {
      clearMetrics()
      loadMetrics()
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(metrics, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `metrics-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (ms?: number) => {
    if (ms === undefined) return "-"
    return `${ms.toFixed(2)}ms`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Performance Diagnostics</DialogTitle>
          <DialogDescription>
            Performance metrics and timing data for OCR, parsing, embedding, and matching stages.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Runs</div>
              <div className="text-2xl font-bold">{stats.count}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg OCR</div>
              <div className="text-2xl font-bold">{formatTime(stats.avgOcrMs)}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg Parse</div>
              <div className="text-2xl font-bold">{formatTime(stats.avgParseMs)}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg Embed</div>
              <div className="text-2xl font-bold">{formatTime(stats.avgEmbedMs)}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg Match</div>
              <div className="text-2xl font-bold">{formatTime(stats.avgMatchMs)}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">P95 Match</div>
              <div className="text-2xl font-bold">
                {formatTime(stats.p95MatchMs)}
                {stats.p95MatchMs > 50 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    &gt;50ms
                  </Badge>
                )}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg Results</div>
              <div className="text-2xl font-bold">{stats.avgResultsCount.toFixed(1)}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Errors</div>
              <div className="text-2xl font-bold text-destructive">{stats.totalErrors}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={loadMetrics}>
              Refresh
            </Button>
          </div>

          {/* Metrics Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Timestamp</TableHead>
                    <TableHead className="min-w-[80px]">OCR</TableHead>
                    <TableHead className="min-w-[80px]">Parse</TableHead>
                    <TableHead className="min-w-[80px]">Embed</TableHead>
                    <TableHead className="min-w-[80px]">Match</TableHead>
                    <TableHead className="min-w-[80px]">Results</TableHead>
                    <TableHead className="min-w-[120px]">Tiers</TableHead>
                    <TableHead className="min-w-[100px]">Barcode</TableHead>
                    <TableHead className="min-w-[200px]">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No metrics recorded yet. Perform an OCR search to generate metrics.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...metrics].reverse().map((metric, idx) => (
                      <TableRow key={`${metric.timestamp}-${idx}`}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(metric.timestamp)}
                        </TableCell>
                        <TableCell>{formatTime(metric.ocr_ms)}</TableCell>
                        <TableCell>{formatTime(metric.parse_ms)}</TableCell>
                        <TableCell>{formatTime(metric.embed_ms)}</TableCell>
                        <TableCell>
                          {formatTime(metric.match_ms)}
                          {metric.match_ms && metric.match_ms > 50 && (
                            <Badge variant="destructive" className="ml-1 text-xs">
                              Slow
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{metric.results_count ?? "-"}</TableCell>
                        <TableCell>
                          {metric.tier_counts ? (
                            <div className="flex gap-1 flex-wrap">
                              {metric.tier_counts.EXACT > 0 && (
                                <Badge variant="default" className="text-xs">
                                  E:{metric.tier_counts.EXACT}
                                </Badge>
                              )}
                              {metric.tier_counts.CLOSE > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  C:{metric.tier_counts.CLOSE}
                                </Badge>
                              )}
                              {metric.tier_counts.ALTERNATIVE > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  A:{metric.tier_counts.ALTERNATIVE}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {metric.barcode_detected !== undefined ? (
                            <Badge variant={metric.barcode_detected ? "default" : "outline"}>
                              {metric.barcode_detected ? "Yes" : "No"}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                          {metric.error || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

