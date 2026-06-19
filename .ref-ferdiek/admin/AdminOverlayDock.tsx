import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiChevronUp, FiLogOut, FiMonitor, FiSettings, FiSmartphone, FiX } from 'react-icons/fi'
import { buildAdminMobileNavItems } from './adminMobileNavItems'
import { useAdminDisplayPreferences } from './useAdminDisplayPreferences'

type AdminOverlayDockProps = {
  active: boolean
  userName: string
  userRole?: string
  newTodayOrdersCount?: number
  onToggle: () => void
  onLogout: () => void
  onOrdersNavClick?: () => void
}

export default function AdminOverlayDock({
  active,
  userName,
  userRole,
  newTodayOrdersCount = 0,
  onToggle,
  onLogout,
  onOrdersNavClick,
}: AdminOverlayDockProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { mobileAppMode, forceDesktopView, isMobileViewport, setMobileAppMode, setForceDesktopView } = useAdminDisplayPreferences()
  const useCompactMenu = active && mobileAppMode && isMobileViewport && !forceDesktopView
  const resolvedRole = userRole === 'OWNER' ? 'OWNER' : 'EMPLOYEE'
  const navItems = buildAdminMobileNavItems(newTodayOrdersCount, resolvedRole)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  useEffect(() => {
    if (!active) {
      setMenuOpen(false)
    }
  }, [active])

  const handleTriggerClick = () => {
    if (useCompactMenu) {
      setMenuOpen((current) => !current)
      return
    }

    if (active) {
      onToggle()
      return
    }

    setMenuOpen((current) => !current)
  }

  const dockClassName = [
    'admin-overlay-dock',
    active ? 'is-active' : '',
    useCompactMenu ? 'is-mobile-menu' : '',
    useCompactMenu && menuOpen ? 'is-expanded' : '',
    useCompactMenu && !menuOpen ? 'is-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={dockClassName} ref={rootRef}>
      {menuOpen ? (
        <div className={`admin-overlay-dock-menu${useCompactMenu ? ' is-mobile-sheet' : ''}`} role="menu">
          {useCompactMenu ? (
            <>
              <div className="admin-overlay-dock-menu-head">
                <strong>Menu</strong>
                <button type="button" className="admin-overlay-dock-menu-close" onClick={() => setMenuOpen(false)} aria-label="Sluit menu">
                  <FiX aria-hidden />
                </button>
              </div>
              <div className="admin-overlay-dock-nav-grid">
                {navItems.map((item) => (
                  <NavLink
                    key={`dock-${item.to}`}
                    end={item.end}
                    to={item.to}
                    className={({ isActive }) => `admin-overlay-dock-nav-tile${isActive ? ' is-active' : ''}`}
                    onClick={() => {
                      if (item.to === '/admin/orders') {
                        onOrdersNavClick?.()
                      }
                      setMenuOpen(false)
                    }}
                  >
                    <span className="admin-overlay-dock-nav-tile-icon" aria-hidden="true">
                      <item.icon size={22} />
                    </span>
                    <span>{item.shortLabel ?? item.label}</span>
                    {item.badge && item.badge > 0 ? <span className="admin-overlay-dock-nav-badge">{item.badge}</span> : null}
                  </NavLink>
                ))}
              </div>
              <div className="admin-overlay-dock-menu-divider" role="presentation" />
            </>
          ) : null}

          {!useCompactMenu ? (
            <button type="button" className="admin-overlay-dock-menu-item" onClick={() => { setMenuOpen(false); onToggle() }}>
              {active ? <FiX aria-hidden /> : <FiSettings aria-hidden />}
              {active ? 'Terug naar site' : 'Open backoffice'}
            </button>
          ) : (
            <button type="button" className="admin-overlay-dock-menu-item" onClick={() => { setMenuOpen(false); onToggle() }}>
              <FiX aria-hidden />
              Terug naar site
            </button>
          )}

          {!useCompactMenu ? <div className="admin-overlay-dock-menu-divider" role="presentation" /> : null}

          <label className="admin-overlay-dock-toggle">
            <span className="admin-overlay-dock-toggle-copy">
              <FiSmartphone aria-hidden />
              Mobiele app-modus
            </span>
            <input
              type="checkbox"
              checked={mobileAppMode}
              onChange={(event) => setMobileAppMode(event.target.checked)}
            />
          </label>
          <label className={`admin-overlay-dock-toggle${!isMobileViewport ? ' is-disabled' : ''}`}>
            <span className="admin-overlay-dock-toggle-copy">
              <FiMonitor aria-hidden />
              Desktopweergave
            </span>
            <input
              type="checkbox"
              checked={forceDesktopView}
              onChange={(event) => setForceDesktopView(event.target.checked)}
              disabled={!isMobileViewport}
            />
          </label>

          <div className="admin-overlay-dock-menu-divider" role="presentation" />

          <button
            type="button"
            className="admin-overlay-dock-menu-item is-danger"
            onClick={() => {
              setMenuOpen(false)
              onLogout()
            }}
          >
            <FiLogOut aria-hidden />
            Uitloggen
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="admin-overlay-dock-trigger"
        onClick={handleTriggerClick}
        aria-expanded={menuOpen}
        aria-label={useCompactMenu ? (menuOpen ? 'Sluit menu' : 'Open menu') : active ? 'Sluit backoffice' : 'Admin menu'}
      >
        <span className="admin-overlay-dock-avatar">{userName.trim().charAt(0).toUpperCase() || 'A'}</span>
        <span className="admin-overlay-dock-copy">
          <strong>{active ? (useCompactMenu ? 'Menu' : 'Backoffice') : 'Admin'}</strong>
          <small>{userRole === 'OWNER' ? 'Eigenaar' : 'Medewerker'}</small>
        </span>
        <FiChevronUp aria-hidden className={`admin-overlay-dock-chevron${menuOpen ? ' is-open' : ''}`} />
      </button>
    </div>
  )
}
