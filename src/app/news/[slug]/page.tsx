import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react'
import { newsService } from '@/lib/services'
import { getSafeImageSrc } from '@/lib/storefront-media'
import { SafeImage } from '@/components/ui/SafeImage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

async function getNewsItem(slug: string) {
  return newsService.getNewsBySlug(slug)
}

// Served from the same unstable_cache entry as the page body, so this adds
// no extra database query.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const news = await getNewsItem(slug)

  if (!news) {
    notFound()
  }

  const title = `${news.title} | BEPA`
  const description = news.excerpt?.slice(0, 160) ?? undefined
  const image = getSafeImageSrc(news.imageUrl)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params
  const news = await getNewsItem(slug)

  if (!news) {
    notFound()
  }
  const imageUrl = getSafeImageSrc(news.imageUrl)
  // unstable_cache round-trips through JSON, so createdAt can arrive as a
  // string on warm cache hits.
  const createdAt = new Date(news.createdAt)

  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <Link
        href="/news"
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/76 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to News
      </Link>

      <article className="mx-auto max-w-4xl">
        <header className="mb-8 overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/86 p-6 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Calendar className="h-4 w-4" />
            <time dateTime={createdAt.toISOString()}>
              {createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 text-balance sm:text-4xl lg:text-5xl">
            {news.title}
          </h1>
          {news.excerpt && (
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{news.excerpt}</p>
          )}
        </header>

        {imageUrl ? (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-[2rem] border border-white/70 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)]">
            <SafeImage
              src={imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="mb-8 flex aspect-video items-center justify-center rounded-[2rem] border border-white/70 bg-slate-950 text-white/25 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)]">
            <Newspaper className="h-16 w-16" />
          </div>
        )}

        <div className="rounded-[2rem] border border-white/70 bg-white/88 p-6 text-slate-700 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8">
          {news.content ? (
            news.content.split('\n').map((paragraph, index) => (
              <p key={`${index}-${paragraph}`} className="mb-5 text-base leading-8 last:mb-0">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm leading-7 text-slate-500">No content available.</p>
          )}
        </div>
      </article>
    </div>
  )
}
