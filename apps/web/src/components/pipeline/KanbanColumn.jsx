import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import { formatCurrency } from '@/lib/utils'
import { Pencil } from 'lucide-react'

const ETAPA_COLORS = {
  inativos: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    header: 'text-violet-700',
    count: 'bg-violet-100 text-violet-600',
  },
  primeiro_contato: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    header: 'text-blue-700',
    count: 'bg-blue-100 text-blue-600',
  },
  em_analise: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    header: 'text-orange-700',
    count: 'bg-orange-100 text-orange-600',
  },
  lead_qualificado: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
    header: 'text-teal-700',
    count: 'bg-teal-100 text-teal-600',
  },
  nutricao: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    header: 'text-sky-700',
    count: 'bg-sky-100 text-sky-600',
  },
  negociacao: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    header: 'text-amber-700',
    count: 'bg-amber-100 text-amber-600',
  },
  pos_venda: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    header: 'text-emerald-700',
    count: 'bg-emerald-100 text-emerald-600',
  },
}

const DEFAULT_COLORS = {
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  dot: 'bg-slate-400',
  header: 'text-slate-600',
  count: 'bg-slate-100 text-slate-500',
}

export function KanbanColumn({ etapa, cards, onCardClick, canDrop = true, isAdmin, onLiberar, onCardContextMenu, label, onLabelChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.id,
    data: { type: 'column', etapaId: etapa.id },
  })
  const colors = ETAPA_COLORS[etapa.id] || DEFAULT_COLORS
  const totalValor = cards.reduce((sum, c) => sum + (c.cliente?.valor_historico || 0), 0)
  const displayLabel = label || etapa.label

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(displayLabel)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEditing() {
    setEditValue(displayLabel)
    setEditing(true)
  }

  function commitLabel() {
    const trimmed = editValue.trim()
    if (trimmed && onLabelChange) {
      onLabelChange(etapa.id, trimmed)
    }
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        flex w-[300px] min-w-[300px] flex-col rounded-2xl
        border-2 transition-all duration-200
        ${isOver && canDrop
          ? `${colors.border} ${colors.bg} shadow-soft-lg scale-[1.01]`
          : isOver && !canDrop
            ? 'border-red-200 bg-red-50/40'
          : !canDrop
            ? 'border-slate-100 bg-slate-50/30 opacity-75'
            : 'border-slate-100 bg-slate-50/50'
        }
      `}
    >
      {/* ── Column header ── */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100/80">
        <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 rounded-lg border border-rca-primary px-2 py-0.5 text-sm font-semibold text-slate-800 outline-none ring-2 ring-rca-primary/10"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className={`text-sm font-semibold ${colors.header} flex-1 text-left hover:underline cursor-pointer flex items-center gap-1 group`}
          >
            {displayLabel}
            <Pencil size={11} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
          </button>
        )}
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${colors.count}`}>
          {cards.length}
        </span>
      </div>

      {/* Total value */}
      {totalValor > 0 && (
        <div className="px-4 py-1.5 border-b border-slate-100/50">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Valor total
          </p>
          <p className="text-xs font-semibold text-slate-600">
            {formatCurrency(totalValor)}
          </p>
        </div>
      )}

      {/* ── Cards list ── */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[180px] max-h-[calc(100vh-280px)]"
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className={`h-8 w-8 rounded-full ${colors.bg} flex items-center justify-center mb-2`}>
                <div className={`h-2 w-2 rounded-full ${colors.dot} opacity-40`} />
              </div>
              <p className="text-xs text-slate-400">Nenhum card</p>
            </div>
          ) : (
            cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
                style={{ animationDelay: `${index * 30}ms` }}
                isAdmin={isAdmin}
                onLiberar={onLiberar}
                onContextMenu={onCardContextMenu}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

