import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LogOut,
  Bell,
  Menu,
  Search,
  ChevronRight,
  User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const ROUTE_TITLES = {
  '/': 'Pipeline',
  '/clientes': 'Clientes',
  '/dashboard': 'Dashboard',
  '/qualificacao': 'Em Análise',
  '/usuarios': 'Usuários',
  '/config': 'Configurações',
}

function getBreadcrumbs(pathname) {
  if (pathname === '/') return [{ label: 'Pipeline' }]

  const segments = pathname.split('/').filter(Boolean)
  const crumbs = []

  segments.forEach((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const title = ROUTE_TITLES[path]

    if (title) {
      crumbs.push({ label: title, path })
    } else {
      // Dynamic segment (e.g., client ID) — use shortened UUID
      crumbs.push({ label: seg.length > 8 ? seg.slice(0, 8) + '…' : seg })
    }
  })

  return crumbs
}

export function Header({ onMenuToggle }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)
  const [notifications] = useState(3) // TODO: replace with real data
  const breadcrumbs = getBreadcrumbs(location.pathname)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (!e.target.closest('[data-profile-dropdown]')) {
        setShowProfile(false)
      }
    }
    if (showProfile) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showProfile])

  return (
    <header className="
      z-20 shrink-0
      flex h-header items-center justify-between gap-4
      border-b border-slate-100 bg-white/80
      backdrop-blur-lg
      px-4 sm:px-6
    ">
      {/* ── Left: Menu button + Breadcrumb ── */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="btn-ghost btn-icon lg:hidden"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
          <span className="font-medium text-slate-400">RCA</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-300" />
              {crumb.path && i < breadcrumbs.length - 1 ? (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="font-medium text-slate-500 hover:text-rca-primary transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="font-semibold text-slate-800">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* ── Right: Search, Notifications, Profile ── */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Quick search button */}
        <button
          className="btn-ghost btn-icon hidden sm:flex"
          aria-label="Pesquisar"
        >
          <Search size={18} className="text-slate-400" />
        </button>

        {/* Notifications */}
        <button
          className="btn-ghost btn-icon relative"
          aria-label="Notificações"
        >
          <Bell size={18} className="text-slate-400" />
          {notifications > 0 && (
            <span className="
              absolute -right-0.5 -top-0.5
              flex h-4 min-w-[16px] items-center justify-center
              rounded-full bg-red-500 px-1
              text-[10px] font-bold text-white
              animate-scale-in
            ">
              {notifications}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative" data-profile-dropdown>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="
              flex items-center gap-2.5 rounded-xl px-2 py-1.5
              hover:bg-slate-50 transition-colors
            "
          >
            <div className="
              flex h-8 w-8 items-center justify-center rounded-full
              gradient-primary text-xs font-bold text-white
              shadow-sm shadow-indigo-200
            ">
              {profile?.nome?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">
                {profile?.username || profile?.nome || 'Usuário'}
              </p>
              <p className="text-[11px] text-slate-400 capitalize leading-tight">
                {profile?.perfil || '—'}
              </p>
            </div>
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="
              absolute right-0 top-full mt-2
              w-56 rounded-xl bg-white p-1.5
              shadow-soft-xl border border-slate-100
              animate-fade-in-down
              z-50
            ">
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <p className="text-sm font-semibold text-slate-800">
                  {profile?.nome}
                </p>
                <p className="text-xs text-slate-400">{profile?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfile(false)
                  navigate('/config')
                }}
                className="
                  flex w-full items-center gap-2.5 rounded-lg px-3 py-2
                  text-sm text-slate-600 hover:bg-slate-50 transition-colors
                "
              >
                <User size={16} />
                Meu perfil
              </button>

              <button
                onClick={() => {
                  setShowProfile(false)
                  signOut()
                }}
                className="
                  flex w-full items-center gap-2.5 rounded-lg px-3 py-2
                  text-sm text-red-500 hover:bg-red-50 transition-colors
                "
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
