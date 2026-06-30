import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { sbFetchContatosPorCliente, sbCreateContato } from '@/lib/supabaseData'

export function useContatos(clienteId) {
  const [contatos, setContatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchContatos = useCallback(async () => {
    if (!clienteId) return
    try {
      setLoading(true)
      let data
      try {
        data = await api.get(`/api/contatos/${clienteId}`)
      } catch {
        data = await sbFetchContatosPorCliente(clienteId)
      }
      setContatos(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    if (!clienteId) {
      setLoading(false)
      return
    }
    fetchContatos()
  }, [clienteId, fetchContatos])

  async function registrar(dados) {
    let novo
    try {
      novo = await api.post('/api/contatos', dados)
    } catch {
      novo = await sbCreateContato(dados)
    }
    setContatos((prev) => [novo, ...prev])
    return novo
  }

  return { contatos, loading, error, registrar, refetch: fetchContatos }
}
