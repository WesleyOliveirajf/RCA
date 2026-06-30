import { useForm, useWatch } from 'react-hook-form'

const CAMPOS = [
  { key: 'interesse', label: 'Interesse',    weight: 40, hint: 'O cliente demonstrou interesse real?' },
  { key: 'volume',    label: 'Volume',       weight: 35, hint: 'Potencial de volume de compra?' },
  { key: 'prazo',     label: 'Prazo',        weight: 25, hint: 'Probabilidade de fechar em breve?' },
]

function calcScore(values) {
  const i = Number(values.score_interesse) || 0
  const v = Number(values.score_volume)    || 0
  const p = Number(values.score_prazo)     || 0
  return Math.round((i * 40 + v * 35 + p * 25) / 5)
}

function ScoreStars({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-1.5 mt-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`h-8 w-8 rounded-lg text-sm font-semibold border transition-all ${
            star <= value
              ? 'bg-rca-primary border-rca-primary text-white shadow-glow'
              : 'border-slate-200 text-slate-400 hover:border-rca-primary-light hover:text-rca-primary-light'
          }`}
        >
          {star}
        </button>
      ))}
    </div>
  )
}

export function ScoreForm({ onSubmit, loading = false }) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    defaultValues: { score_interesse: 0, score_volume: 0, score_prazo: 0, observacoes: '' },
  })

  const values = useWatch({ control })
  const score  = calcScore(values)

  function getScoreColor(s) {
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Avaliar lead</h3>
          <p className="text-xs text-slate-400 mt-0.5">Pontue de 1 a 5 em cada critério</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Score estimado</p>
          <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</p>
        </div>
      </div>

      {CAMPOS.map(({ key, label, weight, hint }) => (
        <div key={key}>
          <label className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span>{label}</span>
            <span className="text-xs font-normal text-slate-400">peso {weight}%</span>
          </label>
          <p className="text-xs text-slate-400 mb-1">{hint}</p>
          <input type="hidden" {...register(`score_${key}`, { required: true, min: 1, max: 5, valueAsNumber: true })} />
          <ScoreStars
            value={Number(values[`score_${key}`]) || 0}
            onChange={(v) => setValue(`score_${key}`, v, { shouldValidate: true })}
          />
          {errors[`score_${key}`] && (
            <p className="mt-1 text-xs text-red-500">Campo obrigatório (1–5)</p>
          )}
        </div>
      ))}

      <div>
        <label className="text-sm font-medium text-slate-700">Observações</label>
        <textarea
          {...register('observacoes')}
          placeholder="Notas sobre o lead, contexto da negociação..."
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rca-primary focus:outline-none focus:ring-1 focus:ring-rca-primary resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || score === 0}
        className="w-full rounded-lg bg-rca-primary py-2.5 text-sm font-semibold text-white hover:bg-rca-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvando...' : `Salvar qualificação — Score ${score}`}
      </button>
    </form>
  )
}
