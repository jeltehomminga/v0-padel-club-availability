import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, DM_Serif_Display } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { PwaRegister } from "@/components/pwa-register"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8603c",
}

export const metadata: Metadata = {
  title: "PadelPulse — Ubud & Sanur Court Availability",
  description:
    "Find available padel court time slots at clubs in Ubud and Sanur, Bali. Live availability, instant booking.",
  metadataBase: new URL("https://padelpulse.space"),
  openGraph: {
    title: "PadelPulse — Find Open Courts in Ubud & Sanur",
    description:
      "Live padel court availability in Bali. Find open time slots and book your next game in seconds.",
    type: "website",
    siteName: "PadelPulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "PadelPulse — Find Open Courts",
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
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="font-sans antialiased">
        <NuqsAdapter>
          <PwaRegister />
          {children}
          {sheet}
        </NuqsAdapter>
      </body>
    </html>
  )
}
