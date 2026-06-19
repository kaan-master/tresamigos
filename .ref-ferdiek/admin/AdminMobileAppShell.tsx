import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import logo from '../assets/logo.png'
import { buildAdminMobileNavItems } from './adminMobileNavItems'

type AdminMobileAppShellProps = {
  title: string
  userRole: 'OWNER' | 'EMPLOYEE'
  newTodayOrdersCount: number
  onCloseShop: () => void
  onOrdersNavClick: () => void
  children: ReactNode
}

function AdminMobileHub({
  items,
  onOrdersNavClick,
}: {
  items: ReturnType<typeof buildAdminMobileNavItems>
  onOrdersNavClick: () => void
}) {
  return (
    <section className="admin-pda-hub" aria-label="Backoffice taken">
      <div className="admin-pda-hub-intro">
        <p className="product-label">Backoffice</p>
        <h2>Kies een onderdeel</h2>
      </div>
      <div className="admin-pda-block-grid">
        {items.map((item) => (
          <NavLink
            key={item.to}
            end={item.end}
            to={item.to}
            className={({ isActive }) => `admin-pda-block${isActive ? ' is-active' : ''}`}
            onClick={item.to === '/admin/orders' ? onOrdersNavClick : undefined}
          >
            <span className="admin-pda-block-icon" aria-hidden="true">
              <item.icon size={26} />
            </span>
            <strong>{item.shortLabel ?? item.label}</strong>
            {item.badge && item.badge > 0 ? <span className="admin-pda-block-badge">{item.badge}</span> : null}
          </NavLink>
        ))}
      </div>
    </section>
  )
}

export default function AdminMobileAppShell({
  title,
  userRole,
  newTodayOrdersCount,
  onCloseShop,
  onOrdersNavClick,
  children,
}: AdminMobileAppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = buildAdminMobileNavItems(newTodayOrdersCount, userRole)
  const isDashboard = location.pathname === '/admin' || location.pathname === '/admin/'
  const showPageContent = !isDashboard

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/admin')
  }

  return (
    <>
      <header className="admin-pda-appbar">
        <div className="admin-pda-appbar-main">
          {isDashboard ? (
            <Link className="admin-pda-brand" to="/admin" aria-label="Admin home">
              <img src={logo} alt="" className="brand-logo" />
              <span>Backoffice</span>
            </Link>
          ) : (
            <button type="button" className="admin-pda-back" onClick={handleBack} aria-label="Terug">
              <FiArrowLeft aria-hidden="true" />
              Terug
            </button>
          )}
          <div className="admin-pda-appbar-title">
            <strong>{isDashboard ? 'Home' : title}</strong>
          </div>
          <button type="button" className="admin-pda-icon-button" onClick={onCloseShop} aria-label="Terug naar shop">
            <FiArrowLeft aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="admin-content admin-pda-content">
        {isDashboard ? <AdminMobileHub items={navItems} onOrdersNavClick={onOrdersNavClick} /> : null}
        {showPageContent ? children : null}
      </div>
    </>
  )
}

export { buildAdminMobileNavItems }
