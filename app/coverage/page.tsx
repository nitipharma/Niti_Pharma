"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getAllCoverage } from "@/lib/data"
import { CoverageMap } from "@/components/coverage-map"
import { cn } from "@/lib/utils"

export default function CoveragePage() {
  const [coverage, setCoverage] = useState<ReturnType<typeof getAllCoverage> extends Promise<infer T> ? T : never>([])
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllCoverage().then(setCoverage)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const states = coverage.map((item) => item.state)

  const filteredCoverage = useMemo(() => {
    if (!searchQuery.trim()) return coverage

    const query = searchQuery.toLowerCase()
    return coverage.filter(
      (item) =>
        item.state.toLowerCase().includes(query) ||
        item.cities.some((city) => city.toLowerCase().includes(query))
    )
  }, [coverage, searchQuery])

  const handleStateClick = (state: string) => {
    setSelectedState(state)
    setSearchQuery("") // Clear search when selecting from map
  }

  const handleRowClick = (state: string) => {
    setSelectedState(state)
  }

  // Scroll to selected state row
  useEffect(() => {
    if (selectedState && tableRef.current) {
      const rowId = `state-${selectedState.toLowerCase().replace(/\s+/g, "-")}`
      const row = document.getElementById(rowId)
      if (row) {
        row.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        })
      }
    }
  }, [selectedState, prefersReducedMotion])

  return (
    <div className="container py-4 sm:py-8 px-4 sm:px-6">
      <Breadcrumb items={[{ label: "Coverage" }]} />

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 sm:mb-4">
          Service Coverage
        </h1>
        <p className="text-sm sm:text-lg text-muted-foreground">
          We provide reliable pharmaceutical distribution services across India with fast delivery
          times and comprehensive coverage.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by state or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search coverage by state or city"
          />
        </div>
      </div>

      {/* Map */}
      <div className="mb-8 sm:mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Coverage Map</CardTitle>
          </CardHeader>
          <CardContent>
            <CoverageMap
              states={states}
              selectedState={selectedState}
              onStateClick={handleStateClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Coverage Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden" ref={tableRef}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">State</TableHead>
                    <TableHead className="min-w-[200px]">Cities</TableHead>
                    <TableHead className="min-w-[100px]">Service Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoverage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No coverage found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoverage.map((item) => {
                      const isSelected = selectedState === item.state
                      const rowId = `state-${item.state.toLowerCase().replace(/\s+/g, "-")}`

                      return (
                        <TableRow
                          key={item.state}
                          id={rowId}
                          onClick={() => handleRowClick(item.state)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleRowClick(item.state)
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`${item.state} coverage details`}
                          className={cn(
                            "cursor-pointer",
                            !prefersReducedMotion && "transition-colors",
                            isSelected && "bg-primary/10 font-medium",
                            "hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          )}
                        >
                          <TableCell className="font-medium">{item.state}</TableCell>
                          <TableCell>
                            <span className="block sm:inline">
                              {item.cities.slice(0, 3).join(", ")}
                              {item.cities.length > 3 && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  +{item.cities.length - 3} more
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>{item.service_days}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
