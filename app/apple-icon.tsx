import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background: "linear-gradient(135deg, #e8603c 0%, #d4502e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid pattern hint */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.08,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{ height: 1, background: "white", width: "100%" }}
          />
        ))}
      </div>

      {/* Padel ball */}
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background:
            "linear-gradient(145deg, #ffe566 0%, #ffd700 50%, #e6c200 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.3)",
        }}
      >
        {/* Ball felt texture hint */}
        <div
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2) 0%, transparent 60%)",
          }}
        />
        {/* Ball seam */}
        <div
          style={{
            width: 40,
            height: 90,
            borderRadius: "50%",
            border: "3px solid rgba(180,140,0,0.4)",
            background: "transparent",
          }}
        />
      </div>
    </div>,
    { ...size },
  )
}
