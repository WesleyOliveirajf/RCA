import { RefreshCw, AlertCircle } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { StatsCards, SyncStatusBar } from '@/components/dashboard/StatsCards'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { Timeline } from '@/components/dashboard/Timeline'

export function DashboardPage() {
  const { funil, timeline, contatosHoje, syncStatus, loading, error, usingFallback, refetch } = useDashboard()

  if (loading && !funil) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        <RefreshCw size={16} className="mr-2 animate-spin" />
        Carregando dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Visão geral do pipeline de reativação</p>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus && <SyncStatusBar syncStatus={syncStatus} />}
          <button
            onClick={refetch}
            disabled={loading}
            className="btn-ghost btn-sm text-slate-400 hover:text-rca-primary"
            title="Atualizar"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {usingFallback && !error && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle size={14} />
          API indisponível — exibindo dados direto do Supabase.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <StatsCards funil={funil} contatosHoje={contatosHoje} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FunnelChart etapas={funil?.etapas} />
        <Timeline atividades={timeline} />
      </div>
    </div>
  )
}
