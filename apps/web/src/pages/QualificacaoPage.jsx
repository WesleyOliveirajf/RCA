import { useState } from 'react'
import { Star, CheckCircle, Clock, RefreshCw, AlertCircle, MessageSquare, User, ClipboardCheck } from 'lucide-react'
import { useQualificacao } from '@/hooks/useQualificacao'
import { formatCurrency, formatDate } from '@/lib/utils'
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

  async function handleSubmit(cardId, data) {
    try {
      setSubmitting(true)
      setSubmitError(null)
      await registrar(cardId, data)
      setSalvos((prev) => new Set([...prev, cardId]))
      setExpandido(null)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && pendentes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        <RefreshCw size={16} className="mr-2 animate-spin" />
        Carregando análises...
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Em Análise</h1>
          <p className="text-sm text-slate-500">
            Leads na coluna <strong>1º Contato</strong> do pipeline — marque se já foram analisados.
          </p>
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
        <StatCard icon={CheckCircle} label="Analisados" value={totalAprovados} color="text-green-600 bg-green-50" />
        <StatCard icon={Star} label="Total de análises" value={totalQualificacoes} color="text-indigo-600 bg-indigo-50" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Aguardando análise ({pendentes.length})
        </h2>

        {pendentes.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Nenhum lead pendente"
            description="Todos os leads foram analisados."
          />
        ) : (
          <div className="space-y-3">
            {pendentes.map((q) => {
              const nome = q.cliente?.nome_fantasia ?? q.cliente?.razao_social ?? `Card ${q.card_id}`
              const isSalvo = salvos.has(q.card_id)
              const isOpen  = expandido === q.card_id
              return (
                <div key={q.card_id} className="rounded-rca-lg border border-slate-100 bg-white shadow-soft-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <Clock size={18} />
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
                          onClick={() => setExpandido(isOpen ? null : q.card_id)}
                          className="rounded-lg bg-rca-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-rca-primary-dark transition-colors"
                        >
                          {isOpen ? 'Fechar' : 'Analisar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {q.observacoes && !isOpen && (
                    <div className="border-t border-slate-50 px-4 pb-3">
                      <p className="text-xs text-slate-500 italic">&ldquo;{q.observacoes}&rdquo;</p>
                    </div>
                  )}

                  {isOpen && (
                    <div className="border-t border-slate-100 p-4">
                      <ClientePipelineResumo cliente={q.cliente} card={q.card} />
                      <ContatoResumo contatos={q.contatos ?? []} />
                      <ScoreForm
                        loading={submitting}
                        onSubmit={(data) => handleSubmit(q.card_id, data)}
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

function ClientePipelineResumo({ cliente, card }) {
  const cidadeUf = [cliente?.cidade, cliente?.estado].filter(Boolean).join('/')
  const tags = Array.isArray(cliente?.tags) ? cliente.tags.filter(Boolean).join(', ') : ''

  const clienteItems = [
    ['Razão social', cliente?.razao_social],
    ['Nome fantasia', cliente?.nome_fantasia],
    ['Contato', cliente?.nome_contato],
    ['CNPJ', cliente?.cnpj],
    ['Telefone', cliente?.telefone],
    ['E-mail', cliente?.email],
    ['Segmento', cliente?.segmento],
    ['Cidade/UF', cidadeUf],
    ['Endereço', cliente?.endereco],
    ['Status', formatLabel(cliente?.status)],
    ['Última compra', cliente?.ultima_compra ? formatDate(cliente.ultima_compra) : null],
    ['Valor histórico', cliente?.valor_historico != null ? formatCurrency(cliente.valor_historico) : null],
    ['Qtd. compras', cliente?.qtd_compras ?? null],
    ['Origem inatividade', cliente?.origem_inatividade],
    ['Tags', tags],
    ['ID SISPLAN', cliente?.sisplan_id],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')

  const cardItems = [
    ['Etapa atual', formatLabel(card?.etapa)],
    ['Prioridade', formatLabel(card?.prioridade)],
    ['Score', card?.score ?? null],
    ['Próximo contato', card?.proximo_contato ? formatDate(card.proximo_contato) : null],
    ['Valor proposta', card?.valor_proposta != null ? formatCurrency(card.valor_proposta) : null],
    ['Tem interesse', formatBoolean(card?.tem_interesse)],
    ['Catálogo enviado', formatBoolean(card?.catalogo_enviado)],
    ['Atualização cadastral', formatBoolean(card?.atualizacao_cadastral)],
    ['Tipo de contato cliente', card?.tipo_contato_cliente],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')

  return (
    <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft-sm">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <User size={16} />
          Dados do cliente no pipeline
        </h3>
        <p className="text-xs text-slate-500">Informações cadastrais e campos preenchidos no card.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <InfoGroup title="Cliente" items={clienteItems} />
        <InfoGroup title="Card / Checklist" items={cardItems} />
      </div>

      {card?.notas && (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <ClipboardCheck size={13} />
            Observações do card
          </p>
          <p className="text-sm leading-relaxed text-slate-600">{card.notas}</p>
        </div>
      )}
    </div>
  )
}

function InfoGroup({ title, items }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma informação preenchida.</p>
      ) : (
        <dl className="grid gap-2 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white px-3 py-2">
              <dt className="text-[11px] font-medium text-slate-400">{label}</dt>
              <dd className="mt-0.5 break-words text-sm font-semibold text-slate-700">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function ContatoResumo({ contatos }) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <MessageSquare size={16} />
            Dados da aba Contatos
          </h3>
          <p className="text-xs text-slate-500">Relatos registrados no pipeline deste cliente.</p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
          {contatos.length}
        </span>
      </div>

      {contatos.length === 0 ? (
        <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-400">
          Nenhum relato de contato registrado para este cliente.
        </p>
      ) : (
        <div className="space-y-2">
          {contatos.map((contato) => (
            <div key={contato.id} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold capitalize text-slate-700">
                  {formatContatoLabel(contato.tipo)}
                </span>
                {contato.resultado && (
                  <span className="rounded-full bg-rca-primary/10 px-2 py-0.5 font-medium text-rca-primary">
                    {formatContatoLabel(contato.resultado)}
                  </span>
                )}
                <span className="text-slate-400">{formatContatoDate(contato.data_contato)}</span>
                {contato.duracao_minutos ? (
                  <span className="text-slate-400">{contato.duracao_minutos} min</span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{contato.resumo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatContatoLabel(value) {
  return String(value ?? '').replace(/_/g, ' ')
}

function formatLabel(value) {
  if (!value) return null
  return String(value).replace(/_/g, ' ')
}

function formatBoolean(value) {
  if (value === true) return 'Sim'
  if (value === false) return 'Não'
  return null
}

function formatContatoDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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
