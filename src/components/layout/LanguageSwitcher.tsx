'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { setLocaleCookie } from '@/app/locale-actions'

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleLanguageChange = (langCode: string) => {
    if (langCode === locale) return

    startTransition(async () => {
      await setLocaleCookie(langCode)
      router.refresh()
    })
  }

  const currentLang = languages.find((l) => l.code === locale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={pending}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag} {currentLang.name}</span>
          <span className="sm:hidden">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={locale === lang.code ? 'bg-muted' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
