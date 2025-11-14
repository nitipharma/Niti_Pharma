import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 sm:py-10 md:py-12 px-4 sm:px-6">
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold">Niti Pharma</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Premium B2B pharmaceutical distribution services.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/catalog" className="text-muted-foreground hover:text-foreground">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/coverage" className="text-muted-foreground hover:text-foreground">
                  Coverage
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-muted-foreground hover:text-foreground">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact Sales
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <h4 className="text-xs sm:text-sm font-semibold">Legal</h4>
            <p className="text-xs text-muted-foreground">
              Demo only—no ordering. This is a demonstration website for portfolio purposes.
            </p>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 border-t pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Niti Pharma. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}



