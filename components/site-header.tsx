"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { PWAInstaller } from "./pwa-installer"
import { OfflinePrepare } from "./offline-prepare"
import { PLATFORM_LINKS } from "@/lib/platform-nav"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const mainNavItems = [
  { href: "/catalog", label: "Catalog" },
  { href: "/coverage", label: "Coverage" },
  { href: "/compliance", label: "Compliance" },
  { href: "/contact", label: "Contact" },
]

function usePlatformNavActive(pathname: string) {
  return useMemo(() => {
    if (pathname === "/platform" || pathname.startsWith("/platform/")) {
      return true
    }
    return PLATFORM_LINKS.some((item) => {
      if (pathname === item.href) return true
      if (item.href === "/") return false
      return pathname.startsWith(`${item.href}/`)
    })
  }, [pathname])
}

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const platformNavActive = usePlatformNavActive(pathname)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:h-16">
        <Link
          href="/"
          className="flex shrink-0 items-center text-lg font-semibold tracking-tight sm:text-xl"
        >
          Niti Pharma
        </Link>

        {/* Desktop: centered cluster — no horizontal scroll */}
        <nav
          className="hidden flex-1 items-center justify-center gap-8 lg:flex"
          aria-label="Primary"
        >
          <div className="flex items-center gap-6">
            {mainNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1 px-3 text-sm font-medium",
                  platformNavActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Platform
                <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                Distributor demo
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/platform" className="cursor-pointer font-medium">
                  Overview & features
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {PLATFORM_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "cursor-pointer",
                        isActive && "bg-accent/60"
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <OfflinePrepare />
            <PWAInstaller />
          </div>
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t bg-background lg:hidden">
          <nav
            className="container max-h-[min(85vh,32rem)] space-y-1 overflow-y-auto px-4 py-4"
            aria-label="Mobile"
          >
            <p className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Site
            </p>
            {mainNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block rounded-md py-2.5 text-base font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}

            <p className="pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Platform
            </p>
            <Link
              href="/platform"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/platform"
                  ? "text-foreground"
                  : "text-foreground/90 hover:bg-muted/50"
              )}
            >
              Overview & features
            </Link>
            <div className="grid gap-0.5 pt-1">
              {PLATFORM_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block rounded-md py-2 pl-1 text-[15px] transition-colors",
                      isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 space-y-2 border-t pt-4 sm:hidden">
              <OfflinePrepare />
              <PWAInstaller />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
