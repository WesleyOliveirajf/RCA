import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Zap, ArrowLeft, Loader2 } from 'lucide-react'

export function RegisterPage() {
  const { signUp } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp(email, password, nome)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="w-full max-w-md text-center animate-fade-in-up">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <Zap size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Conta criada!</h2>
          <p className="mt-3 text-sm text-slate-500">
            Verifique seu e-mail e confirme o cadastro. Após confirmar, volte para fazer login.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-rca-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rca-primary/90"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col items-center justify-center gradient-sidebar relative overflow-hidden p-12">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 max-w-lg text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm shadow-2xl shadow-indigo-900/30 animate-float">
            <Zap size={36} className="text-indigo-200" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight animate-fade-in-up">
            Sistema RCA
          </h1>
          <p className="mt-3 text-lg text-indigo-200/80 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Crie sua conta para acessar o sistema
          </p>
        </div>
        <p className="absolute bottom-6 text-xs text-indigo-400/40">
          © 2026 RCA — Todos os direitos reservados
        </p>
      </div>

      <div className="flex w-full lg:w-1/2 xl:w-[45%] items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-indigo-200">
              <Zap size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sistema RCA</h1>
            <p className="text-sm text-slate-400">Reativação Comercial Automatizada</p>
          </div>

          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar para login
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Criar conta</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Preencha os dados para se cadastrar
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-fade-in-down">
              <div className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="register-nome" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome
              </label>
              <input
                id="register-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                className="input"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input pr-10"
                  required
                  minLength={6}
                  autoComplete="new-password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
