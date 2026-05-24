'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCategoriesAdmin, createCategory, updateCategory, deleteCategory } from '@/app/admin/actions'
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
import type { Category } from '@/types/database'
import Image from 'next/image'

export default function CategoriesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    nameEn: '',
    nameKa: '',
    slug: '',
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
      toast.error('Failed to fetch categories')
    }
    setLoading(false)
  }, [])

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
      descriptionEn: '',
      descriptionKa: '',
      isActive: true,
      sortOrder: 0,
    })
    setEditingCategory(null)
    setImageFile(null)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      nameEn: category.name_en,
      nameKa: category.name_ka,
      slug: category.slug,
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
      let imageUrl = editingCategory?.image_url || null

      // Upload image if selected (using Supabase storage on client)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${formData.slug}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('categories')
          .upload(fileName, imageFile)

        if (uploadError) {
          toast.error('Failed to upload image')
          setFormLoading(false)
          return
        }

        const { data: urlData } = supabase.storage
          .from('categories')
          .getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      }

      const categoryData = {
        ...formData,
        imageUrl: imageUrl || undefined,
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData)
        toast.success('Category updated successfully')
      } else {
        await createCategory(categoryData)
        toast.success('Category created successfully')
      }

      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await deleteCategory(id)
      toast.success('Category deleted')
      fetchCategories()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-zinc-400 mt-1">Manage product categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-200">Name (English)</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={handleNameChange}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-200">Name (Georgian)</Label>
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
                  <Label className="text-zinc-200">Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-200">Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Description (English)</Label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Description (Georgian)</Label>
                <Textarea
                  value={formData.descriptionKa}
                  onChange={(e) => setFormData({ ...formData, descriptionKa: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Image</Label>
                <div className="flex items-center gap-4">
                  {editingCategory?.image_url && !imageFile && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-zinc-800">
                      <Image
                        src={editingCategory.image_url}
                        alt={editingCategory.name_en}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
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
                <Label htmlFor="isActive" className="text-zinc-200">Active</Label>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCategory ? 'Update' : 'Create'}
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
              <TableHead className="text-zinc-400">Image</TableHead>
              <TableHead className="text-zinc-400">Name (EN)</TableHead>
              <TableHead className="text-zinc-400">Name (KA)</TableHead>
              <TableHead className="text-zinc-400">Slug</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Order</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-400">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell>
                    {category.image_url ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-zinc-800">
                        <Image
                          src={category.image_url}
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
                      {category.is_active ? 'Active' : 'Inactive'}
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
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="text-zinc-400 hover:text-red-400"
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
    </div>
  )
}
