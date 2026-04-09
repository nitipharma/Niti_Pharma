"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"
import { Menu, X } from "lucide-react"
import { PWAInstaller } from "./pwa-installer"
import { OfflinePrepare } from "./offline-prepare"

const mainNavItems = [
  { href: "/catalog", label: "Catalog" },
  { href: "/coverage", label: "Coverage" },
  { href: "/compliance", label: "Compliance" },
  { href: "/contact", label: "Contact" },
]

const platformNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/tracking", label: "Tracking" },
  { href: "/documents", label: "Documents" },
  { href: "/exceptions", label: "Exceptions" },
  { href: "/reconciliation", label: "Reconciliation" },
  { href: "/reports", label: "Reports" },
  { href: "/billing", label: "Billing" },
  { href: "/customers", label: "Customers" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-y-2 px-4 py-2 sm:px-6 lg:h-16 lg:min-h-0 lg:py-0">
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-lg sm:text-xl font-bold">Niti Pharma</span>
        </Link>
        
        {/* Desktop: main + platform nav — scroll on medium screens to avoid overflow */}
        <nav
          className="hidden max-h-[4.5rem] min-w-0 flex-1 overflow-x-auto lg:flex lg:justify-center lg:mx-4 xl:mx-6"
          aria-label="Primary"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium sm:text-sm xl:flex-nowrap xl:gap-x-5">
            {mainNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 transition-colors hover:text-foreground/80 whitespace-nowrap",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <span
              className="hidden shrink-0 text-muted-foreground xl:inline"
              aria-hidden
            >
              |
            </span>
            <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground xl:inline">
              Platform
            </span>
            {platformNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 transition-colors hover:text-foreground/80 whitespace-nowrap",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <OfflinePrepare />
            <PWAInstaller />
          </div>
          <ThemeToggle />
          
          {/* Mobile Menu Button - Shown on mobile/tablet, hidden on large screens */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background max-h-[min(80vh,28rem)] overflow-y-auto">
          <nav className="container px-4 py-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pb-1">
              Site
            </p>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block py-2 text-base font-medium transition-colors",
                    isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground/80"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pt-3 pb-1">
              Platform demo
            </p>
            {platformNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block py-2 text-base font-medium transition-colors",
                    isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground/80"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="pt-2 border-t space-y-2">
              <OfflinePrepare />
              <PWAInstaller />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}



