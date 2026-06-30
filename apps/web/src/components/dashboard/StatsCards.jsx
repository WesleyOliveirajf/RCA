import { Users, TrendingUp, DollarSign, PhoneCall, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const CARDS_CONFIG = [
  {
    key: 'total_clientes',
    label: 'Clientes ativos',
    icon: Users,
    color: 'bg-indigo-50 text-indigo-600',
    format: (v) => v ?? 0,
  },
  {
    key: 'taxa_conversao',
    label: 'Taxa de conversão',
    icon: TrendingUp,
    color: 'bg-teal-50 text-teal-600',
    format: (v) => `${(v ?? 0).toFixed(1)}%`,
  },
  {
    key: 'valor_pipeline',
    label: 'Valor em pipeline',
    icon: DollarSign,
    color: 'bg-amber-50 text-amber-600',
    format: (v) => formatCurrency(v),
  },
  {
    key: 'contatos_hoje',
    label: 'Contatos hoje',
    icon: PhoneCall,
    color: 'bg-sky-50 text-sky-600',
    format: (v) => v ?? 0,
  },
]

export function StatsCards({ funil, contatosHoje }) {
  const values = {
    total_clientes: funil?.total_clientes,
    taxa_conversao: funil?.taxa_conversao,
    valor_pipeline: funil?.valor_pipeline,
    contatos_hoje:  contatosHoje,
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS_CONFIG.map(({ key, label, icon: Icon, color, format }) => (
        <div
          key={key}
          className="group flex items-center gap-4 rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm transition-shadow hover:shadow-soft-md"
        >
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{format(values[key])}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SyncStatusBar({ syncStatus }) {
  if (!syncStatus) return null
  const ok = syncStatus.status === 'sucesso'
  const hora = syncStatus.ultima_sync
    ? new Date(syncStatus.ultima_sync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '—'
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      <RefreshCw size={12} className={ok ? 'text-green-500' : 'text-red-500'} />
      <span>
        Última sincronização: <strong>{hora}</strong>
        {ok && <span className="ml-2">· {syncStatus.novos} novos · {syncStatus.atualizados} atualizados</span>}
      </span>
    </div>
  )
}
