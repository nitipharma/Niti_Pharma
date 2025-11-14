"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"
import { Menu, X } from "lucide-react"

const navItems = [
  { href: "/catalog", label: "Catalog" },
  { href: "/coverage", label: "Coverage" },
  { href: "/compliance", label: "Compliance" },
  { href: "/contact", label: "Contact" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-lg sm:text-xl font-bold">Niti Pharma</span>
        </Link>
        
        {/* Desktop Navigation - Hidden on mobile/tablet, shown on large screens */}
        <nav className="hidden lg:flex flex-1 items-center justify-center space-x-6 text-sm font-medium mx-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 whitespace-nowrap",
                  isActive ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
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
        <div className="lg:hidden border-t bg-background">
          <nav className="container px-4 py-4 space-y-3">
            {navItems.map((item) => {
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
          </nav>
        </div>
      )}
    </header>
  )
}



