import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/auth'
import { api } from '../lib/api'
import FittyChat from '../components/FittyChat'

interface NavItem { to: string; label: string; icon: string; end?: boolean; ownerOnly?: boolean }
interface NavGroup { label: string; icon: string; items: NavItem[] }
interface PortalPermissions { allowedPages: string[] }

const navGroups: NavGroup[] = [
  {
    label: 'Dashboard', icon: '🏠',
    items: [
      { to: '/', label: 'Panoramica', icon: '🏠', end: true },
      { to: '/kpi', label: 'KPI Avanzati', icon: '📈' },
    ],
  },
  {
    label: 'Soci', icon: '👥',
    items: [
      { to: '/members', label: 'Anagrafiche', icon: '👤' },
      { to: '/plans', label: 'Abbonamenti', icon: '💳' },
      { to: '/contracts', label: 'Contratti', icon: '📋' },
      { to: '/campaigns', label: 'Campagne Email', icon: '✉️' },
      { to: '/churn', label: 'Churn Predictor', icon: '📉' },
    ],
  },
  {
    label: 'Operativo', icon: '📅',
    items: [
      { to: '/classes', label: 'Classi & Sessioni', icon: '🗓️' },
      { to: '/staff', label: 'Staff', icon: '🪪' },
      { to: '/zkteco', label: 'Controllo Accessi', icon: '🚪' },
      { to: '/machines', label: 'Macchinari', icon: '🏋️' },
    ],
  },
  {
    label: 'Amministrazione', icon: '💶',
    items: [
      { to: '/treasury', label: 'Tesoreria', icon: '🏦' },
      { to: '/invoices', label: 'Fatture', icon: '🧾' },
      { to: '/payments', label: 'Pagamenti', icon: '💸' },
      { to: '/forecast', label: 'AI Previsioni', icon: '🔮' },
    ],
  },
  {
    label: 'Salute & Fitness', icon: '💪',
    items: [
      { to: '/nutrition', label: 'Nutrizione', icon: '🥗' },
      { to: '/aicoach', label: 'AI Coach', icon: '🤖' },
      { to: '/workouts', label: 'Schede & Sessioni', icon: '📋' },
      { to: '/recovery', label: 'Recovery Score', icon: '🫀' },
      { to: '/bodyscore', label: 'Body Score', icon: '⚡' },
      { to: '/healthsync', label: 'Health Sync', icon: '⌚' },
      { to: '/wellness', label: 'Wellness Hub', icon: '🌿' },
      { to: '/videos', label: 'Video Esercizi', icon: '▶️' },
      { to: '/computervision', label: 'Analisi Postura', icon: '👁️' },
      { to: '/sportspsychology', label: 'Psicologia Sportiva', icon: '🧠' },
    ],
  },
  {
    label: 'Engagement', icon: '🏆',
    items: [
      { to: '/gamification', label: 'FitPoints', icon: '⭐' },
      { to: '/challenges', label: 'Sfide & Loyalty', icon: '🥇' },
      { to: '/courses', label: 'Corsi & Live', icon: '🎓' },
      { to: '/referral', label: 'Referral', icon: '🔗' },
      { to: '/fitchain', label: 'FitChain Wallet', icon: '💎' },
    ],
  },
  {
    label: 'Shop & Servizi', icon: '🛍️',
    items: [
      { to: '/marketplace', label: 'Marketplace', icon: '🏪' },
      { to: '/servicemarket', label: 'Servizi Premium', icon: '✨' },
      { to: '/merch', label: 'Merchandise', icon: '👕' },
    ],
  },
  {
    label: 'Report', icon: '📊',
    items: [
      { to: '/reports', label: 'Report & Export', icon: '📄' },
      { to: '/insights', label: 'Premium Insights', icon: '💡' },
      { to: '/franchise', label: 'Multi-sede', icon: '🏢' },
      { to: '/corporate', label: 'Corporate Wellness', icon: '🏛️' },
    ],
  },
  {
    label: 'Impostazioni', icon: '⚙️',
    items: [
      { to: '/gym', label: 'Palestra', icon: '🏟️' },
      { to: '/whitelabel', label: 'White Label', icon: '🎨' },
      { to: '/technogym', label: 'Technogym', icon: '🔌' },
      { to: '/lifefitness', label: 'Life Fitness', icon: '🚴' },
      { to: '/arvr', label: 'AR/VR Classi', icon: '🥽' },
      { to: '/localization', label: 'Localizzazione', icon: '🌍' },
      { to: '/notifications', label: 'Notifiche', icon: '🔔' },
      { to: '/compliance', label: 'GDPR & Privacy', icon: '🔒' },
      { to: '/users', label: 'Utenti & Permessi', icon: '👤', ownerOnly: true },
    ],
  },
]

