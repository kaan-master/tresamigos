import type { ApiAdminOrder } from '../api'

const STORAGE_KEY = 'ferdiek-admin-order-alerts'

type StoredOrderAlerts = {
  date: string
  dismissedOrderIds: string[]
}

const INCOMING_STATUSES = new Set(['PENDING_PAYMENT', 'PAID', 'PROCESSING'])

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readStoredAlerts(): StoredOrderAlerts {
  if (typeof window === 'undefined') {
    return { date: localDateKey(), dismissedOrderIds: [] }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { date: localDateKey(), dismissedOrderIds: [] }
    }

    const parsed = JSON.parse(raw) as StoredOrderAlerts
    const today = localDateKey()

    if (parsed.date !== today || !Array.isArray(parsed.dismissedOrderIds)) {
      return { date: today, dismissedOrderIds: [] }
    }

    return { date: today, dismissedOrderIds: parsed.dismissedOrderIds }
  } catch {
    return { date: localDateKey(), dismissedOrderIds: [] }
  }
}

function writeStoredAlerts(state: StoredOrderAlerts) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function isIncomingOrder(order: ApiAdminOrder) {
  return INCOMING_STATUSES.has(order.status)
}

export function isOrderFromToday(createdAt: string, now = new Date()) {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) {
    return false
  }

  return localDateKey(created) === localDateKey(now)
}

export function readDismissedOrderIdsForToday() {
  return new Set(readStoredAlerts().dismissedOrderIds)
}

export function dismissOrderIds(orderIds: string[]) {
  if (!orderIds.length) {
    return
  }

  const stored = readStoredAlerts()
  const next = new Set(stored.dismissedOrderIds)
  orderIds.forEach((id) => next.add(id))
  writeStoredAlerts({
    date: localDateKey(),
    dismissedOrderIds: Array.from(next),
  })
}

export function getNewTodayIncomingOrders(orders: ApiAdminOrder[], dismissedIds: Set<string>) {
  return orders.filter((order) => isIncomingOrder(order) && isOrderFromToday(order.createdAt) && !dismissedIds.has(order.id))
}
