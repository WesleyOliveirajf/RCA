import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  sbFetchQualificacaoPendentes,
  sbEnrichQualificacaoPendentes,
  sbRegistrarQualificacao,
  sbAprovarQualificacao,
} from '@/lib/supabaseData'

export function useQualificacao() {
  const [pendentes, setPendentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPendentes = useCallback(async () => {
    try {
      setLoading(true)
      let raw
      try {
        raw = await api.get('/api/qualificacao/pendentes')
      } catch {
        raw = await sbFetchQualificacaoPendentes()
      }
      setPendentes(await sbEnrichQualificacaoPendentes(raw))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendentes()
  }, [fetchPendentes])

  async function registrar(cardId, dados) {
    let result
    try {
      result = await api.post(`/api/qualificacao/${cardId}`, dados)
    } catch {
      result = await sbRegistrarQualificacao(cardId, dados)
    }
    await fetchPendentes()
    return result
  }

  async function aprovar(cardId, aprovado, observacoes = null) {
    let result
    try {
      result = await api.post(`/api/qualificacao/${cardId}/aprovar`, { aprovado, observacoes })
    } catch {
      result = await sbAprovarQualificacao(cardId, aprovado, observacoes)
    }
    await fetchPendentes()
    return result
  }

  return {
    pendentes,
    totalPendentes: pendentes.length,
    loading,
    error,
    registrar,
    aprovar,
    refetch: fetchPendentes,
  }
}
