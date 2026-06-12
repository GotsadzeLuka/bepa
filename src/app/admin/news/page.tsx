'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Newspaper, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminTableSkeleton } from '@/components/admin/TableSkeleton'
import { createNews, deleteNews, getNewsAdmin, updateNews, uploadAdminImage } from '@/app/admin/actions'
import { getSafeImageSrc } from '@/lib/storefront-media'
import { optimizeImageFile } from '@/lib/optimize-image'
import { SafeImage } from '@/components/ui/SafeImage'
import { toast } from 'sonner'
import { useLocale, useTranslations } from 'next-intl'

interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  is_published: boolean
  created_at: string
}

export default function AdminNewsPage() {
  const t = useTranslations('admin.news')
  const common = useTranslations('admin.common')
  const confirm = useTranslations('admin.confirm')
  const toastText = useTranslations('admin.toast')
  const locale = useLocale()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: '',
    is_published: true,
  })

  const fetchNews = useCallback(async () => {
    try {
      const data = await getNewsAdmin()
      setNews((data as unknown as NewsItem[]) || [])
    } catch (error) {
      toast.error(toastText('loadNewsFailed'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [toastText])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData({
      ...formData,
      title,
      slug: editingNews ? formData.slug : generateSlug(title),
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.slug) {
      toast.error(toastText('titleSlugRequired'))
      return
    }

    setSaving(true)

    try {
      let imageUrl = formData.image_url || null
      if (imageFile) {
        const uploaded = await uploadAdminImage('news', await optimizeImageFile(imageFile))
        imageUrl = uploaded.publicUrl
      }

      if (editingNews) {
        await updateNews(editingNews.id, {
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt || null,
          content: formData.content || null,
          imageUrl,
          isPublished: formData.is_published,
        })
        toast.success(toastText('newsUpdated'))
      } else {
        await createNews({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt || null,
          content: formData.content || null,
          imageUrl,
          isPublished: formData.is_published,
        })
        toast.success(toastText('newsCreated'))
      }

      setDialogOpen(false)
      resetForm()
      fetchNews()
    } catch (error) {
      console.error('Error saving news:', error)
      toast.error(error instanceof Error ? error.message : toastText('genericError'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item)
    setFormData({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt || '',
      content: item.content || '',
      image_url: item.image_url || '',
      is_published: item.is_published,
    })
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      await deleteNews(deleteTarget.id)
      toast.success(toastText('newsDeleted'))
      setDeleteTarget(null)
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      toast.error(toastText('deleteNewsFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setEditingNews(null)
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image_url: '',
      is_published: true,
    })
    setImageFile(null)
    setImageInputKey((key) => key + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-zinc-400">{t('subtitle')}</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (saving) return
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-zinc-800 bg-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingNews ? t('edit') : t('add')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-200">{t('titleField')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-zinc-200">{t('slugField')}</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-zinc-200">{t('excerpt')}</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={2}
                  placeholder={t('excerptPlaceholder')}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-zinc-200">{t('content')}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={8}
                  placeholder={t('contentPlaceholder')}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">{common('image')}</Label>
                <div className="flex gap-4">
                  {getSafeImageSrc(formData.image_url) && (
                    <div className="relative h-32 w-48 overflow-hidden rounded-lg bg-zinc-800">
                      <SafeImage
                        src={getSafeImageSrc(formData.image_url) ?? ''}
                        alt={common('image')}
                        fill
                        sizes="192px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value })
                        if (e.target.value.trim()) {
                          setImageFile(null)
                          setImageInputKey((key) => key + 1)
                        }
                      }}
                      placeholder={t('imageUrlPlaceholder')}
                      className="mb-3 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                    />
                    <Input
                      key={imageInputKey}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                      className="border-zinc-700 bg-zinc-800 text-white"
                    />
                    {imageFile && (
                      <p className="mt-1 text-sm text-zinc-400">
                        {common('selected', { name: imageFile.name })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label htmlFor="is_published" className="text-zinc-200">{t('published')}</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300"
                  disabled={saving}
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                >
                  {common('cancel')}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingNews ? common('update') : common('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={5} />
      ) : news.length === 0 ? (
        <div className="rounded-lg bg-zinc-900/50 py-12 text-center">
          <Newspaper className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="mb-2 text-lg font-medium text-white">{t('noNews')}</h3>
          <p className="mb-4 text-zinc-400">{t('emptyCopy')}</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add')}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">{common('image')}</TableHead>
                <TableHead className="text-zinc-400">{t('titleField').replace(' *', '')}</TableHead>
                <TableHead className="text-zinc-400">{common('status')}</TableHead>
                <TableHead className="text-zinc-400">{common('date')}</TableHead>
                <TableHead className="text-right text-zinc-400">{common('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((item) => (
                <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell>
                    <div className="relative h-12 w-16 overflow-hidden rounded bg-zinc-800">
                      {getSafeImageSrc(item.image_url) ? (
                        <SafeImage
                          src={getSafeImageSrc(item.image_url) ?? ''}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Newspaper className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm text-zinc-400">/{item.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        item.is_published
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-zinc-700/60 text-zinc-300'
                      }`}
                    >
                      {item.is_published ? common('published') : common('draft')}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {new Date(item.created_at).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        aria-label={t('openLabel', { title: item.title })}
                        onClick={() => window.open(`/news/${item.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        aria-label={t('editLabel', { title: item.title })}
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-red-400"
                        aria-label={t('deleteLabel', { title: item.title })}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={confirm('deleteNewsTitle')}
        description={confirm('deleteNewsDescription', { title: deleteTarget?.title ?? '' })}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
