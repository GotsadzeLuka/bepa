import { adminStatsService } from '@/lib/services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FolderTree, ShoppingCart, Users } from 'lucide-react'

type RecentOrder = Awaited<ReturnType<typeof adminStatsService.getRecentOrders>>[number]

function getCustomerName(shippingAddress: RecentOrder['shippingAddress']) {
  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
    return 'Guest customer'
  }

  const firstName = typeof shippingAddress.firstName === 'string' ? shippingAddress.firstName : ''
  const lastName = typeof shippingAddress.lastName === 'string' ? shippingAddress.lastName : ''
  return `${firstName} ${lastName}`.trim() || 'Guest customer'
}

export default async function AdminDashboard() {
  // Fetch stats using Prisma
  const [dashboardStats, recentOrders] = await Promise.all([
    adminStatsService.getDashboardStats(),
    adminStatsService.getRecentOrders(5),
  ])

  const stats = [
    { name: 'Total Products', value: dashboardStats.productsCount, icon: Package, color: 'text-blue-500' },
    { name: 'Categories', value: dashboardStats.categoriesCount, icon: FolderTree, color: 'text-green-500' },
    { name: 'Orders', value: dashboardStats.ordersCount, icon: ShoppingCart, color: 'text-yellow-500' },
    { name: 'Customers', value: dashboardStats.customersCount, icon: Users, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Welcome to BEPA Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.name}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Orders */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order: RecentOrder) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-800"
                >
                  <div>
                    <p className="font-medium text-white">{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-zinc-400">
                      {getCustomerName(order.shippingAddress)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">₾{Number(order.total).toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
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
