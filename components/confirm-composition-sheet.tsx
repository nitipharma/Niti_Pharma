"use client"

import { useState, useEffect } from "react"
import { type ParsedLabel, type ParsedActive } from "@/lib/parse-label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmCompositionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parsed: ParsedLabel | null
  onConfirm: (parsed: ParsedLabel) => void
  onEdit?: (parsed: ParsedLabel) => void // For real-time updates
}

export function ConfirmCompositionSheet({
  open,
  onOpenChange,
  parsed,
  onConfirm,
  onEdit,
}: ConfirmCompositionSheetProps) {
  const [edited, setEdited] = useState<ParsedLabel | null>(null)

  useEffect(() => {
    if (parsed) {
      setEdited({ ...parsed, actives: [...parsed.actives] })
    }
  }, [parsed])

  // Notify parent of edits (for state sync, not real-time matching)
  // Real-time matching happens when user clicks "Search Inventory"
  useEffect(() => {
    if (edited && onEdit && open) {
      // Only notify if there's at least one valid active
      const hasValidActive = edited.actives.some((a) => a.inn.trim() && a.mg > 0)
      if (hasValidActive) {
        // Just sync state, don't trigger matching (matching happens on confirm)
        onEdit(edited)
      }
    }
  }, [edited, onEdit, open])

  if (!edited) {
    return null
  }

  const handleAddActive = () => {
    setEdited({
      ...edited,
      actives: [
        ...edited.actives,
        { inn: "", mg: 0, confidence: 0.5 },
      ],
    })
  }

  const handleRemoveActive = (index: number) => {
    setEdited({
      ...edited,
      actives: edited.actives.filter((_, i) => i !== index),
    })
  }

  const handleActiveChange = (index: number, field: "inn" | "mg", value: string | number) => {
    const newActives = [...edited.actives]
    newActives[index] = {
      ...newActives[index],
      [field]: field === "mg" ? Number(value) : value,
    }
    setEdited({ ...edited, actives: newActives })
  }

  const handleConfirm = () => {
    // Filter out empty actives
    const validActives = edited.actives.filter((a) => a.inn.trim() && a.mg > 0)
    if (validActives.length === 0) {
      return
    }
    onConfirm({ ...edited, actives: validActives })
  }

  const confidenceColor = edited.confidence >= 0.8 ? "bg-green-500" : edited.confidence >= 0.6 ? "bg-yellow-500" : "bg-red-500"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Confirm Composition</SheetTitle>
          <SheetDescription>
            Review and edit the extracted composition before searching the inventory.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Confidence Badge */}
          <div className="flex items-center gap-2">
            <Label>Confidence:</Label>
            <Badge className={cn(confidenceColor, "text-white")}>
              {Math.round(edited.confidence * 100)}%
            </Badge>
          </div>

          {/* Active Ingredients Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Active Ingredients</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddActive}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">INN</TableHead>
                    <TableHead className="w-[30%]">Strength (mg)</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {edited.actives.map((active, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={active.inn}
                          onChange={(e) =>
                            handleActiveChange(index, "inn", e.target.value)
                          }
                          placeholder="e.g., Paracetamol"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={active.mg}
                          onChange={(e) =>
                            handleActiveChange(index, "mg", e.target.value)
                          }
                          placeholder="e.g., 500"
                          className="h-8"
                          min="0"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveActive(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Dosage Form */}
          <div className="space-y-2">
            <Label>Dosage Form</Label>
            <Select
              value={edited.dosage_form || ""}
              onValueChange={(value) =>
                setEdited({
                  ...edited,
                  dosage_form: value as ParsedLabel["dosage_form"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dosage form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="capsule">Capsule</SelectItem>
                <SelectItem value="syrup">Syrup</SelectItem>
                <SelectItem value="injection">Injection</SelectItem>
                <SelectItem value="ointment">Ointment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Release Type */}
          <div className="space-y-2">
            <Label>Release Type</Label>
            <Select
              value={edited.release_type || "IR"}
              onValueChange={(value) =>
                setEdited({
                  ...edited,
                  release_type: value as ParsedLabel["release_type"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IR">IR (Immediate Release)</SelectItem>
                <SelectItem value="ER">ER (Extended Release)</SelectItem>
                <SelectItem value="SR">SR (Sustained Release)</SelectItem>
                <SelectItem value="XR">XR (Extended Release)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          {edited.notes && edited.notes.length > 0 && (
            <div className="space-y-2">
              <Label>Notes</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                {edited.notes.map((note, index) => (
                  <div key={index}>• {note}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={edited.actives.filter((a) => a.inn.trim() && a.mg > 0).length === 0}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Search Inventory
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

