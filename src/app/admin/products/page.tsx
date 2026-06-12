'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  getCategoriesAdmin,
  getProductsAdmin,
  syncProductVariants,
  updateProduct,
  uploadProductImages,
} from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, Pencil, Trash2, Loader2, ImageIcon, X } from 'lucide-react'
import type { Category, Product, ProductImage, ProductVariant } from '@/types/database'
import { getSafeImageSrc } from '@/lib/storefront-media'
import Image from 'next/image'

interface ProductWithRelations extends Product {
  category: Category | null
  images: ProductImage[]
  variants: ProductVariant[]
}

type VariantDraft = Pick<ProductVariant, 'name_en' | 'name_ka' | 'sku' | 'price' | 'stock' | 'is_active'>

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<VariantDraft[]>([])

  const [formData, setFormData] = useState({
    category_id: '',
    name_en: '',
    name_ka: '',
    slug: '',
    description_en: '',
    description_ka: '',
    price: 0,
    sale_price: null as number | null,
    sku: '',
    stock: 0,
    is_active: true,
    is_featured: false,
  })

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProductsAdmin()
      setProducts((data as unknown as ProductWithRelations[]) || [])
    } catch {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategoriesAdmin()
      setCategories((data as unknown as Category[]).filter((category) => category.is_active))
    } catch {
      toast.error('Failed to fetch categories')
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const resetForm = () => {
    setFormData({
      category_id: '',
      name_en: '',
      name_ka: '',
      slug: '',
      description_en: '',
      description_ka: '',
      price: 0,
      sale_price: null,
      sku: '',
      stock: 0,
      is_active: true,
      is_featured: false,
    })
    setEditingProduct(null)
    setImageFiles([])
    setExistingImages([])
    setVariants([])
  }

  const openEditDialog = (product: ProductWithRelations) => {
    setEditingProduct(product)
    setFormData({
      category_id: product.category_id || '',
      name_en: product.name_en,
      name_ka: product.name_ka,
      slug: product.slug,
      description_en: product.description_en || '',
      description_ka: product.description_ka || '',
      price: product.price,
      sale_price: product.sale_price,
      sku: product.sku || '',
      stock: product.stock,
      is_active: product.is_active,
      is_featured: product.is_featured,
    })
    setExistingImages(product.images || [])
    setVariants(product.variants?.map(v => ({
      name_en: v.name_en,
      name_ka: v.name_ka,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      is_active: v.is_active,
    })) || [])
    setDialogOpen(true)
  }

  const addVariant = () => {
    setVariants([...variants, {
      name_en: '',
      name_ka: '',
      sku: null,
      price: formData.price,
      stock: 0,
      is_active: true,
    }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = <K extends keyof VariantDraft>(index: number, field: K, value: VariantDraft[K]) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      let productId = editingProduct?.id
      const productData = {
        categoryId: formData.category_id || null,
        nameEn: formData.name_en,
        nameKa: formData.name_ka,
        slug: formData.slug,
        descriptionEn: formData.description_en || null,
        descriptionKa: formData.description_ka || null,
        price: formData.price,
        salePrice: formData.sale_price,
        sku: formData.sku || null,
        stock: formData.stock,
        isActive: formData.is_active,
        isFeatured: formData.is_featured,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        const product = await createProduct(productData)
        productId = product.id
      }

      if (imageFiles.length > 0 && productId) {
        await uploadProductImages(productId, imageFiles)
      }

      if (productId) {
        await syncProductVariants(productId, variants.map((variant) => ({
          nameEn: variant.name_en,
          nameKa: variant.name_ka,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          isActive: variant.is_active,
        })))
      }

      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully')
      setDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await deleteProduct(id)
      toast.success('Product deleted')
      fetchProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const removeExistingImage = async (imageId: string) => {
    try {
      await deleteProductImage(imageId)
      setExistingImages(existingImages.filter(img => img.id !== imageId))
    } catch {
      toast.error('Failed to remove image')
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
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-zinc-400 mt-1">Manage your products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label className="text-zinc-200">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    required
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">
                          {cat.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Name (English)</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData({
                        ...formData,
                        name_en: e.target.value,
                        slug: editingProduct ? formData.slug : generateSlug(e.target.value)
                      })}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Name (Georgian)</Label>
                    <Input
                      value={formData.name_ka}
                      onChange={(e) => setFormData({ ...formData, name_ka: e.target.value })}
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
                    <Label className="text-zinc-200">SKU</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">Description (English)</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">Description (Georgian)</Label>
                  <Textarea
                    value={formData.description_ka}
                    onChange={(e) => setFormData({ ...formData, description_ka: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Pricing & Stock</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Price (₾)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Sale Price (₾)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sale_price || ''}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Leave empty for no sale"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Stock</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Images</h3>
                {existingImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative h-20 w-20 rounded-lg overflow-hidden bg-zinc-800">
                        {getSafeImageSrc(img.url) ? (
                          <Image src={getSafeImageSrc(img.url) ?? ''} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-zinc-600" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Variants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Variants</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant} className="border-zinc-700">
                    <Plus className="h-4 w-4 mr-1" /> Add Variant
                  </Button>
                </div>
                {variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end p-4 bg-zinc-800 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Name (EN)</Label>
                      <Input
                        value={variant.name_en}
                        onChange={(e) => updateVariant(index, 'name_en', e.target.value)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Name (KA)</Label>
                      <Input
                        value={variant.name_ka}
                        onChange={(e) => updateVariant(index, 'name_ka', e.target.value)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Price</Label>
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Stock</Label>
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(index)}
                      className="text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Flags */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active" className="text-zinc-200">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_featured" className="text-zinc-200">Featured</Label>
                </div>
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
                  {editingProduct ? 'Update' : 'Create'}
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
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Category</TableHead>
              <TableHead className="text-zinc-400">Price</TableHead>
              <TableHead className="text-zinc-400">Stock</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-400">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell>
                    {getSafeImageSrc(product.images?.[0]?.url) ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-zinc-800">
                        <Image
                          src={getSafeImageSrc(product.images[0].url) ?? ''}
                          alt={product.name_en}
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
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{product.name_en}</p>
                      <p className="text-xs text-zinc-400">{product.name_ka}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">{product.category?.name_en}</TableCell>
                  <TableCell>
                    <div>
                      {product.sale_price ? (
                        <>
                          <span className="text-red-400 font-medium">₾{product.sale_price}</span>
                          <span className="text-zinc-500 line-through text-sm ml-2">₾{product.price}</span>
                        </>
                      ) : (
                        <span className="text-white font-medium">₾{product.price}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">{product.stock}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {product.is_featured && (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                          Featured
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
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
