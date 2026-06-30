import { useState, useCallback } from 'react'
import { api } from '@/lib/api'

const SYNC_API_MSG =
  'Sincronização ODBC requer o backend (API). Inicie o uvicorn na porta 8000 com SUPABASE_SERVICE_KEY configurada.'

export function useSync() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const executar = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await api.post('/api/sync/executar')
      setLastResult(result)
      return result
    } catch (err) {
      const msg = err.message?.includes('conectar à API') ? SYNC_API_MSG : err.message
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { executar, loading, error, lastResult }
}
