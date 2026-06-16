'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Package, Heart, LogOut, Settings } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { isAccountNavItemActive } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const common = useTranslations('common')
  const account = useTranslations('account')
  const supabase = useMemo(() => hasSupabaseConfig ? createClient() : null, [])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    if (!supabase) {
      router.push('/login')
      return
    }

    // Middleware already guards /account server-side; a local session read is
    // enough for UI gating and avoids an auth round-trip on every visit.
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      router.push('/login')
      return
    }

    setUser(session.user)
    setLoading(false)
  }, [router, supabase])

  useEffect(() => {
    void Promise.resolve().then(checkAuth)
  }, [checkAuth])

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const accountLinks = [
    { href: '/account', label: common('account'), icon: User },
    { href: '/account/orders', label: common('myOrders'), icon: Package },
    { href: '/wishlist', label: common('wishlist'), icon: Heart },
    { href: '/account/settings', label: account('settings'), icon: Settings },
  ]

  if (loading) {
    return (
      <div className="container py-8 sm:py-10 lg:py-12">
        <div className="animate-pulse">
          <div className="mb-8 h-10 w-56 rounded-full bg-white/60" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="h-72 rounded-[2rem] bg-white/60" />
            <div className="h-96 rounded-[2rem] bg-white/60 md:col-span-3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">BEPA</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          My Account
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:items-start">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="rounded-[2rem] border border-white/70 bg-white/86 p-4 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl">
            {/* User Info */}
            <div className="mb-5 flex items-center gap-3 border-b border-slate-200/80 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <User className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{user?.email}</p>
                <p className="text-xs text-slate-500">Member</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {accountLinks.map((link) => {
                const Icon = link.icon
                const isActive = isAccountNavItemActive(link.href, pathname)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex min-h-10 items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-950'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="mt-5 border-t border-slate-200/80 pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">{children}</div>
      </div>
    </div>
  )
}
