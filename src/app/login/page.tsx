import { getSafeRedirect } from '@/lib/safe-redirect'
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Provider } from '@supabase/supabase-js'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const oauthProviders: { provider: Provider; labelKey: 'continueWithGoogle' }[] = [
  { provider: 'google', labelKey: 'continueWithGoogle' },
]

export default function LoginPage() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const authError = searchParams.get('error')
  const redirect = getSafeRedirect(redirectParam)

  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)

  useEffect(() => {
    if (authError) {
      toast.error(authError)
    }
  }, [authError])

  const handleOAuthLogin = async (provider: Provider) => {
    if (!hasSupabaseConfig) {
      toast.error('Supabase is not configured for authentication.')
      return
    }

    setOauthLoading(provider)
    const loginUrl = new URL(`/auth/sign-in/${provider}`, window.location.origin)
    loginUrl.searchParams.set('next', redirect)
    window.location.assign(loginUrl.toString())
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-white/70 bg-white/88 shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-display text-3xl font-black tracking-tight text-slate-950">
            {t('loginTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            Continue with Google to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {oauthProviders.map(({ provider, labelKey }) => (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className="w-full rounded-full bg-white"
              disabled={Boolean(oauthLoading)}
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-center text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline">
              {t('registerButton')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
