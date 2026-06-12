'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCategoriesAdmin, createCategory, updateCategory, deleteCategory, uploadAdminImage } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, ImageIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminTableSkeleton } from '@/components/admin/TableSkeleton'
import type { Category } from '@/types/database'
import { getSafeImageSrc } from '@/lib/storefront-media'
import { SafeImage } from '@/components/ui/SafeImage'
import { useTranslations } from 'next-intl'

export default function CategoriesPage() {
  const t = useTranslations('admin.categories')
  const common = useTranslations('admin.common')
  const confirm = useTranslations('admin.confirm')
  const toastText = useTranslations('admin.toast')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    nameEn: '',
    nameKa: '',
    slug: '',
    imageUrl: '',
    descriptionEn: '',
    descriptionKa: '',
    isActive: true,
    sortOrder: 0,
  })

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategoriesAdmin()
      setCategories(data as unknown as Category[])
    } catch {
      toast.error(toastText('fetchCategoriesFailed'))
    }
    setLoading(false)
  }, [toastText])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      nameEn: value,
      slug: editingCategory ? prev.slug : generateSlug(value),
    }))
  }

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameKa: '',
      slug: '',
      imageUrl: '',
      descriptionEn: '',
      descriptionKa: '',
      isActive: true,
      sortOrder: 0,
    })
    setEditingCategory(null)
    setImageFile(null)
    setImageInputKey((key) => key + 1)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      nameEn: category.name_en,
      nameKa: category.name_ka,
      slug: category.slug,
      imageUrl: category.image_url || '',
      descriptionEn: category.description_en || '',
      descriptionKa: category.description_ka || '',
      isActive: category.is_active,
      sortOrder: category.sort_order,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      let imageUrl = formData.imageUrl.trim() || null

      if (imageFile) {
        const uploaded = await uploadAdminImage('categories', imageFile)
        imageUrl = uploaded.publicUrl
      }

      const categoryData = {
        ...formData,
        imageUrl: imageUrl || null,
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData)
        toast.success(toastText('categoryUpdated'))
      } else {
        await createCategory(categoryData)
        toast.success(toastText('categoryCreated'))
      }

      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : toastText('genericError'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      await deleteCategory(deleteTarget.id)
      toast.success(toastText('categoryDeleted'))
      setDeleteTarget(null)
      fetchCategories()
    } catch {
      toast.error(toastText('deleteCategoryFailed'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-zinc-400 mt-1">{t('subtitle')}</p>
        </div>
        <AdminTableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-zinc-400 mt-1">{t('subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCategory ? t('edit') : t('add')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-200">{common('nameEn')}</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={handleNameChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-200">{common('nameKa')}</Label>
                  <Input
                    value={formData.nameKa}
                    onChange={(e) => setFormData({ ...formData, nameKa: e.target.value })}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-200">{common('slug')}</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-200">{t('sortOrder')}</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">{common('descriptionEn')}</Label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">{common('descriptionKa')}</Label>
                <Textarea
                  value={formData.descriptionKa}
                  onChange={(e) => setFormData({ ...formData, descriptionKa: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">{common('image')}</Label>
                <div className="flex items-start gap-4">
                  {getSafeImageSrc(formData.imageUrl) && !imageFile && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-zinc-800">
                      <SafeImage
                        src={getSafeImageSrc(formData.imageUrl) ?? ''}
                        alt={formData.nameEn || 'Category image'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <Input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value })
                        if (e.target.value.trim()) {
                          setImageFile(null)
                          setImageInputKey((key) => key + 1)
                        }
                      }}
                      placeholder={t('imageUrlPlaceholder')}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                    <Input
                      key={imageInputKey}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    {imageFile && (
                      <p className="text-sm text-zinc-400">{common('selected', { name: imageFile.name })}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="text-zinc-200">{common('active')}</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                  className="border-zinc-700 text-zinc-300"
                >
                  {common('cancel')}
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCategory ? common('update') : common('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">{common('image')}</TableHead>
              <TableHead className="text-zinc-400">{common('nameEn')}</TableHead>
              <TableHead className="text-zinc-400">{common('nameKa')}</TableHead>
              <TableHead className="text-zinc-400">{common('slug')}</TableHead>
              <TableHead className="text-zinc-400">{common('status')}</TableHead>
              <TableHead className="text-zinc-400">{common('order')}</TableHead>
              <TableHead className="text-zinc-400 text-right">{common('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-400">
                  {t('noCategories')}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell>
                    {getSafeImageSrc(category.image_url) ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-zinc-800">
                        <SafeImage
                          src={getSafeImageSrc(category.image_url) ?? ''}
                          alt={category.name_en}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-zinc-600" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-white font-medium">{category.name_en}</TableCell>
                  <TableCell className="text-zinc-300">{category.name_ka}</TableCell>
                  <TableCell className="text-zinc-400">{category.slug}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        category.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {category.is_active ? common('active') : common('inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-400">{category.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                        className="text-zinc-400 hover:text-white"
                        aria-label={t('editLabel', { name: category.name_en })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(category)}
                        className="text-zinc-400 hover:text-red-400"
                        aria-label={t('deleteLabel', { name: category.name_en })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={confirm('deleteCategoryTitle')}
        description={confirm('deleteCategoryDescription', { name: deleteTarget?.name_en ?? '' })}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
