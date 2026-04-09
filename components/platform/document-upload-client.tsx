"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type StatusPayload = {
  id: string
  status: string
  linkedOrderId: string | null
  uploaded: boolean
  ocr_done: boolean
  extracted: boolean
  validated: boolean
  result: string
}

const POLL_MS = 1500

export function DocumentUploadClient() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<
    "invoice" | "purchase_order" | "delivery_record"
  >("invoice")
  const [linkedOrderId, setLinkedOrderId] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [poll, setPoll] = useState<StatusPayload | null>(null)

  const fetchStatus = useCallback(async (id: string) => {
    const res = await fetch(`/api/documents/${encodeURIComponent(id)}/status`)
    if (!res.ok) return null
    return (await res.json()) as StatusPayload
  }, [])

  useEffect(() => {
    if (!documentId) return
    let cancelled = false
    const tick = async () => {
      const s = await fetchStatus(documentId)
      if (!cancelled && s) {
        setPoll(s)
        const done =
          s.status === "validated" ||
          s.status === "mismatch" ||
          s.status === "error" ||
          (s.status === "extracted" && !s.linkedOrderId)
        if (done) return false
      }
      return true
    }
    void tick()
    const id = window.setInterval(async () => {
      const cont = await tick()
      if (!cont) window.clearInterval(id)
    }, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [documentId, fetchStatus])

  const steps = useMemo(() => {
    const s = poll
    const validationDone =
      s?.validated ||
      (s?.status === "extracted" && !s?.linkedOrderId) ||
      s?.status === "mismatch"
    const pipelineDone =
      s?.status === "validated" ||
      s?.status === "mismatch" ||
      s?.status === "error" ||
      (s?.status === "extracted" && !s?.linkedOrderId)
    return [
      { label: "Uploading to secure storage…", done: s?.uploaded },
      { label: "Extracting text (OCR)…", done: s?.ocr_done },
      { label: "AI parsing fields…", done: s?.extracted },
      {
        label: "Validating against order…",
        done: validationDone,
        warn: s?.result === "mismatch" || s?.status === "mismatch",
      },
      {
        label: "Done — view document",
        done: pipelineDone,
      },
    ]
  }, [poll])

  const onSubmit = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Choose a file" })
      return
    }
    setUploading(true)
    setPoll(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", docType)
      fd.append("vendorName", vendorName)
      if (linkedOrderId.trim()) {
        fd.append("linkedOrderId", linkedOrderId.trim())
      }
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: typeof json?.error === "string" ? json.error : "Error",
        })
        return
      }
      setDocumentId(json.documentId as string)
      toast({ title: "Upload started", description: "Processing in background." })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
          <Link href="/documents">← Documents</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Upload document</h1>
        <p className="text-sm text-muted-foreground">
          PDF or image — OCR and AI extraction run automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="f">File</Label>
            <Input
              id="f"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select
              value={docType}
              onValueChange={(v) =>
                setDocType(v as typeof docType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="purchase_order">Purchase order</SelectItem>
                <SelectItem value="delivery_record">Delivery record</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oid">Linked order (optional)</Label>
            <Input
              id="oid"
              placeholder="ORD-…"
              value={linkedOrderId}
              onChange={(e) => setLinkedOrderId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vn">Vendor / supplier</Label>
            <Input
              id="vn"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={uploading || !file}
            onClick={() => void onSubmit()}
          >
            {uploading ? "Uploading…" : "Upload & process"}
          </Button>
        </CardContent>
      </Card>

      {documentId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processing pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!poll ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center">
                      {step.done ? (
                        step.warn && i === 3 ? (
                          <span className="text-amber-600">⚠</span>
                        ) : (
                          <Check className="h-5 w-5 text-emerald-600" />
                        )
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </span>
                    <span
                      className={cn(
                        step.done ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {poll &&
              (poll.status === "validated" ||
                poll.status === "mismatch" ||
                poll.status === "error" ||
                (poll.status === "extracted" && !poll.linkedOrderId)) && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/documents/${encodeURIComponent(documentId)}`}>
                    View document
                  </Link>
                </Button>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
