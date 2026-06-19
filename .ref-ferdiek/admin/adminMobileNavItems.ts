import type { ComponentType } from 'react'
import {
  FiBarChart2,
  FiBox,
  FiGlobe,
  FiGrid,
  FiImage,
  FiLayers,
  FiMail,
  FiSettings,
  FiUsers,
} from 'react-icons/fi'

export type AdminMobileNavItem = {
  to: string
  label: string
  shortLabel?: string
  description?: string
  icon: ComponentType<{ 'aria-hidden'?: boolean; size?: number }>
  end?: boolean
  ownerOnly?: boolean
  badge?: number
}

export function buildAdminMobileNavItems(newTodayOrdersCount: number, userRole: 'OWNER' | 'EMPLOYEE'): AdminMobileNavItem[] {
  const items: AdminMobileNavItem[] = [
    { to: '/admin', label: 'Dashboard', shortLabel: 'Home', description: 'Overzicht', icon: FiGrid, end: true },
    {
      to: '/admin/orders',
      label: 'Bestellingen',
      shortLabel: 'Orders',
      description: 'Nieuwe orders',
      icon: FiLayers,
      badge: newTodayOrdersCount,
    },
    { to: '/admin/customers', label: 'Klanten', shortLabel: 'Klanten', description: 'Klantgegevens', icon: FiUsers },
    { to: '/admin/products', label: 'Producten', shortLabel: 'Producten', description: 'Catalogus', icon: FiBox },
    { to: '/admin/media', label: 'Media', shortLabel: 'Media', description: 'Afbeeldingen', icon: FiImage },
    { to: '/admin/seo', label: "Pagina's", shortLabel: "Pagina's", description: 'SEO', icon: FiGlobe },
    { to: '/admin/analytics', label: 'Analytics', shortLabel: 'Analytics', description: 'Statistieken', icon: FiBarChart2 },
    { to: '/admin/newsletter', label: 'Nieuwsbrief', shortLabel: 'Nieuws', description: 'Mailings', icon: FiMail },
    { to: '/admin/settings', label: 'Instellingen', shortLabel: 'Instell.', description: 'Bedrijf', icon: FiSettings },
  ]

  if (userRole === 'OWNER') {
    items.push(
      { to: '/admin/emails', label: 'E-mails', shortLabel: 'E-mails', description: 'Templates', icon: FiMail, ownerOnly: true },
      { to: '/admin/integrations', label: 'Integraties', shortLabel: 'Koppeling', description: 'Mollie', icon: FiSettings, ownerOnly: true },
      { to: '/admin/team', label: 'Team', shortLabel: 'Team', description: 'Medewerkers', icon: FiUsers, ownerOnly: true },
    )
  }

  return items
}
