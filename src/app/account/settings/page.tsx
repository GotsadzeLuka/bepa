'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <h2 className="mb-6 font-display text-2xl font-black tracking-tight text-slate-950">Settings</h2>

      <div className="rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/90 p-6 shadow-[0_18px_56px_-44px_rgba(16,185,129,0.55)] backdrop-blur-xl">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <h3 className="text-lg font-semibold text-emerald-950">Google sign-in only</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-800">
              Password credentials are disabled. Manage account access and recovery through the connected Google account.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-rose-200/80 bg-rose-50/90 p-6 shadow-[0_18px_56px_-44px_rgba(244,63,94,0.5)] backdrop-blur-xl">
        <h3 className="mb-2 text-lg font-semibold text-rose-900">Danger Zone</h3>
        <p className="mb-4 text-sm leading-6 text-rose-700">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button
          variant="outline"
          className="rounded-full border-rose-300 bg-white/70 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
          onClick={() => toast.error('Account deletion is not available yet')}
        >
          Delete Account
        </Button>
      </div>
    </div>
  )
}
