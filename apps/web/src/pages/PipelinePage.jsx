import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { Kanban, Clock } from 'lucide-react'

export function PipelinePage() {
  const now = new Date()
  const greeting =
    now.getHours() < 12 ? 'Bom dia' :
    now.getHours() < 18 ? 'Boa tarde' :
    'Boa noite'

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Kanban size={22} className="text-rca-primary" />
            <h1 className="text-xl font-bold text-slate-900">Pipeline de Reativação</h1>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {greeting}! Gerencie seus leads arrastando os cards entre as etapas.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={13} />
          Última sync: 25/06/2026 às 10:00
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <KanbanBoard />
    </div>
  )
}
