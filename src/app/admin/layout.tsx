'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Newspaper,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const sidebarLinks = [
  { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', labelKey: 'categories', icon: FolderTree },
  { href: '/admin/products', labelKey: 'products', icon: Package },
  { href: '/admin/orders', labelKey: 'orders', icon: ShoppingCart },
  { href: '/admin/customers', labelKey: 'customers', icon: Users },
  { href: '/admin/reviews', labelKey: 'reviews', icon: Star },
  { href: '/admin/news', labelKey: 'news', icon: Newspaper },
  { href: '/admin/settings', labelKey: 'settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('admin.layout')
  const supabase = hasSupabaseConfig ? createClient() : null
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#09090b_0%,#111113_100%)] text-white">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/88 p-4 backdrop-blur-xl lg:hidden">
        <Link href="/admin" className="text-xl font-bold tracking-tight">
          {t('brand')}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? t('closeNav') : t('openNav')}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform lg:translate-x-0 lg:static',
            'shadow-[24px_0_90px_-60px_rgba(0,0,0,0.95)]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            <div className="border-b border-white/10 p-6">
              <Link href="/admin" className="block text-xl font-bold tracking-tight">
                {t('brand')}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">{t('subtitle')}</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href || 
                  (link.href !== '/admin' && pathname.startsWith(link.href))
                const Icon = link.icon

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {t(`nav.${link.labelKey}`)}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="mb-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                <LanguageSwitcher />
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-zinc-400 hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                {t('logout')}
              </Button>
              <Link href="/" className="block mt-2">
                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                >
                  {t('viewStore')}
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          <div className="p-5 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
