"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { OfflinePrepare } from "./offline-prepare"
import { Logo } from "./logo"
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
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 print:hidden">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Niti Pharma — home">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Primary"
        >
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  platformNavActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Platform
                <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
                {platformNavActive && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Distributor demo
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/platform" className="cursor-pointer font-medium">
                  Overview &amp; features
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
                      className={cn("cursor-pointer", isActive && "bg-accent/60")}
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
          </div>
          <ThemeToggle />
          <Button asChild size="sm" className="hidden lg:inline-flex">
            <Link href="/contact">Contact sales</Link>
          </Button>

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
            <p className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Site
            </p>
            {[...mainNavItems, { href: "/contact", label: "Contact" }].map(
              (item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block rounded-md px-2 py-2.5 text-base font-medium transition-colors",
                      isActive
                        ? "bg-accent/60 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              }
            )}

            <p className="pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
              Overview &amp; features
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
                      "block rounded-md px-2 py-2 text-[15px] transition-colors",
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
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
