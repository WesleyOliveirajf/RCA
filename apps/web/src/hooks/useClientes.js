import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { sbFetchClientes, sbFetchCliente, sbFetchHistoricoCliente } from '@/lib/supabaseData'

function buildQuery(filtros) {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function useClientes(filtros = {}) {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      let data
      try {
        data = await api.get(`/api/clientes${buildQuery(filtros)}`)
      } catch {
        data = await sbFetchClientes(filtros)
      }
      setClientes(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filtros)])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  async function criarCliente(dados) {
    const novo = await api.post('/api/clientes', dados)
    setClientes((prev) => [novo, ...prev])
    return novo
  }

  return { clientes, loading, error, criarCliente, refetch: fetchClientes }
}

export function useCliente(id) {
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    ;(async () => {
      try {
        let data
        try {
          data = await api.get(`/api/clientes/${id}`)
        } catch {
          data = await sbFetchCliente(id)
        }
        setCliente(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return { cliente, loading, error }
}

export function useHistoricoCliente(clienteId) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!clienteId) {
      setLoading(false)
      return
    }

    setLoading(true)
    ;(async () => {
      try {
        let data
        try {
          data = await api.get(`/api/clientes/${clienteId}/historico`)
        } catch {
          data = await sbFetchHistoricoCliente(clienteId)
        }
        setHistorico(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [clienteId])

  return { historico, loading, error }
}
