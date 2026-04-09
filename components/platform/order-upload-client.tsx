"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

type CustomerRow = {
  id: string
  name: string
  deliveryAddress: string | null
  address: string | null
}

type CatalogProduct = {
  id: string
  brand_name: string
  gtin: string | null
}

type ParsedRow = {
  product_sku: string
  product_name: string
  quantity: number
  unit_price: number
}

function tomorrowIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function OrderUploadClient() {
  const router = useRouter()
  const { toast } = useToast()

  const [customers, setCustomers] = useState<CustomerRow[] | null>(null)
  const [custErr, setCustErr] = useState<string | null>(null)
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [requiredDate, setRequiredDate] = useState(tomorrowIso())

  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const [catalogSkus, setCatalogSkus] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const minDate = tomorrowIso()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/customers")
        if (!res.ok) throw new Error("customers")
        const json = (await res.json()) as CustomerRow[]
        if (!cancelled) setCustomers(json)
      } catch {
        if (!cancelled) setCustErr("Could not load customers.")
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadCat() {
      try {
        const res = await fetch("/data/products.json")
        if (!res.ok) return
        const json = (await res.json()) as CatalogProduct[]
        const s = new Set<string>()
        for (const p of json) {
          if (p.gtin) s.add(p.gtin)
          s.add(p.id)
        }
        if (!cancelled) setCatalogSkus(s)
      } catch {
        /* ignore */
      }
    }
    void loadCat()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedCustomer = useMemo(
    () => customers?.find((c) => c.id === customerId) ?? null,
    [customers, customerId]
  )

  useEffect(() => {
    if (!selectedCustomer) return
    const addr =
      selectedCustomer.deliveryAddress?.trim() ||
      selectedCustomer.address?.trim() ||
      ""
    setDeliveryAddress(addr)
  }, [selectedCustomer])

  const filteredCustomers = useMemo(() => {
    if (!customers) return []
    const q = customerQuery.trim().toLowerCase()
    if (!q) return customers.slice(0, 50)
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      )
      .slice(0, 50)
  }, [customers, customerQuery])

  const unknownSkus = useMemo(() => {
    if (!catalogSkus.size) return []
    return rows
      .map((r) => r.product_sku)
      .filter((sku) => sku && !catalogSkus.has(sku.trim()))
  }, [rows, catalogSkus])

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      setFileName(file.name)
      setParseWarnings([])
      const lower = file.name.toLowerCase()
      if (lower.endsWith(".csv")) {
        const text = await file.text()
        Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            const out: ParsedRow[] = []
            const warns: string[] = []
            for (const r of res.data) {
              const sku = String(r.product_sku ?? r["product_sku"] ?? "").trim()
              const name = String(
                r.product_name ?? r["product_name"] ?? ""
              ).trim()
              const qty = parseInt(String(r.quantity ?? ""), 10)
              const price = parseFloat(String(r.unit_price ?? ""))
              if (!sku || !name || !Number.isFinite(qty) || qty < 1) {
                warns.push(`Skipped invalid row: ${sku || "(empty sku)"}`)
                continue
              }
              out.push({
                product_sku: sku,
                product_name: name,
                quantity: qty,
                unit_price: Number.isFinite(price) ? price : 0,
              })
            }
            setRows(out)
            setParseWarnings(warns.slice(0, 10))
          },
        })
        return
      }
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: "array" })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
        const out: ParsedRow[] = []
        const warns: string[] = []
        for (const r of json) {
          const sku = String(r.product_sku ?? "").trim()
          const name = String(r.product_name ?? "").trim()
          const qty = parseInt(String(r.quantity ?? ""), 10)
          const price = parseFloat(String(r.unit_price ?? ""))
          if (!sku || !name || !Number.isFinite(qty) || qty < 1) {
            warns.push(`Skipped invalid row: ${sku || "(empty sku)"}`)
            continue
          }
          out.push({
            product_sku: sku,
            product_name: name,
            quantity: qty,
            unit_price: Number.isFinite(price) ? price : 0,
          })
        }
        setRows(out)
        setParseWarnings(warns.slice(0, 10))
        return
      }
      toast({
        variant: "destructive",
        title: "Unsupported file",
        description: "Use .csv or .xlsx",
      })
    },
    [toast]
  )

  const orderTotal = useMemo(
    () => rows.reduce((s, r) => s + r.quantity * r.unit_price, 0),
    [rows]
  )

  const onSubmit = async () => {
    if (!customerId || !deliveryAddress.trim() || rows.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          deliveryAddress: deliveryAddress.trim(),
          requiredDate: new Date(requiredDate).toISOString(),
          priority: "standard",
          lineItems: rows.map((r) => ({
            productSku: r.product_sku,
            productName: r.product_name,
            quantity: r.quantity,
            unitPrice: r.unit_price,
          })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Could not create order",
          description:
            typeof json?.error === "string" ? json.error : "Please try again.",
        })
        return
      }
      const orderId = json.orderId as string
      router.push(`/orders/${encodeURIComponent(orderId)}?created=1`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
          <Link href="/orders">← Orders</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Upload purchase order</h1>
        <p className="text-sm text-muted-foreground">
          Import line items from a CSV or Excel file.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <a
              className="text-primary underline"
              href="/templates/po-template.csv"
              download
            >
              Download template
            </a>{" "}
            (columns: product_sku, product_name, quantity, unit_price)
          </p>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/40"
            )}
          >
            <Upload className="h-8 w-8 opacity-60" />
            <span>Drag and drop .csv or .xlsx here, or click to browse</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {fileName ? (
            <p className="text-xs text-muted-foreground">Selected: {fileName}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer & delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!customers && !custErr ? (
            <Skeleton className="h-20 w-full" />
          ) : custErr ? (
            <p className="text-sm text-destructive">{custErr}</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Input
                  placeholder="Search by name…"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
                <div className="max-h-40 overflow-auto rounded-md border border-border/60">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={cn(
                        "flex w-full items-start px-3 py-2 text-left text-sm hover:bg-muted/60",
                        customerId === c.id && "bg-muted"
                      )}
                      onClick={() => {
                        setCustomerId(c.id)
                        setCustomerQuery(c.name)
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr">Delivery address</Label>
                <Input
                  id="addr"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req">Required delivery date</Label>
                <Input
                  id="req"
                  type="date"
                  min={minDate}
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unknownSkus.length > 0 && (
              <div
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100"
                role="status"
              >
                <p className="font-medium">SKU not in demo catalog</p>
                <p className="mt-1 text-muted-foreground">
                  {unknownSkus.slice(0, 8).join(", ")}
                  {unknownSkus.length > 8 ? "…" : ""} — you can still create the
                  order.
                </p>
              </div>
            )}
            {parseWarnings.length > 0 && (
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {parseWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium text-right">Qty</th>
                    <th className="px-3 py-2 font-medium text-right">Unit</th>
                    <th className="px-3 py-2 font-medium text-right">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.product_sku}
                      </td>
                      <td className="px-3 py-2">{r.product_name}</td>
                      <td className="px-3 py-2 text-right">{r.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        ${r.unit_price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${(r.quantity * r.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-right font-semibold">
              Total: $
              {orderTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={
                submitting ||
                !customerId ||
                !deliveryAddress.trim() ||
                rows.length === 0
              }
              onClick={() => void onSubmit()}
            >
              {submitting ? "Creating…" : "Create order from file"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
