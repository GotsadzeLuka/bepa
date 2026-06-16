'use client'

import type { LucideIcon } from 'lucide-react'
import {
  BatteryCharging,
  Disc3,
  Droplets,
  Gauge,
  ShieldCheck,
  Wind,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryMedia } from '@/lib/storefront-media'
import { SafeImage } from '@/components/ui/SafeImage'

type ArtworkTheme = {
  chip: string
  gradient: string
  icon: LucideIcon
  surface: string
}

const themes: Record<string, ArtworkTheme> = {
  lighting: {
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    gradient: 'from-amber-50 via-white to-slate-100',
    icon: Zap,
    surface: 'bg-amber-50/70',
  },
  batteries: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    gradient: 'from-emerald-50 via-white to-slate-100',
    icon: BatteryCharging,
    surface: 'bg-emerald-50/70',
  },
  brakes: {
    chip: 'border-rose-200 bg-rose-50 text-rose-700',
    gradient: 'from-rose-50 via-white to-slate-100',
    icon: Disc3,
    surface: 'bg-rose-50/70',
  },
  filters: {
    chip: 'border-sky-200 bg-sky-50 text-sky-700',
    gradient: 'from-sky-50 via-white to-slate-100',
    icon: Wind,
    surface: 'bg-sky-50/70',
  },
  'oils-fluids': {
    chip: 'border-orange-200 bg-orange-50 text-orange-700',
    gradient: 'from-orange-50 via-white to-slate-100',
    icon: Droplets,
    surface: 'bg-orange-50/70',
  },
  accessories: {
    chip: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    gradient: 'from-indigo-50 via-white to-slate-100',
    icon: Gauge,
    surface: 'bg-indigo-50/70',
  },
  default: {
    chip: 'border-slate-200 bg-white text-slate-700',
    gradient: 'from-slate-50 via-white to-slate-100',
    icon: ShieldCheck,
    surface: 'bg-slate-50',
  },
}

interface ProductArtworkProps {
  title: string
  category: string
  compact?: boolean
  subtitle?: string | null
  tone?: string | null
  imageSrc?: string | null
  imageAlt?: string
  objectPosition?: string
}

export function ProductArtwork({
  title,
  category,
  compact = false,
  subtitle,
  tone,
  imageSrc,
  imageAlt,
  objectPosition,
}: ProductArtworkProps) {
  const theme = themes[tone ?? ''] ?? themes.default
  const Icon = theme.icon
  const fallbackMedia = getCategoryMedia(tone)
  const mediaSrc = imageSrc ?? fallbackMedia.src
  const mediaAlt = imageAlt ?? fallbackMedia.alt
  const mediaPosition = objectPosition ?? fallbackMedia.objectPosition ?? 'center'

  return (
    <div className={cn('relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <span className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]', theme.chip)}>
          {category}
        </span>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white/82 text-slate-950 shadow-sm', theme.surface)}>
          <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
        </div>
      </div>

      <div className="relative min-h-0 flex-1 px-5 py-4">
        <div className="relative h-full min-h-[9rem] overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_22px_70px_-48px_rgba(15,23,42,0.5)]">
          {mediaSrc ? (
            <SafeImage
              src={mediaSrc}
              alt={mediaAlt}
              fill
              className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.03]"
              style={{ objectPosition: mediaPosition }}
              sizes={compact ? '(max-width: 768px) 100vw, 34vw' : '(max-width: 1024px) 100vw, 52vw'}
            />
          ) : (
            <div className={cn('flex h-full w-full items-center justify-center', theme.surface)}>
              <Icon className="h-16 w-16 text-slate-300" />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/80 bg-white/86 p-5 backdrop-blur">
        <p className={cn('font-black tracking-tight text-slate-950 text-balance', compact ? 'text-xl' : 'text-2xl sm:text-3xl')}>
          {title}
        </p>
        {subtitle && (
          <p className={cn('mt-2 max-w-[34rem] text-slate-600', compact ? 'line-clamp-2 text-xs leading-5' : 'line-clamp-2 text-sm leading-6')}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
