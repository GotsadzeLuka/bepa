'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Package, Heart, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const accountLinks = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-zinc-200 rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="h-64 bg-zinc-200 rounded-lg" />
            <div className="md:col-span-3 h-96 bg-zinc-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-zinc-50 rounded-lg p-4">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="h-12 w-12 rounded-full bg-zinc-200 flex items-center justify-center">
                <User className="h-6 w-6 text-zinc-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{user?.email}</p>
                <p className="text-sm text-muted-foreground">Member</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {accountLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-white font-medium shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="mt-6 pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">{children}</div>
      </div>
    </div>
  )
}
