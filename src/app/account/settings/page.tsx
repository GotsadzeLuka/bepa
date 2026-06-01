'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
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

      <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-100"
          onClick={() => toast.error('Account deletion is not available yet')}
        >
          Delete Account
        </Button>
      </div>
    </div>
  )
}
