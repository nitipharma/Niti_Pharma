import { NextRequest, NextResponse } from "next/server"

function clampDimension(raw: string | undefined, fallback: number): number {
  const parsed = parseInt(raw ?? "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, 2000)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  const { params: pathParams } = await params
  // Only numeric values ever reach the SVG — the raw path segments are
  // attacker-controlled and this response is served as image/svg+xml
  const width = clampDimension(pathParams?.[0], 400)
  const height = clampDimension(pathParams?.[1], 400)

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        Product Image
      </text>
    </svg>
  `.trim()

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  })
}
