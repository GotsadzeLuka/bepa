'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import type { StoreCategory } from '@/lib/catalog'

interface AppChromeProps {
  children: React.ReactNode
  categories: StoreCategory[]
}

export function AppChrome({ children, categories }: AppChromeProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') ?? false

  return (
    <div className="relative flex min-h-screen flex-col">
      {!isAdminRoute && <Header categories={categories} />}
      <main className="flex-1">{children}</main>
      {!isAdminRoute && <Footer categories={categories} />}
    </div>
  )
}
