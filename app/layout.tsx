import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Outfit } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "@/components/theme-provider"
import { PwaRegister } from "@/components/pwa-register"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-brand",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1219" },
  ],
}

export const metadata: Metadata = {
  title: "CourtScout — Ubud & Sanur Court Availability",
  description:
    "Find available padel court time slots at clubs in Ubud and Sanur, Bali. Live availability, instant booking.",
  metadataBase: new URL("https://courtscout.app"),
  openGraph: {
    title: "CourtScout — Find Open Courts in Ubud & Sanur",
    description:
      "Live padel court availability in Bali. Find open time slots and book your next game in seconds.",
    type: "website",
    siteName: "CourtScout",
  },
  twitter: {
    card: "summary_large_image",
    title: "CourtScout — Find Open Courts",
    description:
      "Live padel court availability in Ubud & Sanur, Bali. Book your next game in seconds.",
  },
}

export default function RootLayout({
  children,
  sheet,
}: Readonly<{
  children: React.ReactNode
  sheet: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <NuqsAdapter>
            <PwaRegister />
            {children}
            {sheet}
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
