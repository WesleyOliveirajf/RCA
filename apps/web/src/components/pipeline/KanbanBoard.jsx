import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { KanbanColumn } from './KanbanColumn'
import { CardDetail } from './CardDetail'
import { usePipeline } from '@/hooks/usePipeline'
import { useSync } from '@/hooks/useSync'
import { useAuth } from '@/contexts/AuthContext'
import { podeMoverCard, podeLiberar, precisaLiberacaoParaMover, MSG_LEAD_NAO_LIBERADO, formatCurrency, PRIORIDADE_CORES, getColumnOrder, saveColumnOrder, orderedEtapas, getColumnLabels, saveColumnLabels, getPipelineColumns, getCustomColumns, saveCustomColumns, createCustomColumn } from '@/lib/utils'
import { Search, Filter, RefreshCw, AlertCircle, ShieldCheck, CheckCircle2, MapPin, GripVertical, Plus, X, Bell } from 'lucide-react'
import { sbFetchTarefasPendentes } from '@/lib/supabaseData'

/**
 * Preview card exibido durante drag-and-drop.
 * Não usa useSortable para evitar registro duplicado de droppable no DndContext.
 */
function CardDragPreview({ card }) {
  const prioColor = PRIORIDADE_CORES[card.prioridade] || PRIORIDADE_CORES.media
  return (
    <div
      className="
        w-[290px] rounded-xl bg-white p-3.5
        border-2 border-rca-primary/40
        shadow-2xl ring-2 ring-rca-primary/20
        rotate-2 opacity-95 scale-[1.03]
        cursor-grabbing
      "
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-2 w-2 rounded-full ${prioColor.split(' ')[0].replace('bg-', 'bg-')}`} />
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${prioColor}`}>
          {card.prioridade}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-slate-800 leading-tight mb-1">
        {card.cliente?.nome_fantasia || 'Cliente sem nome'}
      </h4>
      {(card.cliente?.cidade) && (
        <p className="flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin size={10} />
          {card.cliente.cidade}/{card.cliente.estado}
        </p>
      )}
      {card.valor_proposta > 0 && (
        <p className="mt-1 text-[11px] font-semibold text-emerald-600">
          {formatCurrency(card.valor_proposta)}
        </p>
      )}
    </div>
  )
}

function SortableColumnWrapper({ etapa, cards, activeCard, canDrop, isAdmin, onLiberar, onCardContextMenu, onCardClick, disabled, label, onLabelChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: etapa.id, data: { type: 'column' }, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="shrink-0">
      <div className="flex items-center justify-center -mb-1 relative z-10 opacity-0 hover:opacity-100 transition-opacity">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-full py-0.5 text-slate-300 hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
      </div>
      <KanbanColumn
        etapa={etapa}
        cards={cards}
        onCardClick={onCardClick}
        canDrop={canDrop}
        isAdmin={isAdmin}
        onLiberar={onLiberar}
        onCardContextMenu={onCardContextMenu}
        label={label}
        onLabelChange={onLabelChange}
      />
    </div>
  )
}

