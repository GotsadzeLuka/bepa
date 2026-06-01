'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronDown, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getCategoryName, type StoreCategory } from '@/lib/catalog'

interface ProductFiltersProps {
  categories: StoreCategory[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentCategory = searchParams.get('category') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentSearch = searchParams.get('search') || ''
  const saleOnly = searchParams.get('sale') === 'true'
  const featuredOnly = searchParams.get('featured') === 'true'
  const activeCategory = categories.find((category) => category.slug === currentCategory)
  const hasActiveFilters = Boolean(currentCategory || saleOnly || featuredOnly || currentSearch)

  const navigateTo = useCallback((url: string) => {
    startTransition(() => {
      router.push(url, { scroll: false })
    })
    setMobileOpen(false)
  }, [router])

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    params.delete('page')

    const query = params.toString()
    navigateTo(query ? `${pathname}?${query}` : pathname)
  }, [navigateTo, pathname, searchParams])

  const clearFilters = useCallback(() => {
    navigateTo(pathname)
  }, [navigateTo, pathname])

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; clear: () => void }> = []

    if (activeCategory) {
      filters.push({
        key: 'category',
        label: getCategoryName(activeCategory, locale),
        clear: () => updateFilter('category', ''),
      })
    }

    if (currentSearch) {
      filters.push({
        key: 'search',
        label: currentSearch,
        clear: () => updateFilter('search', ''),
      })
    }

    if (saleOnly) {
      filters.push({
        key: 'sale',
        label: t('sale'),
        clear: () => updateFilter('sale', ''),
      })
    }

    if (featuredOnly) {
      filters.push({
        key: 'featured',
        label: t('featured'),
        clear: () => updateFilter('featured', ''),
      })
    }

    return filters
  }, [activeCategory, currentSearch, featuredOnly, locale, saleOnly, t, updateFilter])

  const filterContent = (
    <div className="space-y-6" aria-busy={isPending}>
      <div className="h-1 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={`h-full rounded-full bg-primary transition-all duration-300 ${isPending ? 'w-full opacity-100' : 'w-0 opacity-0'}`}
        />
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={filter.clear}
              disabled={isPending}
            >
              <span className="max-w-36 truncate">{filter.label}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm">
        <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('categories')}</h3>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-2">
              <Button
                variant={!currentCategory ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start rounded-full"
                aria-pressed={!currentCategory}
                disabled={isPending}
                onClick={() => updateFilter('category', '')}
              >
                {t('allCategories')}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={currentCategory === category.slug ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start rounded-full"
                  aria-pressed={currentCategory === category.slug}
                  disabled={isPending}
                  onClick={() => updateFilter('category', category.slug)}
                >
                  {getCategoryName(category, locale)}
                </Button>
            ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t('filters')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={saleOnly ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            aria-pressed={saleOnly}
            disabled={isPending}
            onClick={() => updateFilter('sale', saleOnly ? '' : 'true')}
          >
            {t('sale')}
          </Button>
          <Button
            type="button"
            variant={featuredOnly ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            aria-pressed={featuredOnly}
            disabled={isPending}
            onClick={() => updateFilter('featured', featuredOnly ? '' : 'true')}
          >
            {t('featured')}
          </Button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm">
        <Label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('sortBy')}</Label>
        <Select value={currentSort} onValueChange={(value) => updateFilter('sort', value)} disabled={isPending}>
          <SelectTrigger className="h-11 rounded-full border-slate-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('newestFirst')}</SelectItem>
            <SelectItem value="price-asc">{t('priceLowToHigh')}</SelectItem>
            <SelectItem value="price-desc">{t('priceHighToLow')}</SelectItem>
            <SelectItem value="name">{t('nameAZ')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" className="w-full rounded-full" onClick={clearFilters} disabled={isPending}>
          <X className="mr-2 h-4 w-4" />
          {t('clearFilters')}
        </Button>
      )}
    </div>
  )

  return (
    <>
      <div className="mb-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full rounded-full bg-white shadow-sm">
              <Filter className="h-4 w-4" />
              {t('filters')}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] bg-[#f6f3ee]">
            <SheetHeader>
              <SheetTitle>{t('filters')}</SheetTitle>
            </SheetHeader>
            <Separator className="my-5" />
            {filterContent}
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">{filterContent}</div>
    </>
  )
}
