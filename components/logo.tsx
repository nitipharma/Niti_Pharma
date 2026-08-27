import { cn } from "@/lib/utils"

interface LogoMarkProps {
  className?: string
}

/**
 * Brand mark: two crossing capsules forming a pharmacy plus,
 * set in a rounded tile. Inherits nothing — colors are fixed so the
 * mark stays consistent in both themes.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="np-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0e7c6b" />
          <stop offset="100%" stopColor="#0a5c50" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#np-tile)" />
      {/* vertical capsule */}
      <rect x="12.5" y="6" width="7" height="20" rx="3.5" fill="#ffffff" />
      {/* horizontal capsule, half-toned to read as two crossing tablets */}
      <rect x="6" y="12.5" width="20" height="7" rx="3.5" fill="#ffffff" opacity="0.92" />
      <rect x="6" y="12.5" width="10" height="7" rx="3.5" fill="#8be3d2" opacity="0.85" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  markClassName?: string
}

export function Logo({ className, markClassName }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="whitespace-nowrap text-lg font-semibold leading-none tracking-tight">
        Niti<span className="text-primary"> Pharma</span>
      </span>
    </span>
  )
}
