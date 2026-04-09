"use client"

import { usePathname } from "next/navigation"

export function DemoEnvironmentBanner() {
  const pathname = usePathname()
  const isDocuments = pathname?.startsWith("/documents")

  return (
    <div
      role="status"
      className="w-full border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 sm:text-sm"
    >
      {isDocuments ? (
        <>
          AI document processing pipeline active — uploads are processed via OCR +
          Claude extraction
        </>
      ) : (
        <>Demo environment — all data is simulated for illustration purposes</>
      )}
    </div>
  )
}
