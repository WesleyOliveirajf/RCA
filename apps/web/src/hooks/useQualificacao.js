import { useEffect, useState, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import { api } from '@/lib/api'
import {
  sbFetchQualificacaoPendentes,
  sbFetchQualificacaoStats,
  sbRegistrarQualificacao,
  sbAprovarQualificacao,
} from '@/lib/supabaseData'

export function useQualificacao() {
  const [pendentes, setPendentes] = useState([])
  const [stats, setStats] = useState({
    totalPendentes: 0,
    totalAprovados: 0,
    totalQualificacoes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const [pendentesData, statsData] = await Promise.all([
        sbFetchQualificacaoPendentes(),
        sbFetchQualificacaoStats(),
      ])
      setPendentes(pendentesData)
      setStats(statsData)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()

    if (isDemoMode) return undefined

    const channel = supabase
      .channel('qualificacao-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_cards' },
        () => { fetchAll({ silent: true }) }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qualificacoes' },
        () => { fetchAll({ silent: true }) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  async function registrar(cardId, dados) {
    let result
    try {
      result = await api.post(`/api/qualificacao/${cardId}`, dados)
    } catch {
      result = await sbRegistrarQualificacao(cardId, dados)
    }
    await fetchAll({ silent: true })
    return result
  }

  async function aprovar(cardId, aprovado, observacoes = null) {
    let result
    try {
      result = await api.post(`/api/qualificacao/${cardId}/aprovar`, { aprovado, observacoes })
    } catch {
      result = await sbAprovarQualificacao(cardId, aprovado, observacoes)
    }
    await fetchAll({ silent: true })
    return result
  }

  return {
    pendentes,
    totalPendentes: stats.totalPendentes,
    totalAprovados: stats.totalAprovados,
    totalQualificacoes: stats.totalQualificacoes,
    loading,
    error,
    registrar,
    aprovar,
    refetch: fetchAll,
  }
}
