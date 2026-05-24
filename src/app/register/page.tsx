'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Provider } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { updateProfile } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const oauthProviders: { provider: Provider; labelKey: 'continueWithGoogle' }[] = [
  { provider: 'google', labelKey: 'continueWithGoogle' },
]

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const supabase = hasSupabaseConfig ? createClient() : null

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      toast.error('Supabase is not configured for authentication.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }

    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      toast.error('Password must include uppercase, lowercase, and a number.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/login`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      })

      if (error) {
        // Handle specific Supabase errors with user-friendly messages
        if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
          toast.error('Too many attempts. Please wait a few minutes before trying again.')
        } else if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.')
        } else {
          toast.error(error.message)
        }
        return
      }

      if (data.user) {
        // Update profile with additional info using server action
        try {
          await updateProfile({
            fullName: formData.fullName,
            phone: formData.phone,
          })
        } catch (profileError) {
          // Profile update can fail if user needs to verify email first
          // This is fine - profile will be created on first login after verification
          console.log('Profile update deferred until email verification:', profileError)
        }

        toast.success('Registration successful! Please check your email to verify your account.')
        router.push('/login')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthRegister = async (provider: Provider) => {
    if (!supabase) {
      toast.error('Supabase is not configured for authentication.')
      return
    }

    setOauthLoading(provider)

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', '/account')

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        toast.error(error.message)
        setOauthLoading(null)
      }
    } catch {
      toast.error('An error occurred')
      setOauthLoading(null)
    }
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-white/70 bg-white/88 shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-display text-3xl font-black tracking-tight text-slate-950">
            {t('registerTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            Create your account to start shopping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {oauthProviders.map(({ provider, labelKey }) => (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className="w-full rounded-full bg-white"
              disabled={loading || Boolean(oauthLoading)}
              onClick={() => handleOAuthRegister(provider)}
            >
              {oauthLoading === provider ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="mr-2 grid h-4 w-4 place-items-center rounded-full border text-[10px] font-bold">
                  G
                </span>
              )}
              {t(labelKey)}
            </Button>
          ))}
          <div className="flex items-center gap-3 py-1">
            <Separator className="flex-1" />
            <span className="text-xs uppercase text-muted-foreground">{t('orContinueWithEmail')}</span>
            <Separator className="flex-1" />
          </div>
        </CardContent>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                className="h-11 rounded-xl bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="h-11 rounded-xl bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phoneNumber')}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+995 XXX XXX XXX"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className="h-11 rounded-xl bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className="h-11 rounded-xl bg-white"
                required
                minLength={8}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-11 rounded-xl bg-white"
                required
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('registerButton')}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              {t('haveAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline">
                {t('loginButton')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
