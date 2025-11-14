import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

type BreadcrumbItem = {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
      <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground overflow-x-auto">
        <li className="flex-shrink-0">
          <Link
            href="/"
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Home"
          >
            <Home className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center flex-shrink-0">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2" aria-hidden="true" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}



