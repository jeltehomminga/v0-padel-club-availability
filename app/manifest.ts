import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Padel Courts Bali",
    short_name: "Padel Bali",
    description:
      "Find available padel court time slots at clubs in Ubud and Sanur, Bali.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#e8603c",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  }
}
