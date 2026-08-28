"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageHeader } from "@/components/page-header"
import { SearchBar } from "@/components/search-bar"
import { FiltersPanel } from "@/components/filters-panel"
import { CatalogGrid } from "@/components/catalog-grid"
import { CatalogTable } from "@/components/catalog-table"
import { EmptyState } from "@/components/empty-state"
import { LabelOCR, type OCRResult } from "@/components/label-ocr"
import { ConfirmCompositionSheet } from "@/components/confirm-composition-sheet"
import { MatchResultsPanel } from "@/components/match-results-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Grid3x3, Table as TableIcon, Filter, X, Camera } from "lucide-react"
import { getAllProducts, getUniqueManufacturers, getUniqueCategories, getProductsByIds } from "@/lib/data"
import { filterProducts, type Filters } from "@/lib/filters"
import { prepareSemanticSearch, semanticSearch, type EmbeddingBackend } from "@/lib/semantic-search"
import { getStorageItem, setStorageItem } from "@/lib/storage"
import { type Product } from "@/lib/data"
import { type ParsedLabel } from "@/lib/parse-label"
import { matchProducts, type MatchedProduct, type MatchResults, type MatchTier } from "@/lib/match"
import { recordMetric } from "@/lib/metrics"
import { useToast } from "@/components/ui/use-toast"
export default function CatalogPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "table">(
    getStorageItem("catalog-view-mode", "grid")
  )
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false)
  const [confirmSheetOpen, setConfirmSheetOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedLabel | null>(null)
  const [matchResults, setMatchResults] = useState<MatchResults | null>(null)
  const [matching, setMatching] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    manufacturers: [],
    categories: [],
    schedules: [],
    coldChain: null,
    inStock: null,
    sort: "relevance",
  })

  // On-device AI search (WebGPU with WASM fallback)
  const [aiMode, setAiMode] = useState(false)
  const [aiBackend, setAiBackend] = useState<EmbeddingBackend | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<Product[] | null>(null)
  const [aiError, setAiError] = useState(false)

  useEffect(() => {
    if (!aiMode) {
      setAiResults(null)
      setAiError(false)
      return
    }

    let cancelled = false
    const query = filters.search.trim()

    const run = async () => {
      try {
        setAiError(false)
        if (!aiBackend) {
          setAiLoading(true)
          const backend = await prepareSemanticSearch()
          if (cancelled) return
          setAiBackend(backend)
        }
        if (!query) {
          if (!cancelled) {
            setAiResults(null)
            setAiLoading(false)
          }
          return
        }
        setAiLoading(true)
        const results = await semanticSearch(query, products)
        if (!cancelled) {
          setAiResults(results.map((r) => r.product))
          setAiLoading(false)
        }
      } catch (error) {
        console.error("AI search failed:", error)
        if (!cancelled) {
          setAiError(true)
          setAiResults(null)
          setAiLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [aiMode, filters.search, products, aiBackend])

  useEffect(() => {
    let cancelled = false
    
    getAllProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data)
          setLoading(false)
        }
      })
      .catch((error) => {
        console.error("Failed to load products:", error)
        if (!cancelled) {
          setLoading(false)
          toast({
            title: "Failed to load products",
            description: "Please refresh the page to try again.",
            variant: "destructive",
          })
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [toast])

  useEffect(() => {
    setStorageItem("catalog-view-mode", viewMode)
  }, [viewMode])

  const uniqueManufacturers = useMemo(
    () => getUniqueManufacturers(products),
    [products]
  )
  const uniqueCategories = useMemo(
    () => getUniqueCategories(products),
    [products]
  )

  const aiActive = aiMode && filters.search.trim().length > 0 && aiResults !== null

  const filteredProducts = useMemo(() => {
    if (aiActive && aiResults) {
      // Semantic ranking replaces keyword search; facet filters still apply
      // and "relevance" sort preserves the similarity order.
      return filterProducts(aiResults, { ...filters, search: "", sort: "relevance" })
    }
    return filterProducts(products, filters)
  }, [products, filters, aiActive, aiResults])

  const aiStatus = !aiMode
    ? null
    : aiError
    ? "AI search unavailable — using keyword search instead."
    : aiLoading && !aiBackend
    ? "Loading the on-device model (first use only)..."
    : aiLoading
    ? "Ranking products by meaning..."
    : aiBackend
    ? `Ranking by meaning — runs in your browser via ${aiBackend === "webgpu" ? "WebGPU" : "WebAssembly"}, no data leaves your device.`
    : null

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }

  const handleOCRResult = async (result: OCRResult) => {
    // Fast path: Barcode found - skip parsing and go directly to product
    if (result.barcodeProductId) {
      const product = products.find((p) => p.id === result.barcodeProductId)
      if (product) {
        setOcrDialogOpen(false)
        
        // Create EXACT match result
        const matchResult: MatchResults = {
          results: [
            {
              product,
              tier: "EXACT",
              score: 200, // Perfect match
              notes: ["Barcode match"],
            },
          ],
          notAvailable: false,
        }
        
        // Add substitutes as CLOSE matches
        if (product.substitutes && product.substitutes.length > 0) {
          const substitutes = await getProductsByIds(product.substitutes)
          const closeMatches = substitutes.map((sub) => ({
            product: sub,
            tier: "CLOSE" as MatchTier,
            score: 150,
            notes: ["Suggested substitute"],
          }))
          matchResult.results.push(...closeMatches)
        }
        
        setMatchResults(matchResult)
        
        toast({
          title: "Barcode detected!",
          description: `Found product: ${product.brand_name}`,
        })
        return
      }
    }

    if (!result.text.trim()) {
      toast({
        title: "No text found",
        description: "Could not extract any text from the image.",
        variant: "destructive",
      })
      return
    }

    // If parsed data is available, show confirmation sheet
    if (result.parsed && result.parsed.actives.length > 0) {
      setParsedData(result.parsed)
      setOcrDialogOpen(false)
      setConfirmSheetOpen(true)
    } else {
      // Fallback to raw text search
      setFilters((prev) => ({ ...prev, search: result.text.trim() }))
      setOcrDialogOpen(false)
      setMatchResults(null) // Clear any previous results
      
      toast({
        title: "Text extracted",
        description: `Found ${result.lines.length} lines. Could not parse composition, using raw text search.`,
      })
    }
  }

  const performMatching = useCallback(async (parsed: ParsedLabel) => {
    setMatching(true)
    try {
      const results = await matchProducts(parsed, products)
      setMatchResults(results)
      setConfirmSheetOpen(false)
      
      if (results.notAvailable) {
        toast({
          title: "No matches found",
          description: "We couldn't find any matching products in our inventory.",
          variant: "destructive",
        })
      } else {
        const exactCount = results.results.filter((r) => r.tier === "EXACT").length
        const closeCount = results.results.filter((r) => r.tier === "CLOSE").length
        const altCount = results.results.filter((r) => r.tier === "ALTERNATIVE").length
        
        toast({
          title: "Matches found",
          description: `${exactCount} exact, ${closeCount} close, ${altCount} alternative matches.`,
        })
      }
    } catch (error) {
      console.error("Matching error:", error)
      recordMetric({
        error: error instanceof Error ? error.message : "Unknown matching error",
      })
      toast({
        title: "Matching failed",
        description: error instanceof Error ? error.message : "An error occurred while matching products.",
        variant: "destructive",
      })
    } finally {
      setMatching(false)
    }
  }, [products, toast])

  const handleConfirmComposition = (parsed: ParsedLabel) => {
    setParsedData(parsed)
    performMatching(parsed)
  }

  // Handle edits from confirmation sheet (just sync state)
  const handleCompositionEdit = useCallback((parsed: ParsedLabel) => {
    setParsedData(parsed)
    // Matching happens instantly when user clicks "Search Inventory"
  }, [])

  const hasActiveFilters =
    filters.manufacturers.length > 0 ||
    filters.categories.length > 0 ||
    filters.schedules.length > 0 ||
    filters.coldChain !== null ||
    filters.inStock !== null

  if (loading) {
    return (
      <div className="container py-4 sm:py-8 px-4 sm:px-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1 hidden lg:block">
            <Skeleton className="h-96" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4 sm:py-8 px-4 sm:px-6">
      <Breadcrumb items={[{ label: "Catalog" }]} />
      <PageHeader
        eyebrow="Catalog"
        title="Product catalog"
        description="Search 30,000+ SKUs by brand, composition, or manufacturer — or match products straight from a label photo."
        className="mb-4 sm:mb-6"
        actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOcrDialogOpen(true)
              setMatchResults(null) // Clear previous results
            }}
          >
            <Camera className="h-4 w-4 mr-2" />
            From photo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        }
      />

      <div className="mb-4 sm:mb-6">
        <SearchBar
          value={filters.search}
          onChange={handleSearchChange}
          aiMode={aiMode}
          onAiModeChange={setAiMode}
          aiStatus={aiStatus}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Desktop Filters */}
        <div className="hidden lg:block lg:col-span-1">
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            products={products}
            uniqueManufacturers={uniqueManufacturers}
            uniqueCategories={uniqueCategories}
          />
        </div>

        {/* Mobile Filters Overlay */}
        {mobileFiltersOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FiltersPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  products={products}
                  uniqueManufacturers={uniqueManufacturers}
                  uniqueCategories={uniqueCategories}
                />
              </div>
              <div className="p-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-3">
          {matchResults ? (
            // Show match results
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Search results from photo
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMatchResults(null)
                    setParsedData(null)
                  }}
                >
                  Clear results
                </Button>
              </div>
              {matching ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <MatchResultsPanel
                  results={matchResults.results}
                  notAvailable={matchResults.notAvailable}
                />
              )}
            </div>
          ) : (
            // Show regular catalog
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </div>
              {filteredProducts.length === 0 ? (
                <EmptyState
                  title="No products found"
                  description="Try adjusting your filters or search terms to find what you're looking for."
                  action={{
                    label: "Clear filters",
                    onClick: () =>
                      setFilters({
                        search: "",
                        manufacturers: [],
                        categories: [],
                        schedules: [],
                        coldChain: null,
                        inStock: null,
                        sort: "relevance",
                      }),
                  }}
                />
              ) : viewMode === "grid" ? (
                <CatalogGrid products={filteredProducts} />
              ) : (
                <CatalogTable products={filteredProducts} />
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Extract Text from Label Photo</DialogTitle>
            <DialogDescription>
              Upload an image of a pharmaceutical label to extract text using OCR.
            </DialogDescription>
          </DialogHeader>
          <LabelOCR onResult={handleOCRResult} onClose={() => setOcrDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmCompositionSheet
        open={confirmSheetOpen}
        onOpenChange={setConfirmSheetOpen}
        parsed={parsedData}
        onConfirm={handleConfirmComposition}
        onEdit={handleCompositionEdit}
      />
    </div>
  )
}

