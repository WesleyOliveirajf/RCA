import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const ETAPA_CORES = {
  inativos:         '#8b5cf6',
  primeiro_contato: '#3b82f6',
  em_analise:       '#f97316',
  lead_qualificado: '#14b8a6',
  nutricao:         '#0ea5e9',
  negociacao:       '#f59e0b',
  pos_venda:        '#22c55e',
}

const ETAPA_LABELS = {
  inativos:         'Inativos',
  primeiro_contato: '1º Contato',
  em_analise:       'Em Análise',
  lead_qualificado: 'Qualificado',
  nutricao:         'Nutrição',
  negociacao:       'Negociação',
  pos_venda:        'Pós-venda',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-soft-md text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.label}</p>
      <p className="text-slate-600">{d.total} {d.total === 1 ? 'lead' : 'leads'}</p>
      {d.valor_medio > 0 && (
        <p className="text-slate-500 mt-0.5">Ticket médio: {formatCurrency(d.valor_medio)}</p>
      )}
    </div>
  )
}

export function FunnelChart({ etapas = [] }) {
  const data = etapas.map((e) => ({
    etapa:      e.etapa,
    label:      ETAPA_LABELS[e.etapa] ?? e.etapa,
    total:      e.total,
    valor_medio: e.valor_medio,
    color:      ETAPA_CORES[e.etapa] ?? '#94a3b8',
  }))

  return (
    <div className="rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
      <h3 className="mb-1 text-sm font-semibold text-slate-800">Funil por etapa</h3>
      <p className="mb-4 text-xs text-slate-400">Quantidade de leads em cada fase</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.etapa} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
