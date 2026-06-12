'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function AdminLoginPage() {
  const t = useTranslations('admin.login')
  const toastText = useTranslations('admin.toast')
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (authError) {
      toast.error(authError)
    }
  }, [authError])

  const handleGoogleLogin = () => {
    if (!hasSupabaseConfig) {
      toast.error(toastText('supabaseMissing'))
      return
    }

    setLoading(true)
    const loginUrl = new URL('/auth/sign-in/google', window.location.origin)
    loginUrl.searchParams.set('next', '/admin')
    window.location.assign(loginUrl.toString())
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" className="w-full" disabled={loading} onClick={handleGoogleLogin}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2 grid h-4 w-4 place-items-center rounded-full border border-white/40 text-[10px] font-bold">
                G
              </span>
            )}
            {t('continueGoogle')}
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-center text-xs leading-5 text-zinc-500">
            {t('passwordDisabled')}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
