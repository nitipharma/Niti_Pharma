"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { defaultUnitPriceForProduct } from "@/lib/catalog-price"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, Trash2 } from "lucide-react"

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
  slug: string
}

export type LineDraft = {
  productSku: string
  productName: string
  quantity: number
  unitPrice: number
}

const STEPS = ["Customer & delivery", "Line items", "Review"]

function tomorrowIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function OrderIntakeForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)

  const [customers, setCustomers] = useState<CustomerRow[] | null>(null)
  const [custErr, setCustErr] = useState<string | null>(null)
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [requiredDate, setRequiredDate] = useState(tomorrowIso())
  const [priority, setPriority] = useState<"standard" | "urgent" | "scheduled">(
    "standard"
  )
  const [notes, setNotes] = useState("")

  const [products, setProducts] = useState<CatalogProduct[] | null>(null)
  const [productQuery, setProductQuery] = useState("")
  const [lines, setLines] = useState<LineDraft[]>([])

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers")
        if (!res.ok) throw new Error("Failed to load customers")
        const json = (await res.json()) as CustomerRow[]
        if (!cancelled) setCustomers(json)
      } catch {
        if (!cancelled) setCustErr("Could not load customers.")
      }
    }
    void loadCustomers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadProducts() {
      try {
        const res = await fetch("/data/products.json")
        if (!res.ok) throw new Error("Failed to load catalog")
        const json = (await res.json()) as CatalogProduct[]
        if (!cancelled) setProducts(json)
      } catch {
        if (!cancelled) setProducts([])
      }
    }
    void loadProducts()
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

  const filteredProducts = useMemo(() => {
    if (!products) return []
    const q = productQuery.trim().toLowerCase()
    if (!q) return products.slice(0, 30)
    return products
      .filter(
        (p) =>
          p.brand_name.toLowerCase().includes(q) ||
          (p.gtin && p.gtin.includes(q)) ||
          p.slug.toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [products, productQuery])

  const addProduct = useCallback(
    (p: CatalogProduct) => {
      const sku = p.gtin || p.id
      const price = defaultUnitPriceForProduct(p.id)
      setLines((prev) => [
        ...prev,
        {
          productSku: sku,
          productName: p.brand_name,
          quantity: 1,
          unitPrice: price,
        },
      ])
      setProductQuery("")
    },
    []
  )

  const lineTotal = useCallback((li: LineDraft) => li.quantity * li.unitPrice, [])

  const orderTotal = useMemo(
    () => lines.reduce((s, li) => s + lineTotal(li), 0),
    [lines, lineTotal]
  )

  const minDate = tomorrowIso()

  const canNext1 =
    !!customerId &&
    deliveryAddress.trim().length > 0 &&
    requiredDate >= minDate

  const canNext2 = lines.length > 0

  const onSubmit = async () => {
    if (!customerId || !deliveryAddress.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          deliveryAddress: deliveryAddress.trim(),
          requiredDate: new Date(requiredDate).toISOString(),
          priority,
          notes: notes.trim() || undefined,
          lineItems: lines.map((li) => ({
            productSku: li.productSku,
            productName: li.productName,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
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
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link href="/orders">← Orders</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">New order</h1>
          <p className="text-sm text-muted-foreground">
            Create a wholesale order from catalog products.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                i <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:inline",
                i === step ? "font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 1 — Customer & delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!customers && !custErr ? (
              <Skeleton className="h-24 w-full" />
            ) : custErr ? (
              <p className="text-sm text-destructive">{custErr}</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cust">Customer</Label>
                  <Input
                    id="cust"
                    placeholder="Search by name…"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                  />
                  <div className="max-h-48 overflow-auto rounded-md border border-border/60">
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
                        <span className="font-medium">{c.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {c.id.slice(0, 8)}…
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr">Delivery address</Label>
                  <Textarea
                    id="addr"
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(v) =>
                        setPriority(v as "standard" | "urgent" | "scheduled")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                disabled={!canNext1}
                onClick={() => setStep(1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2 — Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!products ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="prod">Add product</Label>
                <Input
                  id="prod"
                  placeholder="Search catalog…"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                />
                <div className="max-h-40 overflow-auto rounded-md border border-border/60">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/60"
                      onClick={() => addProduct(p)}
                    >
                      <span>{p.brand_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.gtin ?? p.id.slice(0, 8)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <span className="text-sm font-medium">
                  Total: $
                  {orderTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Unit price</th>
                      <th className="px-3 py-2 font-medium">Line</th>
                      <th className="px-3 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((li, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="px-3 py-2">{li.productName}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {li.productSku}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={1}
                            className="h-8 w-20"
                            value={li.quantity}
                            onChange={(e) => {
                              const q = Math.max(
                                1,
                                parseInt(e.target.value, 10) || 1
                              )
                              setLines((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, quantity: q } : x
                                )
                              )
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-8 w-28"
                            value={li.unitPrice}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value)
                              setLines((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        unitPrice: Number.isFinite(v)
                                          ? v
                                          : x.unitPrice,
                                      }
                                    : x
                                )
                              )
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          $
                          {lineTotal(li).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove line"
                            onClick={() =>
                              setLines((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!products?.length}
                  onClick={() => {
                    const p = products?.[0]
                    if (p) addProduct(p)
                  }}
                >
                  Add another item
                </Button>
                <Button
                  type="button"
                  disabled={!canNext2}
                  onClick={() => setStep(2)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 3 — Review & submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium">{selectedCustomer?.name}</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {deliveryAddress}
              </p>
              <p className="mt-2 text-muted-foreground">
                Required: {new Date(requiredDate).toLocaleDateString()} ·{" "}
                {priority}
              </p>
              {notes.trim() ? (
                <p className="mt-2 text-muted-foreground">Notes: {notes}</p>
              ) : null}
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit</th>
                    <th className="px-3 py-2 text-right">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((li, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-3 py-2">{li.productName}</td>
                      <td className="px-3 py-2 text-right">{li.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        ${li.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${lineTotal(li).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-lg font-semibold">
              Order total: $
              {orderTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void onSubmit()}
              >
                {submitting ? "Submitting…" : "Submit order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
