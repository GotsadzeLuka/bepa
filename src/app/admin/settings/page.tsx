export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-zinc-400">Operational settings for the admin area.</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white">Configuration</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Product, category, order, review, and news management is available from the sidebar.
          Environment and deployment settings are managed in Vercel and Supabase.
        </p>
      </div>
    </div>
  )
}
