import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Padel ball */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "linear-gradient(145deg, #ffe566 0%, #ffd700 50%, #e6c200 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {/* Ball seam curve */}
          <div
            style={{
              position: "absolute",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 8,
                height: 18,
                borderRadius: "50%",
                border: "1.5px solid rgba(180,140,0,0.5)",
                background: "transparent",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
