import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PadelPulse",
    short_name: "PadelPulse",
    description:
      "Find available padel court time slots at clubs in Ubud and Sanur, Bali.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#e8603c",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
