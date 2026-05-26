'use client'

import Image from 'next/image'
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

type ArtworkTheme = {
  chip: string
  glow: string
  gradient: string
  icon: LucideIcon
  ring: string
}

const themes: Record<string, ArtworkTheme> = {
  lighting: {
    chip: 'border-white/20 bg-white/10 text-amber-50',
    glow: 'bg-amber-300/35',
    gradient: 'from-slate-950 via-slate-900 to-amber-700',
    icon: Zap,
    ring: 'from-amber-300/30 via-transparent to-transparent',
  },
  batteries: {
    chip: 'border-white/20 bg-white/10 text-emerald-50',
    glow: 'bg-emerald-300/30',
    gradient: 'from-slate-950 via-emerald-950 to-emerald-700',
    icon: BatteryCharging,
    ring: 'from-emerald-300/25 via-transparent to-transparent',
  },
  brakes: {
    chip: 'border-white/20 bg-white/10 text-rose-50',
    glow: 'bg-rose-300/35',
    gradient: 'from-slate-950 via-rose-950 to-red-700',
    icon: Disc3,
    ring: 'from-rose-300/30 via-transparent to-transparent',
  },
  filters: {
    chip: 'border-white/20 bg-white/10 text-sky-50',
    glow: 'bg-sky-300/30',
    gradient: 'from-slate-950 via-cyan-950 to-sky-700',
    icon: Wind,
    ring: 'from-sky-300/30 via-transparent to-transparent',
  },
  'oils-fluids': {
    chip: 'border-white/20 bg-white/10 text-orange-50',
    glow: 'bg-orange-300/30',
    gradient: 'from-slate-950 via-orange-950 to-amber-700',
    icon: Droplets,
    ring: 'from-orange-300/30 via-transparent to-transparent',
  },
  accessories: {
    chip: 'border-white/20 bg-white/10 text-indigo-50',
    glow: 'bg-indigo-300/30',
    gradient: 'from-slate-950 via-indigo-950 to-indigo-700',
    icon: Gauge,
    ring: 'from-indigo-300/30 via-transparent to-transparent',
  },
  default: {
    chip: 'border-white/20 bg-white/10 text-white',
    glow: 'bg-white/20',
    gradient: 'from-slate-950 via-slate-900 to-slate-700',
    icon: ShieldCheck,
    ring: 'from-white/20 via-transparent to-transparent',
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
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {mediaSrc ? (
          <Image
            src={mediaSrc}
            alt={mediaAlt}
            fill
            className="animate-pan object-cover"
            style={{ objectPosition: mediaPosition }}
            sizes={compact ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 1024px) 100vw, 60vw'}
          />
        ) : (
          <div className={cn('h-full w-full bg-gradient-to-br', theme.gradient)} />
        )}
      </div>
      <div className={cn('absolute inset-0 bg-gradient-to-br mix-blend-multiply', theme.gradient)} />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(15,23,42,0.08),rgba(15,23,42,0.84)),radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.24),transparent_30%),radial-gradient(circle_at_82%_80%,rgba(255,255,255,0.14),transparent_34%)]" />
      <div className={cn('absolute -left-14 top-6 h-32 w-32 rounded-full blur-3xl', theme.glow)} />
      <div className="absolute -right-16 bottom-0 h-44 w-44 rounded-full border border-white/12 bg-white/6 backdrop-blur-md" />
      <div className={cn('absolute inset-0 bg-gradient-to-tr opacity-80', theme.ring)} />
      <div className="absolute inset-x-5 top-5 flex items-center justify-between">
        <span className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] backdrop-blur-md', theme.chip)}>
          {category}
        </span>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/14 bg-white/10 text-white shadow-lg backdrop-blur-md">
          <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
        </div>
      </div>
      <div className="absolute inset-x-5 bottom-5">
        <div className="rounded-[1.75rem] border border-white/12 bg-black/18 p-4 shadow-2xl backdrop-blur-md">
          <p className={cn('max-w-[15rem] font-black tracking-tight text-white text-balance', compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl')}>
            {title}
          </p>
          {subtitle && (
            <p className={cn('mt-2 max-w-[22rem] text-white/74', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
