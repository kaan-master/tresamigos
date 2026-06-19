import { useCallback, useEffect, useState } from 'react'
import {
  ADMIN_DISPLAY_PREFERENCES_EVENT,
  readForceDesktopView,
  readMobileAppMode,
  writeForceDesktopView,
  writeMobileAppMode,
} from './adminDisplayPreferences'

export function useAdminMobileViewport() {
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(max-width: 780px)').matches
  })

  useEffect(() => {
    const media = window.matchMedia('(max-width: 780px)')
    const handleChange = () => setIsMobileViewport(media.matches)
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return isMobileViewport
}

export function useAdminDisplayPreferences() {
  const isMobileViewport = useAdminMobileViewport()
  const [mobileAppMode, setMobileAppModeState] = useState(() => readMobileAppMode(isMobileViewport))
  const [forceDesktopView, setForceDesktopViewState] = useState(readForceDesktopView)

  useEffect(() => {
    setMobileAppModeState(readMobileAppMode(isMobileViewport))
  }, [isMobileViewport])

  useEffect(() => {
    const sync = () => {
      setMobileAppModeState(readMobileAppMode(isMobileViewport))
      setForceDesktopViewState(readForceDesktopView())
    }

    window.addEventListener(ADMIN_DISPLAY_PREFERENCES_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ADMIN_DISPLAY_PREFERENCES_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [isMobileViewport])

  const setMobileAppMode = useCallback((enabled: boolean) => {
    writeMobileAppMode(enabled)
    setMobileAppModeState(enabled)
  }, [])

  const setForceDesktopView = useCallback((enabled: boolean) => {
    writeForceDesktopView(enabled)
    setForceDesktopViewState(enabled)
  }, [])

  return {
    mobileAppMode,
    forceDesktopView,
    isMobileViewport,
    setMobileAppMode,
    setForceDesktopView,
  }
}
