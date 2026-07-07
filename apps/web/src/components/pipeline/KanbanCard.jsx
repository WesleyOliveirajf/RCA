import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Phone,
  Calendar,
  AlertTriangle,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Bell,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const PRIORIDADE_STYLES = {
  baixa: {
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
  media: {
    badge: 'bg-blue-50 text-blue-600',
    dot: 'bg-blue-400',
  },
  alta: {
    badge: 'bg-amber-50 text-amber-600',
    dot: 'bg-amber-400',
  },
  urgente: {
    badge: 'bg-red-50 text-red-600',
    dot: 'bg-red-500',
  },
}

function ScoreBar({ score }) {
  if (!score) return null

  const color =
    score >= 70 ? 'bg-emerald-400' :
    score >= 40 ? 'bg-amber-400' :
    'bg-slate-300'

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-slate-500 tabular-nums w-6 text-right">{score}</span>
    </div>
  )
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

/**
 * Determina o indicador visual legado de liberação para cards na etapa lead_qualificado.
 * Cards não liberados continuam movíveis, então não recebem destaque de bloqueio.
 */
function getLiberacaoStyle(card) {
  if (card.etapa !== 'lead_qualificado') {
    return { border: '', indicator: null }
  }

  if (card.liberado) {
    return {
      border: 'ring-2 ring-emerald-400/60 border-emerald-200',
      indicator: (
        <span
          className="flex items-center gap-1 badge text-[10px] bg-emerald-50 text-emerald-600"
          title="Lead liberado"
        >
          <ShieldCheck size={11} />
          Liberado
        </span>
      ),
    }
  }

  return { border: '', indicator: null }
}

function getTarefaStatus(card) {
  const tarefas = card.tarefas_pendentes || []
  if (!tarefas.length) return null

  const primeira = tarefas[0]
  const agendada = primeira.agendado_para || primeira.vencimento
  const vencida = agendada ? new Date(agendada) <= new Date() : false

  return { tarefa: primeira, vencida }
}

export function KanbanCard({
  card,
  onClick,
  isDragging,
  style,
  onLiberar,
  onContextMenu,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  }

  const prioStyle = PRIORIDADE_STYLES[card.prioridade] || PRIORIDADE_STYLES.media
  const overdue = isOverdue(card.proximo_contato)
  const liberacaoStyle = getLiberacaoStyle(card)
  const tarefaStatus = getTarefaStatus(card)
  const tarefaBorder = tarefaStatus
    ? tarefaStatus.vencida
      ? 'ring-2 ring-red-400/70 border-red-200 bg-red-50/35'
      : 'ring-2 ring-amber-300/70 border-amber-200 bg-amber-50/30'
    : ''

  const showLiberarBtn =
    card.etapa === 'lead_qualificado' &&
    !card.liberado

  function handleContextMenu(e) {
    if (onContextMenu) {
      onContextMenu(e, card)
    }
  }

  function handleLiberar(e) {
    e.stopPropagation()
    if (onLiberar) onLiberar(card.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`
        group relative rounded-xl bg-white p-3.5
        border border-slate-100
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        animate-fade-in-up
        ${isDragging || isSortableDragging
          ? 'shadow-soft-xl ring-2 ring-rca-primary/30 opacity-95 scale-[1.02]'
          : `shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 hover:border-slate-200 ${liberacaoStyle.border} ${tarefaBorder}`
        }
      `}
    >
      {/* ── Top: Priority dot + Badges + Liberação status ── */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-2 w-2 rounded-full ${prioStyle.dot}`} />
        <span className={`badge text-[10px] ${prioStyle.badge}`}>
          {card.prioridade}
        </span>
        {tarefaStatus && (
          <span
            className={`flex items-center gap-1 badge text-[10px] ${tarefaStatus.vencida ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}
            title={tarefaStatus.tarefa.titulo}
          >
            <Bell size={11} />
            {tarefaStatus.vencida ? 'Tarefa agora' : 'Tarefa'}
          </span>
        )}
        {liberacaoStyle.indicator}
        {card.valor_proposta && (
          <span className="badge text-[10px] bg-emerald-50 text-emerald-600 ml-auto">
            {formatCurrency(card.valor_proposta)}
          </span>
        )}
      </div>

      {/* ── Client name ── */}
      <h4 className="text-sm font-semibold text-slate-800 leading-tight mb-1 group-hover:text-rca-primary transition-colors">
        {card.cliente?.nome_fantasia || 'Cliente sem nome'}
      </h4>

      {/* ── Segment + City ── */}
      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2.5">
        {card.cliente?.segmento && (
          <span>{card.cliente.segmento}</span>
        )}
        {card.cliente?.cidade && (
          <span className="flex items-center gap-0.5">
            <MapPin size={10} />
            {card.cliente.cidade}/{card.cliente.estado}
          </span>
        )}
      </div>

      {/* ── Score bar ── */}
      <ScoreBar score={card.score} />

      {/* ── Bottom: Next contact + Actions + Liberar button ── */}
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-50">
        {card.proximo_contato ? (
          <span
            className={`flex items-center gap-1 text-[11px] font-medium ${
              overdue
                ? 'text-red-500'
                : 'text-slate-400'
            }`}
          >
            {overdue ? (
              <AlertTriangle size={12} className="text-red-400" />
            ) : (
              <Calendar size={12} />
            )}
            {new Date(card.proximo_contato).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        ) : (
          <span className="text-[11px] text-slate-300">Sem contato agendado</span>
        )}

        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Marcação legada de liberação; não bloqueia movimentação. */}
          {showLiberarBtn && (
            <button
              onClick={handleLiberar}
              className="
                flex items-center gap-1 px-2 py-1 rounded-lg
                bg-red-50 text-red-600 hover:bg-emerald-50 hover:text-emerald-600
                text-[10px] font-semibold
                transition-all duration-200
                border border-red-200 hover:border-emerald-300
              "
              title="Marcar lead como liberado"
            >
              <ShieldCheck size={12} />
              Liberar
            </button>
          )}
          {card.cliente?.telefone && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`tel:${card.cliente.telefone}`)
              }}
              className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-all"
              title="Ligar"
            >
              <Phone size={13} />
            </button>
          )}
          {card.cliente?.valor_historico > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium">
              <TrendingUp size={11} />
              {formatCurrency(card.cliente.valor_historico)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
