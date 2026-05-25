'use client'

import { useState } from 'react'
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

export default function RegisterPage() {
  const t = useTranslations('auth')

  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)

  const handleOAuthRegister = async (provider: Provider) => {
    if (!hasSupabaseConfig) {
      toast.error('Supabase is not configured for authentication.')
      return
    }

    setOauthLoading(provider)
    window.location.assign(`/auth/sign-in/${provider}?next=/account`)
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-white/70 bg-white/88 shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-display text-3xl font-black tracking-tight text-slate-950">
            {t('registerTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            Continue with Google to create your account
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-center text-muted-foreground">
            {t('haveAccount')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('loginButton')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
