import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Zap, ArrowRight, Loader2 } from 'lucide-react'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: Gradient + branding ── */}
      <div className="
        hidden lg:flex lg:w-1/2 xl:w-[55%]
        flex-col items-center justify-center
        gradient-sidebar relative overflow-hidden
        p-12
      ">
        {/* Decorative shapes */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-violet-500/8 blur-2xl animate-float" />

        <div className="relative z-10 max-w-lg text-center">
          {/* Logo */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm shadow-2xl shadow-indigo-900/30 animate-float">
            <Zap size={36} className="text-indigo-200" />
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight animate-fade-in-up">
            Sistema RCA
          </h1>
          <p className="mt-3 text-lg text-indigo-200/80 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Reativação Comercial Automatizada
          </p>

          <div className="mt-10 space-y-4 text-left animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {[
              { title: 'Pipeline Kanban', desc: 'Gerencie leads inativos com drag-and-drop visual' },
              { title: 'Sync Automático', desc: 'Integração direta com SISPLAN via ODBC' },
              { title: 'Automações N8N', desc: 'WhatsApp, email e alertas automáticos' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl bg-white/8 backdrop-blur-sm p-4 border border-white/5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <ArrowRight size={14} className="text-indigo-300" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-xs text-indigo-300/70 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-center text-xs text-indigo-400/40">
          © 2026 RCA — Todos os direitos reservados
          <br />
          Criado por Wesley Oliveira
        </p>
      </div>

      {/* ── Right panel: Login form ── */}
      <div className="flex w-full lg:w-1/2 xl:w-[45%] items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-indigo-200">
              <Zap size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sistema RCA</h1>
            <p className="text-sm text-slate-400">Reativação Comercial Automatizada</p>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-fade-in-down">
              <div className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Usuário
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu nome de usuário"
                className="input"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="mt-6 text-center text-xs text-slate-300">
              Sistema RCA — Acesso restrito a usuários autorizados
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
