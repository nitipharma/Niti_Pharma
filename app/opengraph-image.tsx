import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Niti Pharma — B2B Pharmaceutical Distribution"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0e7c6b 0%, #0a5c50 55%, #073f37 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Crossing-capsules mark */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 18,
                height: 56,
                borderRadius: 9,
                background: "#ffffff",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 56,
                height: 18,
                borderRadius: 9,
                background: "#ffffff",
                opacity: 0.9,
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            Niti Pharma
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            The dependable way to keep your pharmacy stocked
          </div>
          <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>
            30,000+ SKUs · Cold-chain logistics · Batch-level traceability
          </div>
        </div>
      </div>
    ),
    size
  )
}