export function KanbanBoard() {
  const { cards, setCards, loading, error, moverCard, liberarLead, desqualificarLead, refetch } = usePipeline()
  const { user, profile } = useAuth()
  const { executar: executarSync, loading: syncing } = useSync()
  const [activeCard, setActiveCard] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPrioridade, setFilterPrioridade] = useState('todas')
  const [showFilters, setShowFilters] = useState(false)
  const [moving, setMoving] = useState(false)
  const [desqualificandoId, setDesqualificandoId] = useState(null)
  const [moveError, setMoveError] = useState(null)
  const [pipelineColumns, setPipelineColumns] = useState(() => getPipelineColumns())
  const [columnOrder, setColumnOrder] = useState(() => getColumnOrder())
  const [columnLabels, setColumnLabels] = useState(() => getColumnLabels())
  const [showCreateColumn, setShowCreateColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [createColumnError, setCreateColumnError] = useState(null)
  const [tarefasNotificacao, setTarefasNotificacao] = useState([])

  function handleRenameColumn(etapaId, newLabel) {
    setColumnLabels((prev) => {
      const next = { ...prev, [etapaId]: newLabel }
      saveColumnLabels(next)
      return next
    })
  }

  function handleCardUpdate(updatedCard) {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c)))
    setSelectedCard((prev) => (prev?.id === updatedCard.id ? { ...prev, ...updatedCard } : prev))
  }

  function handleCreateColumn(event) {
    event.preventDefault()
    const label = newColumnName.trim()
    if (!label) {
      setCreateColumnError('Informe o nome da coluna.')
      return
    }
    if (pipelineColumns.some((col) => col.label.toLowerCase() === label.toLowerCase())) {
      setCreateColumnError('Já existe uma coluna com esse nome.')
      return
    }

    const newColumn = createCustomColumn(label)
    const customColumns = [...getCustomColumns(), newColumn]
    const nextColumns = [...pipelineColumns, newColumn]
    const nextOrder = [...columnOrder, newColumn.id]

    saveCustomColumns(customColumns)
    saveColumnOrder(nextOrder)
    setPipelineColumns(nextColumns)
    setColumnOrder(nextOrder)
    setNewColumnName('')
    setCreateColumnError(null)
    setShowCreateColumn(false)
  }

  // ── Context menu state ──
  const [contextMenu, setContextMenu] = useState(null)
  const contextMenuRef = useRef(null)

  // ── Liberação feedback ──
  const [liberacaoMsg, setLiberacaoMsg] = useState(null)
  const [liberandoId, setLiberandoId] = useState(null)

  const isAdmin = profile?.perfil === 'admin'

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  )

  // Fechar context menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('contextmenu', handleClickOutside)
      }
    }
  }, [contextMenu])

  // Limpa a mensagem de liberação após 3s
  useEffect(() => {
    if (liberacaoMsg) {
      const t = setTimeout(() => setLiberacaoMsg(null), 3000)
      return () => clearTimeout(t)
    }
  }, [liberacaoMsg])

  useEffect(() => {
    setSelectedCard((prev) => {
      if (!prev) return null
      return cards.find((c) => c.id === prev.id) ?? prev
    })
  }, [cards])

  useEffect(() => {
    let cancelled = false

    async function fetchTarefasVencidas() {
      try {
        const tarefas = await sbFetchTarefasPendentes({ vencidas: true })
        if (!cancelled) setTarefasNotificacao(tarefas)
      } catch {
        if (!cancelled) setTarefasNotificacao([])
      }
    }

    fetchTarefasVencidas()
    const interval = setInterval(fetchTarefasVencidas, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchSearch =
        !searchQuery ||
        card.cliente?.nome_fantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.cliente?.razao_social?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.cliente?.cidade?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchPrioridade =
        filterPrioridade === 'todas' || card.prioridade === filterPrioridade

      return matchSearch && matchPrioridade
    })
  }, [cards, searchQuery, filterPrioridade])

  const cardsByEtapa = useMemo(() => {
    const grouped = {}
    pipelineColumns.forEach((etapa) => {
      grouped[etapa.id] = filteredCards
        .filter((c) => c.etapa === etapa.id)
        .sort((a, b) => a.posicao - b.posicao)
    })
    return grouped
  }, [filteredCards, pipelineColumns])

  function canDropOnEtapa(card, etapaId) {
    if (!card) return false
    if (!user) return false
    return podeMoverCard({
      perfil: profile?.perfil,
      responsavelId: card.responsavel_id,
      userId: user.id,
      etapaAtual: card.etapa,
      etapaDestino: etapaId,
      liberado: card.liberado,
    })
  }

  function getMoveErrorMessage(card, targetEtapa) {
    if (!user) {
      return 'Sessão expirada. Faça login novamente para mover cards.'
    }
    if (
      precisaLiberacaoParaMover({
        etapaAtual: card?.etapa,
        etapaDestino: targetEtapa,
        liberado: card?.liberado,
      })
    ) {
      return MSG_LEAD_NAO_LIBERADO
    }
    return 'Sem permissão para mover para esta etapa. Até Lead qualificado, qualquer usuário pode mover.'
  }

  function resolveTargetEtapa(overId) {
    if (pipelineColumns.some((e) => e.id === overId)) return overId
    const overCard = cards.find((c) => c.id === overId)
    return overCard?.etapa ?? null
  }

  function collisionDetection(args) {
    const hits = pointerWithin(args)
    if (hits.length > 0) return hits
    return closestCorners(args)
  }

  function handleDragStart(event) {
    if (event.active.data?.current?.type === 'column') {
      setActiveCard(null)
      return
    }
    const card = cards.find((c) => c.id === event.active.id)
    setActiveCard(card)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveCard(null)

    if (active.data?.current?.type === 'column') {
      if (over && active.id !== over.id) {
        setColumnOrder((prev) => {
          const current = orderedEtapas(prev, pipelineColumns).map((etapa) => etapa.id)
          const oldIdx = current.indexOf(active.id)
          const newIdx = current.indexOf(over.id)
          if (oldIdx < 0 || newIdx < 0) return prev
          const next = arrayMove(current, oldIdx, newIdx)
          saveColumnOrder(next)
          return next
        })
      }
      return
    }

    if (moving) return

    if (!over) {
      setMoveError('Solte o card sobre uma coluna válida.')
      return
    }

    const cardId = active.id
    const targetEtapa = resolveTargetEtapa(over.id)
    if (!targetEtapa) {
      setMoveError('Coluna de destino não identificada.')
      return
    }

    const card = cards.find((c) => c.id === cardId)
    if (!card) {
      setMoveError('Card não encontrado. Recarregue a página.')
      return
    }
    if (card.etapa === targetEtapa) return

    if (!canDropOnEtapa(card, targetEtapa)) {
      setMoveError(getMoveErrorMessage(card, targetEtapa))
      return
    }

    const posicao = cardsByEtapa[targetEtapa]?.length ?? 0

    try {
      setMoving(true)
      setMoveError(null)
      await moverCard(cardId, targetEtapa, posicao)
    } catch (err) {
      setMoveError(err.message || 'Não foi possível mover o card')
    } finally {
      setMoving(false)
    }
  }

  async function handleSync() {
    try {
      await executarSync()
      await refetch()
    } catch {
      // erro exibido pelo hook useSync quando necessário
    }
  }

  function handleDragCancel() {
    setActiveCard(null)
  }

  // ── Liberação: botão no card ──
  const handleLiberarLead = useCallback(
    async (cardId) => {
      setContextMenu(null)
      setLiberandoId(cardId)
      try {
        await liberarLead(cardId)
        const card = cards.find((c) => c.id === cardId)
        setLiberacaoMsg(
          `Lead "${card?.cliente?.nome_fantasia || 'Lead'}" liberado com sucesso!`
        )
      } catch (err) {
        setMoveError(err.message || 'Não foi possível liberar o lead')
      } finally {
        setLiberandoId(null)
      }
    },
    [liberarLead, cards]
  )

  const handleDesqualificarLead = useCallback(
    async (cardId, dados) => {
      setDesqualificandoId(cardId)
      try {
        await desqualificarLead(cardId, dados)
        setLiberacaoMsg('Lead desqualificado e automação aplicada com sucesso.')
      } catch (err) {
        setMoveError(err.message || 'Não foi possível desqualificar o lead')
        throw err
      } finally {
        setDesqualificandoId(null)
      }
    },
    [desqualificarLead]
  )

  // ── Context menu (botão direito) ──
  function handleCardContextMenu(e, card) {
    e.preventDefault()
    const canRelease = podeLiberar({
      perfil: profile?.perfil,
      etapaAtual: card.etapa,
      liberado: card.liberado,
    })

    const moveTargets = pipelineColumns.filter((et) =>
      et.id !== card.etapa &&
      canDropOnEtapa(card, et.id)
    )

    if (!canRelease && moveTargets.length === 0) return

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      card,
      cardId: card.id,
      cardName: card.cliente?.nome_fantasia || 'Lead',
      canRelease,
      moveTargets,
    })
  }

  async function handleMoverViaMenu(card, etapaDestino) {
    setContextMenu(null)
    const posicao = cardsByEtapa[etapaDestino]?.length ?? 0
    try {
      setMoving(true)
      setMoveError(null)
      await moverCard(card.id, etapaDestino, posicao)
    } catch (err) {
      setMoveError(err.message || 'Não foi possível mover o card')
    } finally {
      setMoving(false)
    }
  }

  const totalCards = cards.length
  const totalValor = cards.reduce((sum, c) => sum + (Number(c.valor_proposta) || 0), 0)

  if (loading && cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        <RefreshCw size={16} className="mr-2 animate-spin" />
        Carregando pipeline...
      </div>
    )
  }

  if (error && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={refetch} className="btn-secondary btn-sm">
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Feedback de liberação ── */}
      {liberacaoMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 animate-fade-in-down">
          <CheckCircle2 size={14} />
          {liberacaoMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="input pl-9 py-2 text-sm"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary btn-sm ${showFilters ? 'bg-indigo-50 border-indigo-200 text-rca-primary' : ''}`}
        >
          <Filter size={14} />
          Filtros
        </button>

        <button
          onClick={() => {
            setShowCreateColumn(true)
            setCreateColumnError(null)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-rca-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-rca-primary/90"
        >
          <Plus size={14} />
          Nova coluna
        </button>

        <div className="hidden sm:flex items-center gap-4 ml-auto text-xs text-slate-400">
          <span>
            <strong className="text-slate-600">{totalCards}</strong> cards
          </span>
          <span>
            Pipeline:{' '}
            <strong className="text-slate-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}
            </strong>
          </span>
          <button
            onClick={handleSync}
            disabled={loading || syncing}
            className="btn-ghost btn-sm gap-1.5 text-slate-400 hover:text-rca-primary"
          >
            <RefreshCw size={13} className={loading || syncing ? 'animate-spin' : ''} />
            Sync SISPLAN
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex items-center gap-2 animate-fade-in-down">
          <span className="text-xs text-slate-500">Prioridade:</span>
          {['todas', 'urgente', 'alta', 'media', 'baixa'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPrioridade(p)}
              className={`
                rounded-full px-3 py-1 text-xs font-medium capitalize transition-all
                ${filterPrioridade === p
                  ? 'bg-rca-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {moveError && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle size={14} />
          {moveError}
        </div>
      )}

      {tarefasNotificacao.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
              <Bell size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {tarefasNotificacao.length} tarefa{tarefasNotificacao.length > 1 ? 's' : ''} pendente{tarefasNotificacao.length > 1 ? 's' : ''} agora
              </p>
              <div className="mt-1 space-y-1">
                {tarefasNotificacao.slice(0, 3).map((tarefa) => {
                  const card = cards.find((item) => item.id === tarefa.card_id)
                  return (
                    <p key={tarefa.id} className="truncate text-xs text-amber-800/90">
                      <span className="font-semibold">{tarefa.titulo}</span>
                      {card?.cliente?.nome_fantasia ? ` • ${card.cliente.nome_fantasia}` : ''}
                    </p>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={orderedEtapas(columnOrder, pipelineColumns).map((etapa) => etapa.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
            {orderedEtapas(columnOrder, pipelineColumns).map((etapa) => (
              <SortableColumnWrapper
                key={etapa.id}
                etapa={etapa}
                cards={cardsByEtapa[etapa.id] || []}
                onCardClick={setSelectedCard}
                canDrop={activeCard ? canDropOnEtapa(activeCard, etapa.id) : true}
                isAdmin={isAdmin}
                onLiberar={handleLiberarLead}
                onCardContextMenu={handleCardContextMenu}
                disabled={!!activeCard}
                label={columnLabels[etapa.id]}
                onLabelChange={handleRenameColumn}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <CardDragPreview card={activeCard} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Context menu (botão direito) ── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="
            fixed z-[100] min-w-[220px]
            bg-white rounded-xl shadow-2xl border border-slate-200
            py-1.5 animate-fade-in
          "
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 300),
            left: Math.min(contextMenu.x, window.innerWidth - 240),
          }}
        >
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate max-w-[180px]">
              {contextMenu.cardName}
            </p>
          </div>

          {contextMenu.canRelease && (
            <button
              onClick={() => handleLiberarLead(contextMenu.cardId)}
              className="
                flex items-center gap-2 w-full px-3 py-2.5 text-left
                text-sm font-medium text-emerald-700
                hover:bg-emerald-50 transition-colors
              "
            >
              <ShieldCheck size={16} className="text-emerald-500" />
              Liberar Lead
            </button>
          )}

          {contextMenu.moveTargets?.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Mover para
                </p>
              </div>
              {contextMenu.moveTargets.map((et) => (
                <button
                  key={et.id}
                  onClick={() => handleMoverViaMenu(contextMenu.card, et.id)}
                  className="
                    flex items-center gap-2 w-full px-3 py-2 text-left
                    text-sm text-slate-700
                    hover:bg-slate-50 transition-colors
                  "
                >
                  <span className={`h-2 w-2 rounded-full bg-${et.cor}-400`} />
                  {et.label}
                </button>
              ))}
            </>
          )}

          <div className="border-t border-slate-100 mt-1">
            <button
              onClick={() => setContextMenu(null)}
              className="
                flex items-center gap-2 w-full px-3 py-2 text-left
                text-xs text-slate-400
                hover:bg-slate-50 transition-colors
              "
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {selectedCard && (
        <CardDetail
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onLiberar={handleLiberarLead}
          onDesqualificar={handleDesqualificarLead}
          onCardUpdate={handleCardUpdate}
          liberando={liberandoId === selectedCard.id}
          desqualificando={desqualificandoId === selectedCard.id}
        />
      )}

      {showCreateColumn && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in-up">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Nova coluna</h2>
                <p className="text-sm text-slate-500">Crie uma nova etapa visual no pipeline.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateColumn(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="space-y-4 px-5 py-4">
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                Nome da coluna
                <input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Ex.: Follow-up, Proposta enviada, Aguardando retorno"
                  className="input text-sm"
                  autoFocus
                />
              </label>

              {createColumnError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{createColumnError}</p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateColumn(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newColumnName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-rca-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rca-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={15} />
                  Criar coluna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
