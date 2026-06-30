const VARIANTS = {
  default:  'bg-slate-100 text-slate-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  primary:  'bg-indigo-100 text-indigo-700',
  purple:   'bg-purple-100 text-purple-700',
  teal:     'bg-teal-100 text-teal-700',
  blue:     'bg-blue-100 text-blue-700',
  info:     'bg-sky-100 text-sky-700',
}

const SIZES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'md', dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${VARIANTS[variant] ?? VARIANTS.default} ${SIZES[size]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}

export const STATUS_BADGE = {
  em_contato:   { variant: 'blue',    label: 'Em contato' },
  inativo:      { variant: 'default', label: 'Inativo' },
  qualificado:  { variant: 'teal',    label: 'Qualificado' },
  negociando:   { variant: 'warning', label: 'Negociando' },
  reativado:    { variant: 'purple',  label: 'Reativado' },
  descartado:   { variant: 'danger',  label: 'Descartado' },
  desqualificado: { variant: 'danger', label: 'Desqualificado' },
}
