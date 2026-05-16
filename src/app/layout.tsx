import type { Metadata } from 'next'
import { JetBrains_Mono, Manrope, Space_Grotesk } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CartStoreHydrator } from '@/components/providers/CartStoreHydrator'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
})

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-code',
})

export const metadata: Metadata = {
  title: 'BEPA | Auto Parts Storefront',
  description: 'A polished auto-parts storefront with curated catalog design, stronger UX, and demo-safe rendering.',
  keywords: ['auto parts', 'car parts', 'led headlights', 'batteries', 'brakes', 'filters', 'Georgia'],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <CartStoreHydrator />
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
