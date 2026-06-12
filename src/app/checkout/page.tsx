'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, LocateFixed, MapPin, ShoppingBag, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { createOrder } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/ui/SafeImage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInputField } from '@/components/ui/PhoneInputField'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { buildE164, DEFAULT_COUNTRY, validateLocalNumber } from '@/lib/phone'
import { buildMapsUrlFromCoords, isGoogleMapsUrl } from '@/lib/location'
import { useCartStore } from '@/store/cart'

const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city'] as const

type CheckoutField = typeof requiredFields[number] | 'phone' | 'postalCode' | 'notes'

type CheckoutForm = Record<Exclude<CheckoutField, 'phone'>, string>

const initialFormData: CheckoutForm = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  notes: '',
}

// Mirrors the server-side shippingAddressSchema so invalid input is
// caught with inline errors instead of a server action failure.
function validateCheckoutForm(formData: CheckoutForm, dialCode: string, localNumber: string) {
  const errors: Partial<Record<CheckoutField, string>> = {}

  for (const field of requiredFields) {
    if (!formData[field].trim()) {
      errors[field] = 'Required'
    }
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Enter a valid email'
  }

  const phoneError = validateLocalNumber(dialCode, localNumber)
  if (phoneError) {
    errors.phone = phoneError
  }

  if (formData.address.trim() && formData.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters'
  }

  if (formData.city.trim() && formData.city.trim().length < 2) {
    errors.city = 'City must be at least 2 characters'
  }

  return errors
}

