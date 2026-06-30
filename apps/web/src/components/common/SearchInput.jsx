import { Search } from 'lucide-react'

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-rca-primary focus:outline-none focus:ring-1 focus:ring-rca-primary"
      />
    </div>
  )
}
