import { useQualificacao } from '@/hooks/useQualificacao'

export function PendentesLista() {
  const { pendentes, loading } = useQualificacao()

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div className="space-y-3">
      {pendentes.map((q) => (
        <div key={q.id} className="rounded-lg border bg-white p-4">
          <p className="font-medium">
            {q.cliente?.nome_fantasia ?? q.cliente?.razao_social ?? `Card ${q.card_id}`}
          </p>
          <p className="text-sm text-slate-500">Score: {q.score_total}</p>
        </div>
      ))}
      {!pendentes.length && <p className="text-slate-500">Nenhum lead pendente de aprovação</p>}
    </div>
  )
}
