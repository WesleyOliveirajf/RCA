export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon size={24} />
        </div>
      )}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-rca-primary px-4 py-2 text-sm font-medium text-white hover:bg-rca-primary-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
