import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, DM_Serif_Display } from "next/font/google"
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
  title: "Padel Courts Bali — Ubud & Sanur Availability",
  description:
    "Find available padel court time slots at clubs in Ubud and Sanur, Bali.",
  generator: "v0.app",
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  openGraph: {
    title: "Padel Courts Bali",
    description:
      "Find available padel courts in Ubud & Sanur, Bali. Live availability.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="font-sans antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  )
}
