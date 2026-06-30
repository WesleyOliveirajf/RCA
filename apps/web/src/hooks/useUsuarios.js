import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { sbFetchUsuarios } from '@/lib/supabaseData'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      let data
      try {
        data = await api.get('/api/usuarios')
      } catch {
        data = await sbFetchUsuarios()
      }
      setUsuarios(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  return { usuarios, loading, error, refetch: fetchUsuarios }
}
