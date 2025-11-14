"use client"

import { useState, useEffect, useMemo } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { SearchBar } from "@/components/search-bar"
import { FiltersPanel } from "@/components/filters-panel"
import { CatalogGrid } from "@/components/catalog-grid"
import { CatalogTable } from "@/components/catalog-table"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Grid3x3, Table as TableIcon, Filter, X } from "lucide-react"
import { getAllProducts, getUniqueManufacturers, getUniqueCategories } from "@/lib/data"
import { filterProducts, type Filters } from "@/lib/filters"
import { getStorageItem, setStorageItem } from "@/lib/storage"
import { type Product } from "@/lib/data"
export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "table">(
    getStorageItem("catalog-view-mode", "grid")
  )
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    manufacturers: [],
    categories: [],
    schedules: [],
    coldChain: null,
    inStock: null,
    sort: "relevance",
  })

  useEffect(() => {
    getAllProducts().then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

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

  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [products, filters]
  )

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }

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
      <div className="mb-4 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Browse our comprehensive pharmaceutical catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="mb-4 sm:mb-6">
        <SearchBar value={filters.search} onChange={handleSearchChange} />
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
        </div>
      </div>
    </div>
  )
}

