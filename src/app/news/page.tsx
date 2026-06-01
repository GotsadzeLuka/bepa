import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, Newspaper } from 'lucide-react'
import type { News } from '@prisma/client'
import { newsService } from '@/lib/services'
import { getSafeImageSrc } from '@/lib/storefront-media'

export const revalidate = 300

function NewsGrid({ news }: { news: News[] }) {
  if (news.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Newspaper className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">No News Yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
          Check back soon for product announcements, automotive tips, and service updates.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {news.map((item) => {
        const imageUrl = getSafeImageSrc(item.imageUrl)
        return (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/86 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-video">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white/25">
                  <Newspaper className="h-12 w-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(15,23,42,0.5)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                <Calendar className="h-4 w-4" />
                <time dateTime={item.createdAt.toISOString()}>
                  {item.createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <h2 className="line-clamp-2 font-display text-xl font-black tracking-tight text-slate-950 transition-colors group-hover:text-primary">
                {item.title}
              </h2>
              {item.excerpt && (
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500">{item.excerpt}</p>
              )}
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                Read update
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video rounded-t-[1.75rem] bg-white/70" />
          <div className="space-y-3 rounded-b-[1.75rem] bg-white/70 p-5">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-6 w-full rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function NewsPage() {
  const news = await newsService.getPublishedNews()

  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <section className="mb-8 overflow-hidden rounded-[2.25rem] border border-white/70 bg-[linear-gradient(135deg,#fff8ef_0%,#f7f0e7_48%,#f8f5ef_100%)] p-6 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">BEPA journal</p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          News & Updates
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Stay up to date with the latest news, product announcements, and automotive tips.
        </p>
      </section>

      <Suspense fallback={<LoadingSkeleton />}>
        <NewsGrid news={news} />
      </Suspense>
    </div>
  )
}
