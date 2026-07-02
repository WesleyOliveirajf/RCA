import { useEffect, useState, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { podeMoverCard, podeLiberar, precisaLiberacaoParaMover, MSG_LEAD_NAO_LIBERADO, statusFromEtapa } from '@/lib/utils'
import {
  sbFetchPipelineCards,
  sbEnrichCardsWithClientes,
  sbMoverCard,
  sbLiberarLead,
  sbDesqualificarLead,
} from '@/lib/supabaseData'

export function usePipeline() {
  const { user, profile } = useAuth()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCards = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const raw = await sbFetchPipelineCards()
      setCards(await sbEnrichCardsWithClientes(raw))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()

    if (isDemoMode) return undefined

    const channel = supabase
      .channel('pipeline-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pipeline_cards' },
        (payload) => {
          if (payload.new?.id) {
            setCards((prev) =>
              prev.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } : c))
            )
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pipeline_cards' },
        () => { fetchCards({ silent: true }) }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pipeline_cards' },
        (payload) => {
          if (payload.old?.id) {
            setCards((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchCards])

  async function moverCard(cardId, etapaDestino, posicao) {
    const cardAtual = cards.find((c) => c.id === cardId)
    const etapaAnterior = cardAtual?.etapa

    if (
      !podeMoverCard({
        perfil: profile?.perfil,
        responsavelId: cardAtual?.responsavel_id,
        userId: user?.id,
        etapaAtual: etapaAnterior,
        etapaDestino,
        liberado: cardAtual?.liberado,
      })
    ) {
      if (
        precisaLiberacaoParaMover({
          etapaAtual: etapaAnterior,
          etapaDestino,
          liberado: cardAtual?.liberado,
        })
      ) {
        throw new Error(MSG_LEAD_NAO_LIBERADO)
      }
      throw new Error('Sem permissão para mover para esta etapa')
    }

    const snapshot = [...cards]

    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card
        const novoStatus = statusFromEtapa(etapaDestino)
        return {
          ...card,
          etapa: etapaDestino,
          posicao: posicao ?? card.posicao,
          cliente: card.cliente && novoStatus
            ? { ...card.cliente, status: novoStatus }
            : card.cliente,
        }
      })
    )

    try {
      const data = await sbMoverCard(cardId, etapaDestino, posicao, etapaAnterior)
      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? { ...card, ...data } : card))
      )
      setError(null)
    } catch (err) {
      setCards(snapshot)
      throw err
    }
  }

  async function liberarLead(cardId) {
    const card = cards.find((c) => c.id === cardId)
    if (
      !podeLiberar({
        perfil: profile?.perfil,
        etapaAtual: card?.etapa,
        liberado: card?.liberado,
      })
    ) {
      throw new Error('Somente administradores podem liberar leads')
    }

    // Optimistic update
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, liberado: true, liberado_por: user?.id, liberado_em: new Date().toISOString() }
          : c
      )
    )

    try {
      await sbLiberarLead(cardId)
      setError(null)
    } catch (err) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, liberado: false, liberado_por: null, liberado_em: null } : c
        )
      )
      throw err
    }
  }

  async function desqualificarLead(cardId, dados) {
    const card = cards.find((c) => c.id === cardId)
    if (!card) throw new Error('Card não encontrado')

    const snapshot = [...cards]
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              etapa: 'desqualificados',
              notas: dados.observacoes,
              proximo_contato: null,
              cliente: c.cliente
                ? {
                    ...c.cliente,
                    status: 'desqualificado',
                    desqualificado_motivo: dados.motivo,
                    comunicacao_ativa: dados.motivo !== 'nao_icp',
                  }
                : c.cliente,
            }
          : c
      )
    )

    try {
      let updatedCard
      try {
        const result = await api.post(`/api/pipeline/cards/${cardId}/desqualificar`, dados)
        updatedCard = result.card
      } catch {
        updatedCard = await sbDesqualificarLead(card, dados)
      }

      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c))
      )
      setError(null)
    } catch (err) {
      setCards(snapshot)
      throw err
    }
  }

  return { cards, loading, error, moverCard, liberarLead, desqualificarLead, refetch: fetchCards }
}
