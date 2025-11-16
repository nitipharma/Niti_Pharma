import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { DiagnosticsProvider } from "@/components/diagnostics-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Niti Pharma",
  description: "Trusted B2B pharmaceutical distributor serving pharmacies nationwide with comprehensive product catalog, reliable delivery, and full compliance.",
  openGraph: {
    title: "Niti Pharma",
    description: "Trusted B2B pharmaceutical distributor serving pharmacies nationwide.",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Niti Pharma",
  },
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

