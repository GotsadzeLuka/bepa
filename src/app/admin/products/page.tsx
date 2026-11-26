'use client'

import { useLoadOnMount } from '@/lib/use-load-on-mount'

import { useCallback, useState } from 'react'
import {
  createProduct,
  createProductImagesFromUrls,
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
import { Plus, Pencil, Trash2, Loader2, ImageIcon, Search, X } from 'lucide-react'
import type { Category, Product, ProductImage, ProductVariant } from '@/types/database'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminTableSkeleton } from '@/components/admin/TableSkeleton'
import { getSafeImageSrc } from '@/lib/storefront-media'
import { optimizeImageFiles } from '@/lib/optimize-image'
import { SafeImage } from '@/components/ui/SafeImage'
import { useLocale, useTranslations } from 'next-intl'

interface ProductWithRelations extends Product {
  category: Category | null
  images: ProductImage[]
  variants: ProductVariant[]
}

type VariantDraft = Pick<ProductVariant, 'name_en' | 'name_ka' | 'sku' | 'is_active'> & {
  price: string
  stock: string
}

function parseImageUrlInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter(Boolean)
}

function assertValidImageUrls(urls: string[]) {
  for (const value of urls) {
    try {
      const url = new URL(value)
      if (value.length > 2048 || url.protocol !== 'https:' || url.username || url.password) {
        throw new Error()
      }
    } catch {
      throw new Error(value)
    }
  }
}