interface GymBrand {
  name: string
  whiteLabel: { brandName: string | null; logoUrl: string | null; primaryColorHex: string | null }
}

function getActiveGroup(pathname: string): string {
  for (const g of navGroups) {
    if (g.items.some(i => i.end ? pathname === i.to : pathname.startsWith(i.to))) return g.label
  }
  return navGroups[0].label
}

// ── Sidebar content (shared between desktop aside and mobile drawer) ──────────

function SidebarContent({
  openGroups,
  toggleGroup,
  brandName,
  logoUrl,
  primaryColor,
  onNavigate,
  onLogout,
  allowedPages,
}: {
  openGroups: Set<string>
  toggleGroup: (l: string) => void
  brandName: string
  logoUrl: string | null
  primaryColor: string
  onNavigate?: () => void
  onLogout: () => void
  allowedPages: string[] | null
}) {
  const location = useLocation()

  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100 shrink-0">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {logoUrl
            ? <img src={logoUrl} alt="logo" className="h-full w-full object-contain p-0.5" />
            : <span className="text-sm font-black text-white">{brandName[0]?.toUpperCase()}</span>
          }
        </div>
        <span className="text-base font-bold text-slate-800 truncate">{brandName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navGroups.map((group) => {
          // Filter items: ownerOnly hidden for non-owners; allowedPages restricts sub-accounts
          const isOwner = allowedPages === null
          const visibleItems = (allowedPages === null ? group.items : group.items.filter(i => allowedPages.includes(i.to)))
            .filter(i => !i.ownerOnly || isOwner)
          if (visibleItems.length === 0) return null

          const isOpen = openGroups.has(group.label)
          const isGroupActive = visibleItems.some(i =>
            i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)
          )

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition
                  ${isGroupActive
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span>{group.icon}</span>
                  {group.label}
                </span>
                <span className="text-xs opacity-60" style={{ transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  ›
                </span>
              </button>

              {isOpen && (
                <div className="ml-3 mt-0.5 border-l border-slate-100 pl-2">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`
                      }
                    >
                      <span className="text-sm opacity-70">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2 shrink-0">
        <button
          onClick={onLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          ⎋ Esci
        </button>
      </div>
    </>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { claims, logout } = useAuth()

  const [drawerOpen, setDrawerOpen] = useState(false)

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    return new Set([getActiveGroup(location.pathname)])
  })

  useEffect(() => {
    const active = getActiveGroup(location.pathname)
    setOpenGroups(prev => new Set([...prev, active]))
    setDrawerOpen(false) // close mobile drawer on navigation
  }, [location.pathname])

  function toggleGroup(label: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  const { data: gymData } = useQuery({
    queryKey: ['gym'],
    queryFn: () => api.get<GymBrand>('/api/v1/gym'),
    staleTime: 5 * 60 * 1000,
  })
  const gym = gymData?.data

  // null = loading/owner (no restriction), [] = no pages allowed, [...] = allowed list
  const { data: permsData } = useQuery({
    queryKey: ['portal-permissions'],
    queryFn: () => api.get<PortalPermissions>('/me/portal-permissions'),
    staleTime: 5 * 60 * 1000,
  })
  // Empty allowedPages from backend means GymOwner → show all (null)
  const allowedPages: string[] | null =
    permsData?.data?.allowedPages?.length
      ? permsData.data.allowedPages
      : null
  const brandName = gym?.whiteLabel?.brandName || gym?.name || 'Oplyfit'
  const logoUrl = gym?.whiteLabel?.logoUrl ?? null
  const primaryColor = gym?.whiteLabel?.primaryColorHex || '#2563eb'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const sidebarProps = {
    openGroups,
    toggleGroup,
    brandName,
    logoUrl,
    primaryColor,
    onLogout: handleLogout,
    allowedPages,
  }

  return (
    <div className="flex min-h-full">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-56 flex-col border-r border-slate-200 bg-white shrink-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent
          {...sidebarProps}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8 md:py-3.5 shrink-0">

          {/* Hamburger (mobile only) */}
          <button
            className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            onClick={() => setDrawerOpen(true)}
            aria-label="Apri menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect y="3" width="20" height="2" rx="1" />
              <rect y="9" width="20" height="2" rx="1" />
              <rect y="15" width="20" height="2" rx="1" />
            </svg>
          </button>

          {/* Brand name on mobile (when sidebar is hidden) */}
          <span className="md:hidden text-sm font-bold text-slate-700 truncate">{brandName}</span>

          {/* User info */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-slate-800">{claims?.email}</div>
              <div className="text-xs text-slate-400">{claims?.role}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shrink-0">
              {claims?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Fitty — floating AI chat (visible su tutte le pagine) */}
      <FittyChat />
    </div>
  )
}
