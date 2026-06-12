import { getTranslations } from 'next-intl/server'

export default async function AdminSettingsPage() {
  const t = await getTranslations('admin.settings')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-1 text-zinc-400">{t('subtitle')}</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white">{t('configuration')}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {t('copy')}
        </p>
      </div>
    </div>
  )
}
