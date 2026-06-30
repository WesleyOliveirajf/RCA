import { useState } from 'react'
import { Star, CheckCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { useQualificacao } from '@/hooks/useQualificacao'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/common/Badge'
import { ScoreForm } from '@/components/qualificacao/ScoreForm'
import { EmptyState } from '@/components/common/EmptyState'

export function QualificacaoPage() {
  const {
    pendentes,
    totalPendentes,
    totalAprovados,
    totalQualificacoes,
    loading,
    error,
    registrar,
    refetch,
  } = useQualificacao()
  const [expandido, setExpandido] = useState(null)
  const [salvos, setSalvos] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  async function handleSubmit(cardId, qualId, data) {
    try {
      setSubmitting(true)
      setSubmitError(null)
      await registrar(cardId, data)
      setSalvos((prev) => new Set([...prev, qualId]))
      setExpandido(null)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function getScoreColor(score) {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  if (loading && pendentes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        <RefreshCw size={16} className="mr-2 animate-spin" />
        Carregando qualificações...
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Qualificação de Leads</h1>
          <p className="text-sm text-slate-500">Avalie e aprove leads para avançar no pipeline</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="btn-ghost btn-sm text-slate-400 hover:text-rca-primary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Pendentes" value={totalPendentes} color="text-amber-600 bg-amber-50" />
        <StatCard icon={CheckCircle} label="Aprovados" value={totalAprovados} color="text-green-600 bg-green-50" />
        <StatCard icon={Star} label="Total" value={totalQualificacoes} color="text-indigo-600 bg-indigo-50" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Aguardando avaliação ({pendentes.length})
        </h2>

        {pendentes.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Nenhum lead pendente"
            description="Todos os leads foram avaliados."
          />
        ) : (
          <div className="space-y-3">
            {pendentes.map((q) => {
              const nome = q.cliente?.nome_fantasia ?? q.cliente?.razao_social ?? `Card ${q.card_id}`
              const isSalvo = salvos.has(q.id)
              const isOpen  = expandido === q.id
              return (
                <div key={q.id} className="rounded-rca-lg border border-slate-100 bg-white shadow-soft-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${getScoreColor(q.score_total)}`}>
                        {q.score_total}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{nome}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(q.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {q.cliente?.valor_historico && (
                        <span className="hidden sm:block text-sm font-medium text-slate-700">
                          {formatCurrency(q.cliente.valor_historico)}
                        </span>
                      )}
                      {isSalvo ? (
                        <Badge variant="success">Salvo</Badge>
                      ) : (
                        <button
                          onClick={() => setExpandido(isOpen ? null : q.id)}
                          className="rounded-lg bg-rca-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-rca-primary-dark transition-colors"
                        >
                          {isOpen ? 'Fechar' : 'Avaliar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {q.observacoes && !isOpen && (
                    <div className="border-t border-slate-50 px-4 pb-3">
                      <p className="text-xs text-slate-500 italic">"{q.observacoes}"</p>
                    </div>
                  )}

                  {isOpen && (
                    <div className="border-t border-slate-100 p-4">
                      <ScoreForm
                        loading={submitting}
                        onSubmit={(data) => handleSubmit(q.card_id, q.id, data)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-rca-lg border border-slate-100 bg-white p-4 shadow-soft-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