export default function ProductsPage() {
  const t = useTranslations('admin.products')
  const common = useTranslations('admin.common')
  const confirm = useTranslations('admin.confirm')
  const toastText = useTranslations('admin.toast')
  const locale = useLocale()
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState('')
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<VariantDraft[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ProductWithRelations | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    category_id: '',
    name_en: '',
    name_ka: '',
    slug: '',
    description_en: '',
    description_ka: '',
    price: '',
    sale_price: '',
    sku: '',
    stock: '',
    is_active: true,
    is_featured: false,
  })

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await getProductsAdmin()
      if (signal?.aborted) return
      setProducts((data as unknown as ProductWithRelations[]) || [])
    } catch {
      if (signal?.aborted) return
      toast.error(toastText('fetchProductsFailed'))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [toastText])

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await getCategoriesAdmin()
      if (signal?.aborted) return
      setCategories((data as unknown as Category[]).filter((category) => category.is_active))
    } catch {
      if (signal?.aborted) return
      toast.error(toastText('fetchCategoriesFailed'))
    }
  }, [toastText])

  const loadCatalog = useCallback(async (signal: AbortSignal) => {
    await Promise.all([fetchProducts(signal), fetchCategories(signal)])
  }, [fetchProducts, fetchCategories])
  useLoadOnMount(loadCatalog)

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
      price: '',
      sale_price: '',
      sku: '',
      stock: '',
      is_active: true,
      is_featured: false,
    })
    setEditingProduct(null)
    setImageFiles([])
    setImageUrls('')
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
      price: String(product.price),
      sale_price: product.sale_price !== null ? String(product.sale_price) : '',
      sku: product.sku || '',
      stock: String(product.stock),
      is_active: product.is_active,
      is_featured: product.is_featured,
    })
    setExistingImages(product.images || [])
    setVariants(product.variants?.map(v => ({
      name_en: v.name_en,
      name_ka: v.name_ka,
      sku: v.sku,
      price: String(v.price),
      stock: String(v.stock),
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
      stock: '',
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

    const price = parseFloat(formData.price)
    const salePrice = formData.sale_price.trim() ? parseFloat(formData.sale_price) : null
    const stock = parseInt(formData.stock, 10)

    if (!Number.isFinite(price) || price <= 0) {
      toast.error(toastText('pricePositive'))
      return
    }

    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0)) {
      toast.error(toastText('salePricePositive'))
      return
    }

    const parsedVariants = variants.map((variant) => ({
      ...variant,
      parsedPrice: parseFloat(variant.price),
      parsedStock: parseInt(variant.stock, 10),
    }))

    const invalidVariant = parsedVariants.find(
      (variant) => !Number.isFinite(variant.parsedPrice) || variant.parsedPrice <= 0
    )
    if (invalidVariant) {
      toast.error(toastText('variantPricePositive'))
      return
    }

    setFormLoading(true)

    try {
      const parsedImageUrls = parseImageUrlInput(imageUrls)
      try {
        assertValidImageUrls(parsedImageUrls)
      } catch (error) {
        throw new Error(t('invalidUrl', { url: error instanceof Error ? error.message : '' }))
      }

      let productId = editingProduct?.id
      const productData = {
        categoryId: formData.category_id || null,
        nameEn: formData.name_en,
        nameKa: formData.name_ka,
        slug: formData.slug,
        descriptionEn: formData.description_en || null,
        descriptionKa: formData.description_ka || null,
        price,
        salePrice,
        sku: formData.sku || null,
        stock: Number.isFinite(stock) ? stock : 0,
        isActive: formData.is_active,
        isFeatured: formData.is_featured,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        const product = await createProduct(productData)
        productId = product.id
      }

      if (parsedImageUrls.length > 0 && productId) {
        await createProductImagesFromUrls(productId, parsedImageUrls)
      }

      if (imageFiles.length > 0 && productId) {
        await uploadProductImages(productId, await optimizeImageFiles(imageFiles))
      }

      if (productId) {
        await syncProductVariants(productId, parsedVariants.map((variant) => ({
          nameEn: variant.name_en,
          nameKa: variant.name_ka,
          sku: variant.sku,
          price: variant.parsedPrice,
          stock: Number.isFinite(variant.parsedStock) ? variant.parsedStock : 0,
          isActive: variant.is_active,
        })))
      }

      toast.success(editingProduct ? toastText('productUpdated') : toastText('productCreated'))
      setDialogOpen(false)
      resetForm()
      fetchProducts()
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
      await deleteProduct(deleteTarget.id)
      toast.success(toastText('productDeleted'))
      setDeleteTarget(null)
      fetchProducts()
    } catch {
      toast.error(toastText('deleteProductFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const removeExistingImage = async (imageId: string) => {
    try {
      await deleteProductImage(imageId)
      setExistingImages(existingImages.filter(img => img.id !== imageId))
    } catch {
      toast.error(toastText('removeImageFailed'))
    }
  }

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const visibleProducts = normalizedSearch
    ? products.filter((product) =>
        [product.name_en, product.name_ka, product.sku ?? '', product.category?.name_en ?? '', product.category?.name_ka ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : products

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-zinc-400 mt-1">{t('subtitle')}</p>
        </div>
        <AdminTableSkeleton rows={6} />
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
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProduct ? t('edit') : t('add')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('basicInfo')}</h3>
                
                <div className="space-y-2">
                  <Label className="text-zinc-200">{common('category')}</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    required
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">
                          {locale === 'ka' ? cat.name_ka : cat.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-200">{common('nameEn')}</Label>
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
                    <Label className="text-zinc-200">{common('nameKa')}</Label>
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
                    <Label className="text-zinc-200">{common('slug')}</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-200">{common('sku')}</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">{common('descriptionEn')}</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">{common('descriptionKa')}</Label>
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
                <h3 className="text-lg font-semibold text-white">{t('pricingStock')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-200">{t('priceGel')}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-200">{t('salePrice')}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      placeholder={t('salePlaceholder')}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-200">{common('stock')}</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('images')}</h3>
                {existingImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative h-20 w-20 rounded-lg overflow-hidden bg-zinc-800">
                        {getSafeImageSrc(img.url) ? (
                          <SafeImage src={getSafeImageSrc(img.url) ?? ''} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-zinc-600" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5"
                          aria-label={t('removeImage')}
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
                <div className="space-y-2">
                  <Label className="text-zinc-200">{t('imageUrls')}</Label>
                  <Textarea
                    value={imageUrls}
                    onChange={(e) => setImageUrls(e.target.value)}
                    placeholder={t('imageUrlPlaceholder')}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{t('variants')}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant} className="border-zinc-700">
                    <Plus className="h-4 w-4 mr-1" /> {t('addVariant')}
                  </Button>
                </div>
                {variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end p-4 bg-zinc-800 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">{common('nameEn')}</Label>
                      <Input
                        value={variant.name_en}
                        onChange={(e) => updateVariant(index, 'name_en', e.target.value)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">{common('nameKa')}</Label>
                      <Input
                        value={variant.name_ka}
                        onChange={(e) => updateVariant(index, 'name_ka', e.target.value)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">{common('price')}</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        placeholder="0.00"
                        className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">{common('stock')}</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        placeholder="0"
                        className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(index)}
                      className="text-red-400"
                      aria-label={t('removeVariant', { index: index + 1 })}
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
                  <Label htmlFor="is_active" className="text-zinc-200">{common('active')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_featured" className="text-zinc-200">{t('featured')}</Label>
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
                  {common('cancel')}
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? common('update') : common('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border-zinc-700 bg-zinc-800 pl-9 text-white placeholder:text-zinc-500"
        />
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">{common('image')}</TableHead>
              <TableHead className="text-zinc-400">{common('name')}</TableHead>
              <TableHead className="text-zinc-400">{common('category')}</TableHead>
              <TableHead className="text-zinc-400">{common('price')}</TableHead>
              <TableHead className="text-zinc-400">{common('stock')}</TableHead>
              <TableHead className="text-zinc-400">{common('status')}</TableHead>
              <TableHead className="text-zinc-400 text-right">{common('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-400">
                  {normalizedSearch ? t('noMatches', { query: searchQuery.trim() }) : t('noProducts')}
                </TableCell>
              </TableRow>
            ) : (
              visibleProducts.map((product) => (
                <TableRow key={product.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell>
                    {getSafeImageSrc(product.images?.[0]?.url) ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-zinc-800">
                        <SafeImage
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
                  <TableCell className="text-zinc-300">
                    {product.category ? (locale === 'ka' ? product.category.name_ka : product.category.name_en) : '-'}
                  </TableCell>
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
                        {product.is_active ? common('active') : common('inactive')}
                      </span>
                      {product.is_featured && (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                          {t('featured')}
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
                        aria-label={t('editLabel', { name: product.name_en })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(product)}
                        className="text-zinc-400 hover:text-red-400"
                        aria-label={t('deleteLabel', { name: product.name_en })}
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
        title={confirm('deleteProductTitle')}
        description={confirm('deleteProductDescription', { name: deleteTarget?.name_en ?? '' })}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
