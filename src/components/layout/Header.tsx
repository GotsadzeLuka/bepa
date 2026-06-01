'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  ChevronDown,
  Heart,
  Mail,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { getCategoryName, type StoreCategory } from '@/lib/catalog'
import { useCartStore } from '@/store/cart'

interface HeaderProps {
  categories: StoreCategory[]
}

export function Header({ categories }: HeaderProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  const itemCount = useCartStore((state) => state.getItemCount())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const navCategories = categories.slice(0, 6)
  const supabase = hasSupabaseConfig ? createClient() : null

  useEffect(() => {
    if (!supabase) return

    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (currentUser) {
        setUser({ id: currentUser.id, email: currentUser.email || '' })
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()

    if (!searchQuery.trim()) return

    router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    setSearchQuery('')
    setSearchOpen(false)
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/products', label: t('products') },
    { href: '/products?sale=true', label: t('sale'), highlight: true },
    { href: '/news', label: t('news') },
    { href: '/contact', label: t('contact') },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[#f6f3ee]/88 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.75)] backdrop-blur-2xl">
      <div className="bg-slate-950 text-slate-200">
        <div className="container flex min-h-10 items-center justify-between gap-3 py-2 text-xs">
          <div className="hidden items-center gap-5 sm:flex">
            <a href="tel:+995322052627" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <Phone className="h-3.5 w-3.5" />
              032 2 05 26 27
            </a>
            <a href="mailto:info@bepa.ge" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <Mail className="h-3.5 w-3.5" />
              info@bepa.ge
            </a>
          </div>
          <div className="min-w-0 flex-1 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300 sm:flex-none sm:text-[11px]">
            {t('shippingBanner')}
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="container">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-2 py-4 sm:gap-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full border-white/70 bg-white/76 shadow-sm lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('menu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] border-r-white/70 bg-[#f6f3ee] p-0">
                <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="border-b border-slate-200/80 px-5 py-5">
                    <Link href="/" className="font-display text-2xl font-black tracking-[0.18em] text-slate-950">
                      BEPA
                    </Link>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-5 py-5">
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Link href="/" className="flex h-11 items-center rounded-full px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-white">
                          {t('home')}
                        </Link>
                      </SheetClose>
                      {navLinks.map((link) => (
                        <SheetClose key={link.href} asChild>
                          <Link
                            href={link.href}
                            className={`flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-white ${
                              link.highlight ? 'text-rose-600' : 'text-slate-700'
                            }`}
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {t('categories')}
                      </p>
                      <div className="mt-3 space-y-1">
                        {navCategories.map((category) => (
                          <SheetClose key={category.id} asChild>
                            <Link
                              href={`/products?category=${category.slug}`}
                              className="flex h-10 items-center rounded-full px-4 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              {getCategoryName(category, locale)}
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  </nav>

                  <div className="border-t border-slate-200/80 px-5 py-5">
                    {user ? (
                      <div className="space-y-3">
                        <p className="truncate text-sm text-slate-500">{user.email}</p>
                        <div className="flex gap-2">
                          <SheetClose asChild>
                            <Link href="/account" className="flex-1">
                              <Button variant="outline" className="w-full rounded-full">
                                {t('account')}
                              </Button>
                            </Link>
                          </SheetClose>
                          <Button variant="outline" className="rounded-full" onClick={handleLogout}>
                            {t('logout')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <SheetClose asChild>
                        <Link href="/login">
                          <Button className="w-full rounded-full">{t('login')}</Button>
                        </Link>
                      </SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center">
              <span className="font-display text-[1.75rem] font-black tracking-[0.18em] text-slate-950 sm:text-3xl">
                BEPA
              </span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden flex-1 lg:flex">
            <div className="relative mx-auto w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="h-12 rounded-full border-white/70 bg-white/88 pl-11 pr-4 shadow-sm"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-white/70 bg-white/76 shadow-sm lg:hidden"
              aria-expanded={searchOpen}
              aria-label={t('search')}
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/wishlist" className="hidden sm:block">
              <Button variant="outline" size="icon" className="rounded-full border-white/70 bg-white/76 shadow-sm" aria-label={t('wishlist')}>
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/cart" className="relative">
              <Button variant="outline" size="icon" className="rounded-full border-white/70 bg-white/76 shadow-sm" aria-label={t('cart')}>
                <ShoppingCart className="h-5 w-5" />
                {hasHydrated && itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Button>
            </Link>

            <div className="hidden sm:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-white/70 bg-white/76 shadow-sm" aria-label={t('account')}>
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/80 bg-white/95">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium text-slate-800">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account">{t('account')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders">{t('myOrders')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist">{t('wishlist')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                      {t('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button className="rounded-full px-5 shadow-sm">{t('login')}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="animate-fade-up pb-4 lg:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative rounded-[1.5rem] border border-white/70 bg-white/78 p-2 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder={t('searchPlaceholder')}
                  className="h-11 rounded-full border-transparent bg-white pl-11 pr-4 shadow-none"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </div>

      <nav className="hidden border-t border-white/70 bg-white/45 lg:block">
        <div className="container flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full border-white/70 bg-white/80">
                  {t('categories')}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 rounded-2xl border-white/80 bg-white/95">
                {navCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`/products?category=${category.slug}`}>
                      {getCategoryName(category, locale)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full px-4 ${link.highlight ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700' : ''}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {t('navTagline')}
          </p>
        </div>
      </nav>
    </header>
  )
}
