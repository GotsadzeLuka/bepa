import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react'
import { newsService } from '@/lib/services'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getNewsItem(slug: string) {
  return newsService.getNewsBySlug(slug)
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params
  const news = await getNewsItem(slug)

  if (!news) {
    notFound()
  }

  return (
    <div className="container py-8">
      {/* Back Link */}
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to News
      </Link>

      <article className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            <time dateTime={news.createdAt.toISOString()}>
              {news.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
          <h1 className="text-4xl font-bold mb-4">{news.title}</h1>
          {news.excerpt && (
            <p className="text-xl text-muted-foreground">{news.excerpt}</p>
          )}
        </header>

        {/* Featured Image */}
        {news.imageUrl ? (
          <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
            <Image
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="aspect-video bg-zinc-100 rounded-lg flex items-center justify-center mb-8">
            <Newspaper className="h-16 w-16 text-zinc-300" />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {news.content ? (
            news.content.split('\n').map((paragraph, index) => (
              <p key={`${index}-${paragraph}`}>{paragraph}</p>
            ))
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}
        </div>
      </article>
    </div>
  )
}
