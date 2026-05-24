'use client'

import { useState } from 'react'
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

  const currentCategory = searchParams.get('category') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const saleOnly = searchParams.get('sale') === 'true'
  const featuredOnly = searchParams.get('featured') === 'true'
  const hasActiveFilters = Boolean(currentCategory || saleOnly || featuredOnly || searchParams.get('search'))

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    params.delete('page')

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const filterContent = (
    <div className="space-y-6">
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
            onClick={() => updateFilter('featured', featuredOnly ? '' : 'true')}
          >
            {t('featured')}
          </Button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm">
        <Label className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('sortBy')}</Label>
        <Select value={currentSort} onValueChange={(value) => updateFilter('sort', value)}>
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
        <Button variant="outline" size="sm" className="w-full rounded-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          {t('clearFilters')}
        </Button>
      )}
    </div>
  )

  return (
    <>
      <div className="mb-4 lg:hidden">
        <Sheet>
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
