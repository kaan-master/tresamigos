const MOBILE_APP_MODE_KEY = 'ferdiek-admin-mobile-app-mode'
const FORCE_DESKTOP_VIEW_KEY = 'ferdiek-admin-force-desktop-view'
export const ADMIN_DISPLAY_PREFERENCES_EVENT = 'ferdiek-admin-display-preferences-changed'

function isMobileViewportNow() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 780px)').matches
}

/** Standaard aan op mobiel, tenzij expliciet uitgezet. */
export function readMobileAppMode(isMobileViewport = isMobileViewportNow()) {
  if (typeof window === 'undefined') {
    return isMobileViewport
  }

  const stored = window.localStorage.getItem(MOBILE_APP_MODE_KEY)
  if (stored === 'false') {
    return false
  }
  if (stored === 'true') {
    return true
  }

  return isMobileViewport
}

export function writeMobileAppMode(enabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(MOBILE_APP_MODE_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new Event(ADMIN_DISPLAY_PREFERENCES_EVENT))
}

export function readForceDesktopView() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(FORCE_DESKTOP_VIEW_KEY) === 'true'
}

export function writeForceDesktopView(enabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(FORCE_DESKTOP_VIEW_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new Event(ADMIN_DISPLAY_PREFERENCES_EVENT))
}
