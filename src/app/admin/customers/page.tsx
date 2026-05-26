'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCustomersAdmin } from '@/app/admin/actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

type Customer = Awaited<ReturnType<typeof getCustomersAdmin>>[number]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await getCustomersAdmin()
      setCustomers(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        <p className="text-zinc-400">Review registered profiles and admin access.</p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-lg bg-zinc-900/50 py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="mb-2 text-lg font-medium text-white">No customers yet</h3>
          <p className="text-zinc-400">Profiles will appear here after users sign up.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Phone</TableHead>
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell className="font-medium text-white">{customer.email}</TableCell>
                  <TableCell className="text-zinc-300">{customer.full_name || '-'}</TableCell>
                  <TableCell className="text-zinc-300">{customer.phone || '-'}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-200">
                      {customer.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
