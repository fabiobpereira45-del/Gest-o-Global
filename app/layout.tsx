import type { Metadata, Viewport } from "next"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#4c1d95",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "IBAD - Instituto Bíblico das Assembleias de Deus",
  description: "Sistema de Gestão Acadêmica do IBAD - Núcleo Cosme de Fárias",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IBAD",
  },
  formatDetection: {
    telephone: false,
  },
}

import { ErrorBoundary } from "@/components/error-boundary"
import { CursorReset } from "@/components/cursor-reset"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <CursorReset />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
