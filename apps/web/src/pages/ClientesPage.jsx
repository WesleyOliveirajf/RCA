import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, RefreshCw, AlertCircle, Plus, X, Loader2 } from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge, STATUS_BADGE } from '@/components/common/Badge'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'

const FILTROS_STATUS = [
  { value: '',           label: 'Todos' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'inativo',    label: 'Inativos' },
  { value: 'qualificado', label: 'Qualificados' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'reativado',  label: 'Reativados' },
  { value: 'descartado', label: 'Descartados' },
  { value: 'desqualificado', label: 'Desqualificados' },
]

const CLIENTE_INICIAL = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
  cidade: '',
  estado: '',
  segmento: '',
}

export function ClientesPage() {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [novoCliente, setNovoCliente] = useState(CLIENTE_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erroCadastro, setErroCadastro] = useState(null)

  const filtrosApi = useMemo(
    () => (filtroStatus ? { status: filtroStatus, limite: 200 } : { limite: 200 }),
    [filtroStatus]
  )

  const { clientes, loading, error, criarCliente, refetch } = useClientes(filtrosApi)

  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes
    const q = busca.toLowerCase()
    return clientes.filter(
      (c) =>
        (c.nome_fantasia ?? c.razao_social).toLowerCase().includes(q) ||
        c.cnpj?.toLowerCase().includes(q) ||
        c.telefone?.toLowerCase().includes(q) ||
        c.cidade?.toLowerCase().includes(q) ||
        c.segmento?.toLowerCase().includes(q),
    )
  }, [clientes, busca])

  async function handleCriarCliente(event) {
    event.preventDefault()
    const razaoSocial = novoCliente.razao_social.trim()

    if (!razaoSocial) {
      setErroCadastro('Informe a razão social do cliente.')
      return
    }

    if (novoCliente.email && !novoCliente.email.includes('@')) {
      setErroCadastro('Informe um e-mail válido ou deixe o campo vazio.')
      return
    }

    const payload = Object.fromEntries(
      Object.entries({ ...novoCliente, razao_social: razaoSocial, status: 'inativo' })
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => value !== '')
    )

    setSalvando(true)
    setErroCadastro(null)
    try {
      await criarCliente(payload)
      setNovoCliente(CLIENTE_INICIAL)
      setModalAberto(false)
      await refetch()
    } catch (err) {
      setErroCadastro(err.message ?? 'Não foi possível cadastrar o cliente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Carregando...' : `${clientes.length} clientes importados do SISPLAN`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-rca-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-rca-primary/90"
          >
            <Plus size={14} />
            Novo cliente
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="btn-ghost btn-sm text-slate-400 hover:text-rca-primary"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome, CNPJ, telefone, cidade..." />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTROS_STATUS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroStatus === f.value
                  ? 'bg-rca-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-rca-lg border border-slate-100 bg-white shadow-soft-sm">
        {loading && clientes.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <RefreshCw size={16} className="mr-2 animate-spin" />
            Carregando clientes...
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Cliente</th>
                  <th className="px-4 py-3 font-medium text-slate-600 hidden xl:table-cell">CNPJ</th>
                  <th className="px-4 py-3 font-medium text-slate-600 hidden xl:table-cell">Telefone</th>
                  <th className="px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Segmento</th>
                  <th className="px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Cidade/UF</th>
                  <th className="px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Última compra</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Valor hist.</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clientesFiltrados.map((c) => {
                  const badgeCfg = STATUS_BADGE[c.status] ?? { variant: 'default', label: c.status }
                  return (
                    <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/clientes/${c.id}`}
                          className="font-medium text-rca-primary hover:underline"
                        >
                          {c.nome_fantasia ?? c.razao_social}
                        </Link>
                        <p className="text-xs text-slate-400">{c.razao_social}</p>
                        <div className="mt-1 space-y-0.5 text-xs text-slate-500 xl:hidden">
                          <p>CNPJ: {c.cnpj ?? '—'}</p>
                          <p>Telefone: {c.telefone ?? '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden xl:table-cell">{c.cnpj ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 hidden xl:table-cell">{c.telefone ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{c.segmento ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {c.cidade ? `${c.cidade}, ${c.estado}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{formatDate(c.ultima_compra)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(c.valor_historico)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeCfg.variant} dot>{badgeCfg.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {clientesFiltrados.length === 0 && (
              <EmptyState
                icon={Users}
                title="Nenhum cliente encontrado"
                description="Ajuste os filtros ou tente outra busca."
              />
            )}

            {clientesFiltrados.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
                {clientesFiltrados.length} de {clientes.length} clientes
              </div>
            )}
          </>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cadastrar cliente manualmente</h2>
                <p className="text-xs text-slate-500">Cliente criado fora da importação SISPLAN.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="btn-ghost btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCriarCliente} className="space-y-4 px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Razão social *" value={novoCliente.razao_social} onChange={(value) => setNovoCliente((prev) => ({ ...prev, razao_social: value }))} />
                <Field label="Nome fantasia" value={novoCliente.nome_fantasia} onChange={(value) => setNovoCliente((prev) => ({ ...prev, nome_fantasia: value }))} />
                <Field label="CNPJ" value={novoCliente.cnpj} onChange={(value) => setNovoCliente((prev) => ({ ...prev, cnpj: value }))} />
                <Field label="Telefone" value={novoCliente.telefone} onChange={(value) => setNovoCliente((prev) => ({ ...prev, telefone: value }))} />
                <Field label="E-mail" type="email" value={novoCliente.email} onChange={(value) => setNovoCliente((prev) => ({ ...prev, email: value }))} />
                <Field label="Segmento" value={novoCliente.segmento} onChange={(value) => setNovoCliente((prev) => ({ ...prev, segmento: value }))} />
                <Field label="Cidade" value={novoCliente.cidade} onChange={(value) => setNovoCliente((prev) => ({ ...prev, cidade: value }))} />
                <Field label="Estado" value={novoCliente.estado} onChange={(value) => setNovoCliente((prev) => ({ ...prev, estado: value }))} />
              </div>

              <Field label="Endereço" value={novoCliente.endereco} onChange={(value) => setNovoCliente((prev) => ({ ...prev, endereco: value }))} />

              {erroCadastro && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {erroCadastro}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-rca-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rca-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando && <Loader2 size={16} className="animate-spin" />}
                  Salvar cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block space-y-1 text-xs font-medium text-slate-500">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
      />
    </label>
  )
}
