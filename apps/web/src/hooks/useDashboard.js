import { useEffect, useState, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import { api } from '@/lib/api'
import { withApiFallback } from '@/lib/apiFallback'
import {
  sbFetchDashboardFunil,
  sbFetchTimeline,
  sbFetchContatosPendentes,
  sbFetchSyncStatus,
} from '@/lib/supabaseData'
import { mapTimelineActivities } from '@/lib/activityMapper'

const POLL_INTERVAL_MS = 60_000

export function useDashboard() {
  const [funil, setFunil] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [contatosHoje, setContatosHoje] = useState(0)
  const [syncStatus, setSyncStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      let fallbackUsed = false

      const wrap = async (apiFn, sbFn) => {
        try {
          return await apiFn()
        } catch {
          fallbackUsed = true
          return sbFn()
        }
      }

      // Funil sempre via Supabase (mesma RLS e mesma agregação da pipeline)
      const [funilData, timelineData, contatosData, syncData] = await Promise.all([
        sbFetchDashboardFunil(),
        wrap(() => api.get('/api/dashboard/timeline'), () => sbFetchTimeline()),
        wrap(() => api.get('/api/contatos/pendentes'), sbFetchContatosPendentes),
        withApiFallback(() => api.get('/api/sync/status'), sbFetchSyncStatus),
      ])

      setFunil(funilData)
      setTimeline(mapTimelineActivities(timelineData))
      setContatosHoje(Array.isArray(contatosData) ? contatosData.length : 0)
      setSyncStatus(syncData)
      setUsingFallback(fallbackUsed)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()

    if (isDemoMode) {
      const interval = setInterval(() => fetchAll({ silent: true }), POLL_INTERVAL_MS)
      return () => clearInterval(interval)
    }

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_cards' },
        () => { fetchAll({ silent: true }) }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atividades' },
        () => { fetchAll({ silent: true }) }
      )
      .subscribe()

    const interval = setInterval(() => fetchAll({ silent: true }), POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchAll])

  return { funil, timeline, contatosHoje, syncStatus, loading, error, usingFallback, refetch: fetchAll }
}
