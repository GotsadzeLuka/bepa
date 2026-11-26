'use client'

import { useLoadOnMount } from '@/lib/use-load-on-mount'
import { updateProfile } from '@/app/actions'

import { useCallback, useMemo, useState } from 'react'
import { User } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AccountPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  })

  const loadProfile = useCallback(async (signal?: AbortSignal) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (signal?.aborted) return
      if (!user) return

      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile && !signal?.aborted) {
        setFormData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
        })
      }
    } catch (error) {
      if (signal?.aborted) return
      console.error('Error loading profile:', error)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [supabase])

  useLoadOnMount(loadProfile)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)

    try {
      await updateProfile({
        fullName: formData.full_name.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
      })

      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded-full bg-white/60" />
        <div className="h-72 rounded-[2rem] bg-white/60" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 font-display text-2xl font-black tracking-tight text-slate-950">Profile</h2>

      <div className="rounded-[2rem] border border-white/70 bg-white/86 p-6 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl sm:p-7">
        {/* Avatar */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-slate-950 text-white">
            <User className="h-9 w-9" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950">{formData.full_name || 'User'}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="h-11 rounded-xl bg-white"
              />
              <p className="text-xs text-slate-400">
                Email cannot be changed
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-semibold text-slate-700">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-11 rounded-xl bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 rounded-xl bg-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-sm font-semibold text-slate-700">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-11 rounded-xl bg-white"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="rounded-full px-7" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  )
}
