import { ImageResponse } from "next/og"

export const alt = "PadelPulse — Live Court Availability in Ubud & Sanur"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Court grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          opacity: 0.06,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: "absolute",
              top: i * 55,
              left: 0,
              right: 0,
              height: 1,
              background: "white",
            }}
          />
        ))}
        {Array.from({ length: 22 }).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: i * 58,
              width: 1,
              background: "white",
            }}
          />
        ))}
      </div>

      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,96,60,0.25) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Ball icon row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background:
                "linear-gradient(145deg, #ffe566 0%, #ffd700 50%, #e6c200 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(255,215,0,0.3)",
            }}
          >
            <div
              style={{
                width: 20,
                height: 44,
                borderRadius: "50%",
                border: "2.5px solid rgba(180,140,0,0.4)",
                background: "transparent",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.5)",
              fontWeight: 500,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
            }}
          >
            PadelPulse
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.1,
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Find Open Courts</span>
          <span style={{ color: "#e8603c" }}>in Ubud & Sanur</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5,
            maxWidth: 650,
          }}
        >
          Live padel court availability in Bali. Book your next game in seconds.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background:
              "linear-gradient(90deg, #e8603c 0%, #ffd700 50%, #e8603c 100%)",
          }}
        />
      </div>
    </div>,
    { ...size },
  )
}
