import { useForm } from 'react-hook-form'
import { CheckCircle, CircleDashed } from 'lucide-react'

export function ScoreForm({ onSubmit, loading = false }) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { analisado: null, observacoes: '' },
  })
  const analisado = watch('analisado')

  function submit(values) {
    onSubmit({
      aprovado: values.analisado === 'sim',
      observacoes: values.observacoes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5 rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
      <div>
        <h3 className="font-semibold text-slate-800">Checklist de análise</h3>
        <p className="text-xs text-slate-400 mt-0.5">Confirme se o lead já foi analisado.</p>
      </div>

      <input type="hidden" {...register('analisado', { required: true })} />

      <div className="grid gap-3 sm:grid-cols-2">
        <ChecklistOption
          active={analisado === 'sim'}
          icon={CheckCircle}
          label="Sim"
          description="Lead analisado. Avança para a próxima etapa."
          onClick={() => setValue('analisado', 'sim', { shouldValidate: true })}
        />
        <ChecklistOption
          active={analisado === 'nao'}
          icon={CircleDashed}
          label="Não"
          description="Lead ainda não está pronto. Permanece em 1º Contato."
          onClick={() => setValue('analisado', 'nao', { shouldValidate: true })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Observações</label>
        <textarea
          {...register('observacoes')}
          placeholder="Notas sobre a análise do lead..."
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rca-primary focus:outline-none focus:ring-1 focus:ring-rca-primary resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !analisado}
        className="w-full rounded-lg bg-rca-primary py-2.5 text-sm font-semibold text-white hover:bg-rca-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvando...' : 'Salvar análise'}
      </button>
    </form>
  )
}

function ChecklistOption({ active, icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        active
          ? 'border-rca-primary bg-rca-primary/5 text-rca-primary shadow-glow'
          : 'border-slate-200 text-slate-600 hover:border-rca-primary-light hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        <Icon size={18} />
        <span>[{active ? 'x' : ' '}] {label}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </button>
  )
}
