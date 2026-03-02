import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CourtScout",
    short_name: "CourtScout",
    description:
      "Find available padel court time slots at clubs in Ubud and Sanur, Bali.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fc",
    theme_color: "#2563eb",
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
