import Link from "next/link"
import { Logo } from "./logo"
import { Mail, Phone, MapPin } from "lucide-react"

const companyLinks = [
  { href: "/catalog", label: "Product catalog" },
  { href: "/coverage", label: "Service coverage" },
  { href: "/compliance", label: "Compliance & quality" },
  { href: "/contact", label: "Contact sales" },
]

const platformLinks = [
  { href: "/platform", label: "Platform overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/tracking", label: "Tracking" },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40 print:hidden">
      <div className="container px-4 py-12 sm:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <Link href="/" aria-label="Niti Pharma — home">
              <Logo />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              B2B pharmaceutical distribution for pharmacies across India —
              licensed, cold-chain capable, and built on 25+ years of supply
              experience.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Platform demo</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Get in touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a
                  href="mailto:nitipharma04@gmail.com"
                  className="transition-colors hover:text-foreground"
                >
                  nitipharma04@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a
                  href="tel:+919226206169"
                  className="transition-colors hover:text-foreground"
                >
                  +91 92262 06169
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>Kalyan, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row md:mt-12 md:pt-8">
          <p>&copy; {new Date().getFullYear()} Niti Pharma. All rights reserved.</p>
          <p>Demonstration website — ordering is simulated for portfolio purposes.</p>
        </div>
      </div>
    </footer>
  )
}
