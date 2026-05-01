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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function isStorageAvailable(type) {
              try {
                var storage = window[type];
                var x = '__storage_test__';
                storage.setItem(x, x);
                storage.removeItem(x);
                return true;
              } catch (e) {
                return false;
              }
            }
            function createShim() {
              var storage = {};
              return {
                getItem: function(k) { return storage[k] || null; },
                setItem: function(k, v) { storage[k] = v; },
                removeItem: function(k) { delete storage[k]; },
                clear: function() { storage = {}; },
                get length() { return Object.keys(storage).length; },
                key: function(i) { return Object.keys(storage)[i] || null; }
              };
            }
            if (!isStorageAvailable('localStorage')) {
              try { Object.defineProperty(window, 'localStorage', { value: createShim() }); } catch (e) { console.warn('Could not shim localStorage'); }
            }
            if (!isStorageAvailable('sessionStorage')) {
              try { Object.defineProperty(window, 'sessionStorage', { value: createShim() }); } catch (e) { console.warn('Could not shim sessionStorage'); }
            }
          })();
        ` }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <CursorReset />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
