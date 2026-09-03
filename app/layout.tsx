import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { DiagnosticsProvider } from "@/components/diagnostics-provider"
import { getSiteUrl } from "@/lib/site"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Niti Pharma | B2B Pharmaceutical Distribution",
    template: "%s | Niti Pharma",
  },
  description: "Licensed B2B pharmaceutical distributor serving pharmacies across India — 30,000+ SKUs, cold-chain logistics, batch-level traceability, and dependable delivery.",
  openGraph: {
    title: "Niti Pharma | B2B Pharmaceutical Distribution",
    description: "Licensed B2B pharmaceutical distributor serving pharmacies across India.",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Niti Pharma",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a5c50",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ServiceWorkerRegister />
        <DiagnosticsProvider />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

