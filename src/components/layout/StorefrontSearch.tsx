'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useId, useMemo, useRef, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, Loader2, Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SafeImage } from '@/components/ui/SafeImage'
import { cn } from '@/lib/utils'

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 260

type SearchPreviewResult = {
  id: string
  slug: string
  nameEn: string
  nameKa: string
  categoryEn: string
  categoryKa: string
  price: number
  stock: number
  image: string | null
  imageAlt: string
  imagePosition: string
}

type SearchPreviewResponse = {
  query: string
  total: number
  results: SearchPreviewResult[]
}

interface StorefrontSearchProps {
  autoFocus?: boolean
  className?: string
  onNavigate?: () => void
  variant?: 'desktop' | 'mobile'
}

export function StorefrontSearch({
  autoFocus,
  className,
  onNavigate,
  variant = 'desktop',
}: StorefrontSearchProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get('search') ?? ''
  const inputId = useId()
  const [query, setQuery] = useState(currentSearch)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchPreviewResult[]>([])
  const [total, setTotal] = useState(0)
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle')
  const [panelOpen, setPanelOpen] = useState(false)
  const [isRouting, startRouting] = useTransition()
  const latestRequest = useRef(0)

  const trimmedQuery = query.trim()
  const canSearch = trimmedQuery.length >= MIN_QUERY_LENGTH
  const waitingForDebounce = canSearch && trimmedQuery !== debouncedQuery
  const isWorking = isRouting || previewState === 'loading' || waitingForDebounce
  const showPanel = panelOpen && trimmedQuery.length > 0

  const statusText = useMemo(() => {
    if (isRouting) return t('openingResults')
    if (trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH) return t('searchTypeMore')
    if (waitingForDebounce) return t('searchPreparing')
    if (previewState === 'loading') return t('searchingProducts')
    if (previewState === 'error') return t('searchPreviewError')
    if (previewState === 'empty') return t('searchNoPreview')
    if (previewState === 'success') return t('searchPreviewReady', { count: total })
    return ''
  }, [isRouting, previewState, t, total, trimmedQuery.length, waitingForDebounce])

  useEffect(() => {
    setQuery(currentSearch)
  }, [currentSearch])

  useEffect(() => {
    if (!canSearch) {
      setDebouncedQuery('')
      setResults([])
      setTotal(0)
      setPreviewState('idle')
      return
    }

    const handle = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(handle)
  }, [canSearch, trimmedQuery])

  useEffect(() => {
    if (!debouncedQuery) return

    const controller = new AbortController()
    const requestId = latestRequest.current + 1
    latestRequest.current = requestId

    setPreviewState('loading')

    async function loadPreview() {
      try {
        const response = await fetch(`/api/search/products?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Search preview failed')
        }

        const data = (await response.json()) as SearchPreviewResponse

        if (requestId !== latestRequest.current) return

        setResults(data.results)
        setTotal(data.total)
        setPreviewState(data.results.length > 0 ? 'success' : 'empty')
      } catch {
        if (controller.signal.aborted) return
        if (requestId !== latestRequest.current) return

        setResults([])
        setTotal(0)
        setPreviewState('error')
      }
    }

    loadPreview()

    return () => controller.abort()
  }, [debouncedQuery])

  const navigateToSearch = (value = trimmedQuery) => {
    const nextQuery = value.trim()
    if (nextQuery.length === 0) return

    const params = new URLSearchParams()
    params.set('search', nextQuery)

    startRouting(() => {
      router.push(`/products?${params.toString()}`)
    })

    setPanelOpen(false)
    onNavigate?.()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateToSearch()
  }

  const handleClear = () => {
    setQuery('')
    setDebouncedQuery('')
    setResults([])
    setTotal(0)
    setPreviewState('idle')
  }

  const previewPanel = showPanel ? (
    <div
      className={cn(
        'z-[70] overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/96 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.58)] backdrop-blur-xl',
        variant === 'desktop' ? 'absolute left-0 right-0 top-[calc(100%+0.6rem)]' : 'relative mt-2'
      )}
      role="region"
      aria-label={t('search')}
    >
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <p className="min-w-0 truncate text-xs font-semibold text-slate-600" role="status" aria-live="polite">
          {statusText}
        </p>
        {isWorking && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
      </div>

      {trimmedQuery.length < MIN_QUERY_LENGTH || waitingForDebounce || previewState === 'loading' ? (
        <SearchPreviewSkeleton />
      ) : previewState === 'error' ? (
        <div className="px-4 py-5 text-sm leading-6 text-slate-500">{t('searchPreviewErrorCopy')}</div>
      ) : previewState === 'empty' ? (
        <div className="px-4 py-5">
          <p className="text-sm font-semibold text-slate-900">{t('searchNoPreview')}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{t('searchNoPreviewCopy')}</p>
        </div>
      ) : (
        <div className="py-2">
          {results.map((result) => {
            const name = locale === 'ka' ? result.nameKa : result.nameEn
            const category = locale === 'ka' ? result.categoryKa : result.categoryEn

            return (
              <Link
                key={result.id}
                href={`/product/${result.slug}`}
                className="flex min-h-20 items-center gap-3 px-3 py-2 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                onClick={() => {
                  setPanelOpen(false)
                  onNavigate?.()
                }}
              >
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {result.image ? (
                    <SafeImage
                      src={result.image}
                      alt={result.imageAlt || name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: result.imagePosition }}
                      sizes="56px"
                    />
                  ) : (
                    <Search className="h-5 w-5 text-slate-300" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-bold text-slate-950">{name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    {category && <span className="max-w-32 truncate">{category}</span>}
                    <span className="font-semibold text-slate-800">₾{result.price}</span>
                    <span>{result.stock > 0 ? t('inStock') : t('outOfStock')}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            )
          })}

          <button
            type="button"
            className="mt-1 flex w-full items-center justify-between border-t border-slate-100 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            onClick={() => navigateToSearch()}
          >
            <span>{t('viewSearchResults')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  ) : null

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative w-full', className)}
      onFocus={() => setPanelOpen(true)}
      onBlur={(event) => {
        const nextFocus = event.relatedTarget

        if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
          setPanelOpen(false)
        }
      }}
      aria-busy={isWorking}
    >
      <div className="relative">
        {isWorking ? (
          <Loader2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        ) : (
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <label htmlFor={inputId} className="sr-only">
          {t('search')}
        </label>
        <Input
          id={inputId}
          type="search"
          placeholder={t('searchPlaceholder')}
          className={cn(
            'h-12 rounded-full border-white/70 bg-white/88 pl-11 pr-20 shadow-sm transition-[border-color,box-shadow,background-color]',
            'focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20',
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
            variant === 'mobile' && 'h-11 border-transparent bg-white shadow-none'
          )}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPanelOpen(true)
          }}
          autoComplete="off"
          autoFocus={autoFocus}
          aria-describedby={statusText ? `${inputId}-status` : undefined}
        />
        <span id={`${inputId}-status`} className="sr-only" aria-live="polite">
          {statusText}
        </span>
        {query && (
          <button
            type="button"
            className="absolute right-12 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            onClick={handleClear}
            aria-label={t('clearSearch')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Button
          type="submit"
          size="icon-sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          disabled={trimmedQuery.length === 0 || isRouting}
          aria-label={t('viewSearchResults')}
        >
          {isRouting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {previewPanel}
    </form>
  )
}

function SearchPreviewSkeleton() {
  return (
    <div className="space-y-2 px-3 py-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
