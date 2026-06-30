import { Phone, ArrowRight, Star, RefreshCw, CheckCircle, MessageSquare } from 'lucide-react'

const TIPO_CONFIG = {
  contato:       { icon: Phone,         color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  movimentacao:  { icon: ArrowRight,    color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  qualificacao:  { icon: Star,          color: 'text-teal-500',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  sync:          { icon: RefreshCw,     color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200' },
  pos_venda:     { icon: CheckCircle,   color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-200' },
  default:       { icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 60)  return `${mins}min atrás`
  if (hours < 24) return `${hours}h atrás`
  return `${days}d atrás`
}

export function Timeline({ atividades = [] }) {
  return (
    <div className="rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
      <h3 className="mb-1 text-sm font-semibold text-slate-800">Atividades recentes</h3>
      <p className="mb-4 text-xs text-slate-400">Últimas ações no sistema</p>

      {atividades.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Nenhuma atividade recente</p>
      ) : (
        <ul className="space-y-0">
          {atividades.map((a, i) => {
            const cfg = TIPO_CONFIG[a.tipo] ?? TIPO_CONFIG.default
            const Icon = cfg.icon
            const isLast = i === atividades.length - 1
            return (
              <li key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-slate-100 my-1" />}
                </div>
                <div className={`pb-4 ${isLast ? 'pb-0' : ''} min-w-0`}>
                  <p className="text-sm text-slate-700 leading-snug">{a.descricao}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {a.usuario} · {relativeTime(a.data)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
