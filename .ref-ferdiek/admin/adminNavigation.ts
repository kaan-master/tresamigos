const ADMIN_RETURN_KEY = 'ferdiek-admin-return'
const ADMIN_LAST_ROUTE_KEY = 'ferdiek-admin-last-route'

export function rememberShopReturnPath(path: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(ADMIN_RETURN_KEY, path)
}

export function readShopReturnPath() {
  if (typeof window === 'undefined') {
    return '/shop'
  }

  return window.sessionStorage.getItem(ADMIN_RETURN_KEY) || '/shop'
}

export function rememberAdminRoute(path: string) {
  if (typeof window === 'undefined' || !path.startsWith('/admin')) {
    return
  }

  window.sessionStorage.setItem(ADMIN_LAST_ROUTE_KEY, path)
}

export function readLastAdminRoute() {
  if (typeof window === 'undefined') {
    return '/admin'
  }

  return window.sessionStorage.getItem(ADMIN_LAST_ROUTE_KEY) || '/admin'
}

export function openShopPath(path: string) {
  if (typeof window === 'undefined') {
    return
  }

  const url = path.startsWith('http') ? path : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
