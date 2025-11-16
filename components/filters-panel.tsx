"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { type Filters, type SortOption } from "@/lib/filters"
import { type Product } from "@/lib/data"

interface FiltersPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  products: Product[]
  uniqueManufacturers: string[]
  uniqueCategories: string[]
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  uniqueManufacturers,
  uniqueCategories,
}: FiltersPanelProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleManufacturer = (manufacturer: string) => {
    const newManufacturers = filters.manufacturers.includes(manufacturer)
      ? filters.manufacturers.filter((m) => m !== manufacturer)
      : [...filters.manufacturers, manufacturer]
    updateFilter("manufacturers", newManufacturers)
  }

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    updateFilter("categories", newCategories)
  }

  const toggleSchedule = (schedule: string) => {
    const newSchedules = filters.schedules.includes(schedule)
      ? filters.schedules.filter((s) => s !== schedule)
      : [...filters.schedules, schedule]
    updateFilter("schedules", newSchedules)
  }

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      manufacturers: [],
      categories: [],
      schedules: [],
      coldChain: null,
      inStock: null,
      sort: "relevance",
    })
  }

  const hasActiveFilters =
    filters.manufacturers.length > 0 ||
    filters.categories.length > 0 ||
    filters.schedules.length > 0 ||
    filters.coldChain !== null ||
    filters.inStock !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Sort by</Label>
          <Select
            value={filters.sort}
            onValueChange={(value) => updateFilter("sort", value as SortOption)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="availability">Availability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Manufacturer</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uniqueManufacturers.map((manufacturer) => (
              <div key={manufacturer} className="flex items-center space-x-2">
                <Checkbox
                  id={`manufacturer-${manufacturer}`}
                  checked={filters.manufacturers.includes(manufacturer)}
                  onCheckedChange={() => toggleManufacturer(manufacturer)}
                />
                <Label
                  htmlFor={`manufacturer-${manufacturer}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {manufacturer}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Category</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uniqueCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Schedule</Label>
          <div className="space-y-2">
            {["OTC", "Rx", "Schedule H"].map((schedule) => (
              <div key={schedule} className="flex items-center space-x-2">
                <Checkbox
                  id={`schedule-${schedule}`}
                  checked={filters.schedules.includes(schedule)}
                  onCheckedChange={() => toggleSchedule(schedule)}
                />
                <Label
                  htmlFor={`schedule-${schedule}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {schedule}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Cold Chain</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cold-chain-yes"
                checked={filters.coldChain === true}
                onCheckedChange={(checked) =>
                  updateFilter("coldChain", checked ? true : null)
                }
              />
              <Label htmlFor="cold-chain-yes" className="text-sm font-normal cursor-pointer">
                Required
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cold-chain-no"
                checked={filters.coldChain === false}
                onCheckedChange={(checked) =>
                  updateFilter("coldChain", checked ? false : null)
                }
              />
              <Label htmlFor="cold-chain-no" className="text-sm font-normal cursor-pointer">
                Not Required
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Stock Status</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stock-yes"
                checked={filters.inStock === true}
                onCheckedChange={(checked) =>
                  updateFilter("inStock", checked ? true : null)
                }
              />
              <Label htmlFor="stock-yes" className="text-sm font-normal cursor-pointer">
                In Stock
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stock-no"
                checked={filters.inStock === false}
                onCheckedChange={(checked) =>
                  updateFilter("inStock", checked ? false : null)
                }
              />
              <Label htmlFor="stock-no" className="text-sm font-normal cursor-pointer">
                Out of Stock
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



