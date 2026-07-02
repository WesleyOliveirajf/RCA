import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Plus, Loader2, AlertCircle, X, RefreshCw, Trash2 } from 'lucide-react'

const PERFIL_INICIAL = {
  username: '',
  nome: '',
  password: '',
  perfil: 'vendedor',
}

const PERFIL_OPTIONS = [
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
]

const PERFIL_COLORS = {
  superadmin: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700',
  vendedor: 'bg-slate-100 text-slate-700',
}

export function UsuariosPage() {
  const { profile } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(PERFIL_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const [editandoId, setEditandoId] = useState(null)

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      let data
      try {
        data = await api.get('/api/usuarios')
      } catch {
        const { data: sbData, error: sbErr } = await supabase
          .from('usuarios')
          .select('*')
          .order('nome')
        if (sbErr) throw sbErr
        data = sbData
      }
      setUsuarios(data ?? [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile?.perfil === 'admin' || profile?.perfil === 'superadmin') fetchUsuarios()
  }, [profile, fetchUsuarios])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.nome.trim()) {
      setErroForm('Usuário e nome são obrigatórios.')
      return
    }
    if (!editandoId && form.password.length < 6) {
      setErroForm('Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSalvando(true)
    setErroForm(null)
    try {
      if (editandoId) {
        try {
          await api.patch(`/api/usuarios/${editandoId}`, {
            username: form.username.trim(),
            nome: form.nome.trim(),
            perfil: form.perfil,
            ativo: form.ativo,
          })
        } catch {
          const { error: updErr } = await supabase
            .from('usuarios')
            .update({ username: form.username.trim(), nome: form.nome.trim(), perfil: form.perfil, ativo: form.ativo })
            .eq('id', editandoId)
          if (updErr) throw updErr
        }
      } else {
        const { error: rpcErr } = await supabase.rpc('fn_admin_create_user', {
          p_username: form.username.trim(),
          p_password: form.password,
          p_nome: form.nome.trim(),
          p_perfil: form.perfil,
        })
        if (rpcErr) throw new Error(rpcErr.message)
      }
      setForm(PERFIL_INICIAL)
      setModalAberto(false)
      setEditandoId(null)
      await fetchUsuarios()
    } catch (err) {
      setErroForm(err.message ?? 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  function openEdit(usuario) {
    setForm({
      username: usuario.username || '',
      nome: usuario.nome,
      password: '',
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    })
    setEditandoId(usuario.id)
    setModalAberto(true)
  }

  function openCreate() {
    setForm(PERFIL_INICIAL)
    setEditandoId(null)
    setModalAberto(true)
  }

  async function toggleAtivo(usuario) {
    const novoAtivo = !usuario.ativo
    try {
      await api.patch(`/api/usuarios/${usuario.id}`, { ativo: novoAtivo })
    } catch {
      const { error: updErr } = await supabase
        .from('usuarios')
        .update({ ativo: novoAtivo })
        .eq('id', usuario.id)
      if (updErr) throw updErr
    }
    await fetchUsuarios()
  }

  if (profile?.perfil !== 'admin' && profile?.perfil !== 'superadmin') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Acesso restrito a administradores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Carregando...' : `${usuarios.length} usuários cadastrados`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-xl bg-rca-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-rca-primary/90"
          >
            <Plus size={14} />
            Novo usuário
          </button>
          <button
            onClick={fetchUsuarios}
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

      <div className="overflow-hidden rounded-rca-lg border border-slate-100 bg-white shadow-soft-sm">
        {loading && usuarios.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <RefreshCw size={16} className="mr-2 animate-spin" />
            Carregando usuários...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Usuário</th>
                <th className="px-4 py-3 font-medium text-slate-600">Nome</th>
                <th className="px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Perfil</th>
                <th className="px-4 py-3 font-medium text-slate-600">Ativo</th>
                <th className="px-4 py-3 font-medium text-slate-600 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map((u) => (
                <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="font-medium text-rca-primary hover:underline text-left"
                    >
                      {u.username || u.email?.split('@')[0] || '-'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.nome}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PERFIL_COLORS[u.perfil] || PERFIL_COLORS.vendedor}`}>
                      {u.perfil}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleAtivo(u)}
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        u.ativo
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="btn-ghost btn-icon text-slate-300 hover:text-rca-primary"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editandoId ? 'Editar usuário' : 'Novo usuário'}
              </h2>
              <button type="button" onClick={() => setModalAberto(false)} className="btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <label className="block space-y-1 text-xs font-medium text-slate-500">
                Usuário
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                  required
                  disabled={!!editandoId}
                  autoFocus
                />
              </label>

              <label className="block space-y-1 text-xs font-medium text-slate-500">
                Nome
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                  required
                />
              </label>

              <label className="block space-y-1 text-xs font-medium text-slate-500">
                {editandoId ? 'Nova senha (deixe vazio para manter)' : 'Senha'}
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                  minLength={editandoId ? 0 : 6}
                />
              </label>

              <label className="block space-y-1 text-xs font-medium text-slate-500">
                Perfil
                <select
                  value={form.perfil}
                  onChange={(e) => setForm((p) => ({ ...p, perfil: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                >
                  {PERFIL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>

              {erroForm && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {erroForm}
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
                  {editandoId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
