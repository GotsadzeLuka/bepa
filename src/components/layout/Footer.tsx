'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowUpRight, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { getCategoryName, type StoreCategory } from '@/lib/catalog'

interface FooterProps {
  categories: StoreCategory[]
}

export function Footer({ categories }: FooterProps) {
  const locale = useLocale()
  const t = useTranslations('footer')
  const tc = useTranslations('common')

  const quickLinks = [
    { href: '/', label: tc('home') },
    { href: '/products', label: tc('products') },
    { href: '/products?sale=true', label: tc('sale') },
    { href: '/news', label: tc('news') },
    { href: '/contact', label: tc('contact') },
  ]

  const accountLinks = [
    { href: '/account', label: tc('account') },
    { href: '/account/orders', label: tc('myOrders') },
    { href: '/wishlist', label: tc('wishlist') },
    { href: '/cart', label: tc('cart') },
  ]

  return (
    <footer className="mt-auto bg-slate-950 text-slate-300">
      <div className="container py-10 sm:py-14">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.25),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] p-6 shadow-[0_24px_80px_-48px_rgba(249,115,22,0.75)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">BEPA</p>
              <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t('topTagline')}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                {t('ctaCopy')}
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-primary"
            >
              {t('browseCatalog')}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Link href="/" className="font-display text-3xl font-black tracking-[0.18em] text-white">
              BEPA
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
              {t('storefrontCopy')}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+995322052627" className="transition-colors hover:text-white">
                  032 2 05 26 27
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:info@bepa.ge" className="transition-colors hover:text-white">
                  info@bepa.ge
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>Tbilisi, Georgia</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{t('quickLinks')}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{tc('categories')}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link href={`/products?category=${category.slug}`} className="transition-colors hover:text-white">
                    {getCategoryName(category, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{tc('account')}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BEPA. {t('allRightsReserved')}</p>
          <div className="flex items-center gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
