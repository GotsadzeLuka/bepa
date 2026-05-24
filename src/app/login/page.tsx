'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Provider } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/supabase/config'
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

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const redirect = redirectParam?.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/'
  const supabase = hasSupabaseConfig ? createClient() : null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)

  const getOAuthRedirectUrl = () => {
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('next', redirect)
    return callbackUrl.toString()
  }

  const handleOAuthLogin = async (provider: Provider) => {
    if (!supabase) {
      toast.error('Supabase is not configured for authentication.')
      return
    }

    setOauthLoading(provider)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(),
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast.error('Supabase is not configured for authentication.')
      return
    }
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle specific Supabase errors with user-friendly messages
        if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
          toast.error('Too many login attempts. Please wait a few minutes.')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before logging in.')
        } else {
          toast.error(t('invalidCredentials'))
        }
        return
      }

      toast.success('Login successful!')
      router.push(redirect)
      router.refresh()
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-white/70 bg-white/88 shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-display text-3xl font-black tracking-tight text-slate-950">
            {t('loginTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to login
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
              onClick={() => handleOAuthLogin(provider)}
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
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl bg-white"
                required
              />
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline block text-right"
            >
              {t('forgotPassword')}
            </Link>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('loginButton')}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              {t('noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline">
                {t('registerButton')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
