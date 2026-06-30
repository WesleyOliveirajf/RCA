import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Zap } from 'lucide-react'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface gap-4">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-indigo-200 animate-pulse-soft">
            <Zap size={28} className="text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-indigo-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm font-medium text-slate-600">Carregando Sistema RCA</p>
          <p className="mt-0.5 text-xs text-slate-400">Reativação Comercial Automatizada</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
