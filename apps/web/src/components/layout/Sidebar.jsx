import { NavLink, useLocation } from 'react-router-dom'
import {
  Kanban,
  LayoutDashboard,
  Users,
  UserCog,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const PERFIL_NIVEL = { vendedor: 1, supervisor: 2, admin: 3, superadmin: 4 }

const navItems = [
  {
    to: '/',
    label: 'Pipeline',
    icon: Kanban,
    minPerfil: 'vendedor',
    description: 'Kanban de reativação',
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: Users,
    minPerfil: 'vendedor',
    description: 'Base de clientes',
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    minPerfil: 'supervisor',
    description: 'Métricas e relatórios',
  },
  {
    to: '/qualificacao',
    label: 'Qualificação',
    icon: Star,
    minPerfil: 'supervisor',
    description: 'Aprovar leads',
  },
  {
    to: '/usuarios',
    label: 'Usuários',
    icon: UserCog,
    minPerfil: 'admin',
    description: 'Gerenciar usuários',
  },
  {
    to: '/config',
    label: 'Configurações',
    icon: Settings,
    minPerfil: 'admin',
    description: 'Parâmetros do sistema',
  },
]

export function Sidebar({ collapsed, onToggle }) {
  const { profile } = useAuth()
  const location = useLocation()
  const nivel = PERFIL_NIVEL[profile?.perfil] ?? 0

  const visibleItems = navItems.filter(
    (item) => nivel >= PERFIL_NIVEL[item.minPerfil]
  )

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-screen flex-col
          gradient-sidebar text-white
          transition-all duration-300 ease-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        `}
      >
        {/* ── Logo ── */}
        <div className="flex h-header items-center gap-3 px-5 border-b border-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-lg shadow-indigo-900/20">
            <Zap size={18} className="text-indigo-200" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="text-base font-bold tracking-tight text-white">
                RCA
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-300/80">
                Reativação Comercial
              </p>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map(({ to, label, icon: Icon, description }, index) => {
            const isActive =
              to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                className={`
                  group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                  text-sm font-medium transition-all duration-200
                  animate-slide-right
                  ${isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-indigo-200/70 hover:bg-white/8 hover:text-white'
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-300 animate-scale-in" />
                )}

                <Icon
                  size={20}
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-white' : 'group-hover:scale-110'
                  }`}
                />

                {!collapsed && (
                  <div className="overflow-hidden">
                    <span className="block">{label}</span>
                    {isActive && (
                      <span className="block text-[10px] font-normal text-indigo-300/70 animate-fade-in">
                        {description}
                      </span>
                    )}
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="
                    absolute left-full ml-3 hidden rounded-lg bg-slate-900 px-3 py-1.5
                    text-xs text-white shadow-xl
                    group-hover:block
                    whitespace-nowrap z-50
                  ">
                    {label}
                    <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* ── Collapse toggle (desktop only) ── */}
        <div className="hidden lg:block border-t border-white/10 p-3">
          <button
            onClick={onToggle}
            className="
              flex w-full items-center justify-center gap-2 rounded-xl
              px-3 py-2 text-xs font-medium text-indigo-300/60
              hover:bg-white/8 hover:text-indigo-200
              transition-all duration-200
            "
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>

        {/* ── User info at bottom ── */}
        {!collapsed && profile && (
          <div className="border-t border-white/10 p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-indigo-200">
                {profile.nome?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {profile.nome}
                </p>
                <p className="truncate text-[11px] text-indigo-300/60 capitalize">
                  {profile.perfil}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
