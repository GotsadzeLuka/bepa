import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Newspaper, Calendar } from 'lucide-react'
import type { News } from '@prisma/client'
import { newsService } from '@/lib/services'

function NewsGrid({ news }: { news: News[] }) {
  if (news.length === 0) {
    return (
      <div className="text-center py-16">
        <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No News Yet</h2>
        <p className="text-muted-foreground">
          Check back soon for updates and announcements.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map((item) => (
        <Link
          key={item.id}
          href={`/news/${item.slug}`}
          className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Image */}
          <div className="relative aspect-video">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full bg-zinc-100 flex items-center justify-center">
                <Newspaper className="h-12 w-12 text-zinc-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Calendar className="h-4 w-4" />
              <time dateTime={item.createdAt.toISOString()}>
                {item.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </h2>
            {item.excerpt && (
              <p className="text-muted-foreground line-clamp-3">{item.excerpt}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-zinc-200 rounded-t-lg" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-32 bg-zinc-200 rounded" />
            <div className="h-6 w-full bg-zinc-200 rounded" />
            <div className="h-4 w-3/4 bg-zinc-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function NewsPage() {
  const news = await newsService.getPublishedNews()

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">News & Updates</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stay up to date with the latest news, product announcements, and automotive tips.
        </p>
      </div>

      {/* News Grid */}
      <Suspense fallback={<LoadingSkeleton />}>
        <NewsGrid news={news} />
      </Suspense>
    </div>
  )
}
