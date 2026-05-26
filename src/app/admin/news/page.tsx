'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Newspaper, ExternalLink } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { createNews, deleteNews, getNewsAdmin, updateNews, uploadAdminImage } from '@/app/admin/actions'
import { getSafeImageSrc } from '@/lib/storefront-media'
import { toast } from 'sonner'

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
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
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
      toast.error('Failed to load news')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

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
      toast.error('Title and slug are required')
      return
    }

    try {
      let imageUrl = formData.image_url || null
      if (imageFile) {
        const uploaded = await uploadAdminImage('news', imageFile)
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
        toast.success('News updated')
      } else {
        await createNews({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt || null,
          content: formData.content || null,
          imageUrl,
          isPublished: formData.is_published,
        })
        toast.success('News created')
      }

      setDialogOpen(false)
      resetForm()
      fetchNews()
    } catch (error) {
      console.error('Error saving news:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save news')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return

    try {
      await deleteNews(id)
      toast.success('News deleted')
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      toast.error('Failed to delete news')
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
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">News</h1>
          <p className="text-muted-foreground">
            Manage news and blog posts
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add News
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNews ? 'Edit News' : 'Add News'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={2}
                  placeholder="Short summary..."
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={8}
                  placeholder="Full article content..."
                />
              </div>

              <div>
                <Label>Image</Label>
                <div className="mt-2 flex gap-4">
                  {getSafeImageSrc(formData.image_url) && (
                    <div className="relative h-32 w-48 rounded-lg overflow-hidden">
                      <Image
                        src={getSafeImageSrc(formData.image_url) ?? ''}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                    />
                    {imageFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {imageFile.name}
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
                <Label htmlFor="is_published">Published</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNews ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-200 rounded" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-lg">
          <Newspaper className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No news yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first news article
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add News
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="relative h-12 w-16 rounded overflow-hidden bg-zinc-100">
                      {getSafeImageSrc(item.image_url) ? (
                        <Image
                          src={getSafeImageSrc(item.image_url) ?? ''}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Newspaper className="h-5 w-5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        /{item.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.is_published ? 'default' : 'secondary'}
                    >
                      {item.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/news/${item.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(item.id)}
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
    </div>
  )
}