export default function CheckoutPage() {
  const t = useTranslations('common')
  const { items, getTotal, clearCart, hasHydrated } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CheckoutForm>(initialFormData)
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY.dialCode)
  const [localNumber, setLocalNumber] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CheckoutField, string>>>({})
  const [locationUrl, setLocationUrl] = useState<string | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const total = getTotal()

  const orderLines = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
      })),
    [items]
  )

  if (!hasHydrated) {
    return (
      <div className="container py-10 sm:py-14">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Skeleton className="h-[34rem] rounded-[2rem] bg-white/60" />
          <Skeleton className="h-96 rounded-[2rem] bg-white/60" />
        </div>
      </div>
    )
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Location is not supported by this browser. Paste a Google Maps link instead.')
      return
    }

    setLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationUrl(buildMapsUrlFromCoords(position.coords.latitude, position.coords.longitude))
        setLocationInput('')
        setLocating(false)
        toast.success('Location saved')
      },
      (error) => {
        setLocating(false)
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? 'Location access was denied. Paste a Google Maps link instead.'
            : 'Could not detect your location. Paste a Google Maps link instead.'
        )
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    )
  }

  const handleSaveLocationLink = () => {
    const value = locationInput.trim()
    if (!value) {
      setLocationError('Paste a Google Maps link first')
      return
    }
    if (!isGoogleMapsUrl(value)) {
      setLocationError('That does not look like a Google Maps link (e.g., https://maps.app.goo.gl/…)')
      return
    }
    setLocationUrl(value)
    setLocationInput('')
    setLocationError(null)
    toast.success('Location saved')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    const errors = validateCheckoutForm(formData, dialCode, localNumber)
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error('Please review the highlighted fields')
      return
    }

    setLoading(true)

    try {
      const order = await createOrder({
        items: orderLines,
        shippingAddress: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: buildE164(dialCode, localNumber),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim() || undefined,
          locationUrl: locationUrl ?? undefined,
        },
        notes: formData.notes.trim() || undefined,
      })

      setOrderId(order.id)
      setOrderPlaced(true)
      clearCart()
      toast.success('Order placed successfully')
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orderPlaced) {
    return (
      <div className="container py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/86 p-8 text-center shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950">
            Order placed
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
            Thank you for your order. We will contact you shortly to confirm availability and delivery.
          </p>
          {orderId && (
            <p className="mt-5 text-sm text-slate-500">
              Order ID <span className="font-mono font-semibold text-slate-800">{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline" className="rounded-full border-white/80 bg-white/76">
              <Link href="/products">{t('continueShopping')}</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </section>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/86 p-8 text-center shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-10">
          <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-slate-400" />
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950">
            Your cart is empty
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
            Add products before starting checkout.
          </p>
          <Button asChild size="lg" className="mt-7 rounded-full">
            <Link href="/products">{t('continueShopping')}</Link>
          </Button>
        </section>
      </div>
    )
  }

  const fieldProps = (field: CheckoutField) => ({
    'aria-invalid': Boolean(fieldErrors[field]),
    'aria-describedby': fieldErrors[field] ? `${field}-error` : undefined,
  })

  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <Button asChild variant="ghost" className="mb-5 rounded-full">
        <Link href="/cart">
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>
      </Button>

      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Secure checkout
        </p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          {t('checkout')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <section className="space-y-5">
            {/* z-10 keeps the phone country dropdown above the sibling cards' stacking contexts */}
            <div className="relative z-10 rounded-[2rem] border border-white/70 bg-white/86 p-5 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl sm:p-6">
              <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
                Contact information
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="First name" name="firstName" value={formData.firstName} error={fieldErrors.firstName}>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className="h-11 rounded-xl bg-white" {...fieldProps('firstName')} />
                </Field>
                <Field label="Last name" name="lastName" value={formData.lastName} error={fieldErrors.lastName}>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-11 rounded-xl bg-white" {...fieldProps('lastName')} />
                </Field>
                <Field label="Email" name="email" value={formData.email} error={fieldErrors.email}>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="h-11 rounded-xl bg-white" {...fieldProps('email')} />
                </Field>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                    Phone
                  </Label>
                  <PhoneInputField
                    id="phone"
                    dialCode={dialCode}
                    localNumber={localNumber}
                    onDialCodeChange={(code) => {
                      setDialCode(code)
                      setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                    }}
                    onLocalNumberChange={(digits) => {
                      setLocalNumber(digits)
                      setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                    }}
                    error={fieldErrors.phone}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/86 p-5 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl sm:p-6">
              <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
                Delivery address
              </h2>
              <div className="mt-5 grid gap-4">
                <Field label="Address" name="address" value={formData.address} error={fieldErrors.address}>
                  <Input id="address" name="address" value={formData.address} onChange={handleInputChange} className="h-11 rounded-xl bg-white" {...fieldProps('address')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" name="city" value={formData.city} error={fieldErrors.city}>
                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} className="h-11 rounded-xl bg-white" {...fieldProps('city')} />
                  </Field>
                  <Field label="Postal code" name="postalCode" value={formData.postalCode} error={fieldErrors.postalCode} optional>
                    <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="h-11 rounded-xl bg-white" {...fieldProps('postalCode')} />
                  </Field>
                </div>

                <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 text-primary" />
                      Map location
                    </Label>
                    <span className="text-xs text-slate-400">Optional</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Pin your exact location so the courier finds you faster.
                  </p>

                  {locationUrl ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Location saved</span>
                      <a
                        href={locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
                      >
                        Open map
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setLocationUrl(null)}
                        aria-label="Remove saved location"
                        className="rounded-full p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl border-slate-200 bg-white sm:w-auto"
                        onClick={handleUseMyLocation}
                        disabled={locating || loading}
                      >
                        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                        {locating ? 'Detecting location...' : 'Use my current location'}
                      </Button>

                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={locationInput}
                          onChange={(e) => {
                            setLocationInput(e.target.value)
                            setLocationError(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveLocationLink()
                            }
                          }}
                          placeholder="Paste a Google Maps link (https://maps.app.goo.gl/…)"
                          className="h-11 min-w-0 flex-1 rounded-xl bg-white"
                          aria-invalid={Boolean(locationError)}
                          aria-describedby={locationError ? 'location-error' : undefined}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-11 shrink-0 rounded-xl"
                          onClick={handleSaveLocationLink}
                          disabled={loading}
                        >
                          Save
                        </Button>
                      </div>
                      {locationError && (
                        <p id="location-error" className="text-xs font-medium text-rose-600">
                          {locationError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/86 p-5 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl sm:p-6">
              <Field label="Order notes" name="notes" value={formData.notes} error={fieldErrors.notes} optional>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Delivery instructions, preferred contact time, or vehicle fitment notes"
                  rows={4}
                  className="rounded-xl bg-white"
                  {...fieldProps('notes')}
                />
              </Field>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-[0_24px_72px_-46px_rgba(15,23,42,0.52)] backdrop-blur-xl lg:sticky lg:top-36">
            <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
              Your order
            </h2>

            <div className="mt-5 max-h-[20rem] space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.image ? (
                      <SafeImage src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-950">{item.name}</p>
                    {item.variantName && <p className="mt-0.5 text-xs text-slate-500">{item.variantName}</p>}
                    <p className="mt-1 text-xs text-slate-500">
                      {item.quantity} x ₾{item.price}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">
                    ₾{(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-5" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('subtotal')}</span>
                <span className="font-semibold text-slate-950">₾{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="flex items-end justify-between">
              <span className="text-sm font-medium text-slate-500">{t('total')}</span>
              <span className="text-3xl font-black tracking-tight text-slate-950">₾{total.toFixed(2)}</span>
            </div>

            <Button type="submit" size="lg" className="mt-6 w-full rounded-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Placing order...' : 'Place order'}
            </Button>

            <div className="mt-5 flex gap-3 rounded-[1.25rem] bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Your order is validated on the server before it is stored.</span>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  error,
  optional,
  children,
}: {
  label: string
  name: CheckoutField
  value: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={name} className="text-sm font-semibold text-slate-700">
          {label}
        </Label>
        {optional && <span className="text-xs text-slate-400">Optional</span>}
      </div>
      {children}
      {error && (
        <p id={`${name}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
