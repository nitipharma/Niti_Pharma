export type PlatformLink = {
  href: string
  label: string
  /** Short line for the /platform overview page */
  description: string
}

/** Single source for the distributor demo workspace nav + copy */
export const PLATFORM_LINKS: PlatformLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Volume, exceptions, and delivery signals in one view.",
  },
  {
    href: "/orders",
    label: "Orders",
    description: "Create orders, upload POs, and track fulfillment status.",
  },
  {
    href: "/tracking",
    label: "Tracking",
    description: "Carrier milestones and ETAs for outbound shipments.",
  },
  {
    href: "/tracking/manage",
    label: "Shipment management",
    description: "Admin tools for status updates and carrier waypoints.",
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Upload invoices and POs; OCR and AI extraction pipeline.",
  },
  {
    href: "/exceptions",
    label: "Exceptions",
    description: "Variance cases from document validation for review.",
  },
  {
    href: "/reconciliation",
    label: "Reconciliation",
    description: "Three-way match across PO, invoice, and delivery records.",
  },
  {
    href: "/reports",
    label: "Reports",
    description: "Operational and financial summaries for the demo workspace.",
  },
  {
    href: "/billing",
    label: "Billing",
    description: "Outstanding invoices and payment status (admin).",
  },
  {
    href: "/customers",
    label: "Customers",
    description: "Account overview, orders, and billing per customer.",
  },
]
