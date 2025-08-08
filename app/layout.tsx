import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { PWARegister } from "@/components/pwa-register"
import { OfflineBanner } from "@/components/offline-banner"
import { I18nProvider } from "@/components/i18n-provider"

export const metadata: Metadata = {
  title: 'Dragon Bridge - Mandarin Teacher',
  description: 'Practice characters, dialects, and pronunciation',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0d9488" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <I18nProvider>
          {children}
          <OfflineBanner />
          <PWARegister />
        </I18nProvider>
      </body>
    </html>
  )
}
