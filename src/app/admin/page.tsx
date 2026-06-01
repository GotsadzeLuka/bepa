import { adminStatsService } from '@/lib/services'
import { requireAdmin } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderTree, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

type RecentOrder = Awaited<ReturnType<typeof adminStatsService.getRecentOrders>>[number]

function getCustomerName(shippingAddress: RecentOrder['shippingAddress']) {
  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
    return 'Guest customer'
  }

  const firstName = typeof shippingAddress.firstName === 'string' ? shippingAddress.firstName : ''
  const lastName = typeof shippingAddress.lastName === 'string' ? shippingAddress.lastName : ''
  return `${firstName} ${lastName}`.trim() || 'Guest customer'
}

function formatCurrency(value: unknown) {
  return `₾${Number(value).toFixed(2)}`
}

const statusStyles: Record<string, string> = {
  delivered: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  cancelled: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  shipped: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  processing: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  confirmed: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
  pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
}

export default async function AdminDashboard() {
  await requireAdmin()

  const [dashboardStats, recentOrders] = await Promise.all([
    adminStatsService.getDashboardStats(),
    adminStatsService.getRecentOrders(5),
  ])

  const stats = [
    { name: 'Products', value: dashboardStats.productsCount, icon: Package, tone: 'text-sky-300', copy: 'Live catalog records' },
    { name: 'Categories', value: dashboardStats.categoriesCount, icon: FolderTree, tone: 'text-emerald-300', copy: 'Active merchandising groups' },
    { name: 'Orders', value: dashboardStats.ordersCount, icon: ShoppingCart, tone: 'text-amber-300', copy: 'Total order pipeline' },
    { name: 'Customers', value: dashboardStats.customersCount, icon: Users, tone: 'text-violet-300', copy: 'Registered user profiles' },
  ]
  const recentRevenue = recentOrders.reduce((sum, order) => sum + Number(order.total), 0)

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.85)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">BEPA operations</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Catalog, order, customer, and moderation signals in one place.
            </p>
          </div>
          <div className="grid min-w-64 grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div>
              <p className="text-xs text-zinc-500">Recent volume</p>
              <p className="mt-1 text-xl font-semibold text-white">{recentOrders.length}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Recent value</p>
              <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(recentRevenue)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="border-white/10 bg-zinc-900/80 shadow-[0_18px_60px_-46px_rgba(0,0,0,0.8)]">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.name}
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className={`h-5 w-5 ${stat.tone}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold tracking-tight text-white">{stat.value}</div>
                <p className="text-xs leading-5 text-zinc-500">{stat.copy}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-white/10 bg-zinc-900/80 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.85)]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white">Recent Orders</CardTitle>
            <p className="mt-2 text-sm text-zinc-500">Latest checkout activity requiring operational follow-up.</p>
          </div>
          <TrendingUp className="h-5 w-5 text-zinc-500" />
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="divide-y divide-white/10">
              {recentOrders.map((order: RecentOrder) => (
                <div
                  key={order.id}
                  className="grid gap-4 py-4 sm:grid-cols-[8rem_minmax(0,1fr)_8rem_8rem] sm:items-center"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-white">{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-zinc-500">Order ID</p>
                  </div>
                  <p className="min-w-0 truncate text-sm text-zinc-300">
                    {getCustomerName(order.shippingAddress)}
                  </p>
                  <p className="text-sm font-semibold text-white sm:text-right">{formatCurrency(order.total)}</p>
                  <div className="sm:text-right">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                        statusStyles[order.status] ?? statusStyles.pending
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-center py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
