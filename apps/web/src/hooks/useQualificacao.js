import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  sbFetchQualificacoes,
  sbEnrichQualificacoes,
  sbRegistrarQualificacao,
  sbAprovarQualificacao,
} from '@/lib/supabaseData'

export function useQualificacao() {
  const [qualificacoes, setQualificacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQualificacoes = useCallback(async () => {
    try {
      setLoading(true)
      let raw
      try {
        raw = await api.get('/api/qualificacao')
      } catch {
        raw = await sbFetchQualificacoes()
      }
      setQualificacoes(await sbEnrichQualificacoes(raw))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQualificacoes()
  }, [fetchQualificacoes])

  async function registrar(cardId, dados) {
    let result
    try {
      result = await api.post(`/api/qualificacao/${cardId}`, dados)
    } catch {
      result = await sbRegistrarQualificacao(cardId, dados)
    }
    await fetchQualificacoes()
    return result
  }

  async function aprovar(cardId, aprovado, observacoes = null) {
    let result
    try {
      result = await api.post(`/api/qualificacao/${cardId}/aprovar`, { aprovado, observacoes })
    } catch {
      result = await sbAprovarQualificacao(cardId, aprovado, observacoes)
    }
    await fetchQualificacoes()
    return result
  }

  const pendentes = qualificacoes.filter((q) => q.aprovado === null)
  const aprovados = qualificacoes.filter((q) => q.aprovado === true)

  return {
    qualificacoes,
    pendentes,
    totalPendentes: pendentes.length,
    aprovados,
    totalAprovados: aprovados.length,
    totalQualificacoes: qualificacoes.length,
    loading,
    error,
    registrar,
    aprovar,
    refetch: fetchQualificacoes,
  }
}
