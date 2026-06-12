'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCustomersAdmin } from '@/app/admin/actions'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminTableSkeleton } from '@/components/admin/TableSkeleton'
import { Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale, useTranslations } from 'next-intl'

type Customer = Awaited<ReturnType<typeof getCustomersAdmin>>[number]

export default function CustomersPage() {
  const t = useTranslations('admin.customers')
  const common = useTranslations('admin.common')
  const toastText = useTranslations('admin.toast')
  const locale = useLocale()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await getCustomersAdmin()
      setCustomers(data)
    } catch (error) {
      console.error(error)
      toast.error(toastText('fetchCustomersFailed'))
    } finally {
      setLoading(false)
    }
  }, [toastText])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const visibleCustomers = normalizedSearch
    ? customers.filter((customer) =>
        [customer.email, customer.full_name ?? '', customer.phone ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : customers

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="text-zinc-400">{t('subtitle')}</p>
        </div>
        <AdminTableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="text-zinc-400">{t('subtitle')}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border-zinc-700 bg-zinc-800 pl-9 text-white placeholder:text-zinc-500"
        />
      </div>

      {customers.length === 0 ? (
        <div className="rounded-lg bg-zinc-900/50 py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="mb-2 text-lg font-medium text-white">{t('noCustomers')}</h3>
          <p className="text-zinc-400">{t('emptyCopy')}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">{common('email')}</TableHead>
                <TableHead className="text-zinc-400">{common('name')}</TableHead>
                <TableHead className="text-zinc-400">{common('phone')}</TableHead>
                <TableHead className="text-zinc-400">{common('role')}</TableHead>
                <TableHead className="text-zinc-400">{common('created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCustomers.length === 0 ? (
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableCell colSpan={5} className="py-8 text-center text-zinc-400">
                    {t('noMatches', { query: searchQuery.trim() })}
                  </TableCell>
                </TableRow>
              ) : (
                visibleCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-zinc-800 hover:bg-zinc-900">
                    <TableCell className="font-medium text-white">{customer.email}</TableCell>
                    <TableCell className="text-zinc-300">{customer.full_name || '-'}</TableCell>
                    <TableCell className="text-zinc-300">{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          customer.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        {customer.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {new Date(customer.created_at).toLocaleDateString(locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
