import { z } from "zod"

// Active ingredient schema
export const ActiveSchema = z.object({
  inn: z.string().min(1, "INN is required"),
  mg: z.number().positive("mg must be positive"),
})

export type Active = z.infer<typeof ActiveSchema>

// Dosage form enum
export const DosageFormSchema = z.enum([
  "tablet",
  "capsule",
  "syrup",
  "injection",
  "ointment",
])

export type DosageForm = z.infer<typeof DosageFormSchema>

// Release type enum
export const ReleaseTypeSchema = z.enum(["IR", "ER", "SR", "XR"])

export type ReleaseType = z.infer<typeof ReleaseTypeSchema>

// Schedule enum
export const ScheduleSchema = z.enum(["OTC", "Rx", "Schedule H"])

export type Schedule = z.infer<typeof ScheduleSchema>

// Product schema
export const ProductSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
  slug: z.string().min(1, "slug is required"),
  brand_name: z.string().min(1, "brand_name is required"),
  dosage_form: DosageFormSchema,
  release_type: ReleaseTypeSchema,
  actives: z.array(ActiveSchema).min(1, "at least one active ingredient is required"),
  therapeutic_class: z.string().min(1, "therapeutic_class is required"),
  schedule: ScheduleSchema,
  cold_chain: z.boolean(),
  in_stock: z.boolean(),
  pack_size: z.string().min(1, "pack_size is required"),
  hsn: z.string().min(1, "HSN is required"),
  gtin: z.string().min(1, "GTIN is required"),
  ndc: z.string().nullable(),
  images: z.array(z.string()).default([]),
  substitutes: z.array(z.string().uuid()).default([]),
})

export type Product = z.infer<typeof ProductSchema>

// Type guards
export function isProduct(value: unknown): value is Product {
  return ProductSchema.safeParse(value).success
}

export function isActive(value: unknown): value is Active {
  return ActiveSchema.safeParse(value).success
}

// Helper function to validate product
export function validateProduct(data: unknown): Product {
  return ProductSchema.parse(data)
}

// Helper function to validate array of products
export function validateProducts(data: unknown): Product[] {
  return z.array(ProductSchema).parse(data)
}

