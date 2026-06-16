export type CommonNavLabelKey = 'home' | 'products' | 'sale' | 'news' | 'contact'

export interface PublicNavItem {
  href: string
  labelKey: CommonNavLabelKey
}

export const HOME_NAV_ITEM: PublicNavItem = { href: '/', labelKey: 'home' }

export const PRIMARY_NAV_ITEMS: PublicNavItem[] = [
  { href: '/products', labelKey: 'products' },
  { href: '/products?sale=true', labelKey: 'sale' },
  { href: '/news', labelKey: 'news' },
  { href: '/contact', labelKey: 'contact' },
]

export const FOOTER_NAV_ITEMS: PublicNavItem[] = [HOME_NAV_ITEM, ...PRIMARY_NAV_ITEMS]

export type AccountNavLabelKey = 'account' | 'myOrders' | 'wishlist' | 'cart'

export interface AccountNavItem {
  href: string
  labelKey: AccountNavLabelKey
}

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { href: '/account', labelKey: 'account' },
  { href: '/account/orders', labelKey: 'myOrders' },
  { href: '/wishlist', labelKey: 'wishlist' },
  { href: '/cart', labelKey: 'cart' },
]

type SearchParamsLike = Pick<URLSearchParams, 'get'>

function hasPathPrefix(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

function isSaleRoute(pathname: string, searchParams: SearchParamsLike) {
  return pathname === '/products' && searchParams.get('sale') === 'true'
}

export function isPublicNavItemActive(
  href: string,
  pathname: string,
  searchParams: SearchParamsLike
) {
  if (href === '/') return pathname === '/'
  if (href === '/products?sale=true') return isSaleRoute(pathname, searchParams)
  if (href === '/products') {
    if (pathname.startsWith('/product/')) return true

    return pathname === '/products' && !isSaleRoute(pathname, searchParams) && !searchParams.get('category')
  }
  if (href === '/news') return hasPathPrefix(pathname, '/news')
  if (href === '/contact') return hasPathPrefix(pathname, '/contact')

  return hasPathPrefix(pathname, href)
}

export function isCategoryRouteActive(
  slug: string,
  pathname: string,
  searchParams: SearchParamsLike
) {
  return pathname === '/products' && searchParams.get('category') === slug
}

export function hasActiveCategoryRoute(pathname: string, searchParams: SearchParamsLike) {
  return pathname === '/products' && Boolean(searchParams.get('category'))
}

export function isAccountAreaActive(pathname: string) {
  return hasPathPrefix(pathname, '/account')
}

export function isAccountNavItemActive(href: string, pathname: string) {
  if (href === '/account') return pathname === '/account'

  return hasPathPrefix(pathname, href)
}
