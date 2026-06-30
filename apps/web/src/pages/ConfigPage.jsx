import { RefreshCw, BarChart2, Users, Bell, AlertCircle } from 'lucide-react'
import { useUsuarios } from '@/hooks/useUsuarios'
import { useDashboard } from '@/hooks/useDashboard'
import { useSync } from '@/hooks/useSync'

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-rca-primary">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function FieldRow({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-slate-50 py-3 first:border-none first:pt-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function formatSyncStatus(syncStatus) {
  if (!syncStatus?.ultima_sync) return 'Nenhuma sincronização registrada'
  const data = new Date(syncStatus.ultima_sync)
  const hora = data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const ok = syncStatus.status === 'sucesso'
  return `${ok ? 'Sucesso' : syncStatus.status ?? 'Desconhecido'} — ${hora}`
}

export function ConfigPage() {
  const { usuarios, loading: loadingUsuarios, error: errorUsuarios } = useUsuarios()
  const { syncStatus, refetch: refetchDashboard } = useDashboard()
  const { executar: executarSync, loading: syncing, error: syncError, lastResult } = useSync()

  async function handleSync() {
    await executarSync()
    refetchDashboard()
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">Parâmetros globais do sistema RCA</p>
      </div>

      <Section icon={RefreshCw} title="Sincronização SISPLAN" description="Configurações da integração com Excel/SISPLAN">
        <FieldRow label="Intervalo de sync" hint="A cada quantas horas sincronizar automaticamente">
          <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-rca-primary focus:outline-none">
            <option>A cada 4 horas</option>
            <option>A cada 8 horas</option>
            <option>Diariamente</option>
          </select>
        </FieldRow>
        <FieldRow label="Último sync" hint="Status da última sincronização">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            syncStatus?.status === 'sucesso'
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {formatSyncStatus(syncStatus)}
          </span>
        </FieldRow>
        <FieldRow label="Caminho do arquivo" hint="Planilha ODBC configurada em SISPLAN_EXCEL_PATH">
          <input
            type="text"
            readOnly
            defaultValue="odbc/Carteira por Representante.xlsx"
            className="w-64 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
          />
        </FieldRow>
        {syncError && (
          <p className="mt-2 text-xs text-red-600">{syncError}</p>
        )}
        {lastResult?.status === 'sucesso' && (
          <p className="mt-2 text-xs text-green-600">
            Sync concluído — {lastResult.novos} novos, {lastResult.atualizados} atualizados
          </p>
        )}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg border border-rca-primary px-4 py-2 text-sm font-medium text-rca-primary hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>
        </div>
      </Section>

      <Section icon={BarChart2} title="Pesos do Score de Qualificação" description="Define como o score total é calculado (soma deve ser 100%)">
        {[
          { label: 'Interesse', key: 'interesse', default: 40 },
          { label: 'Volume potencial', key: 'volume', default: 35 },
          { label: 'Prazo de fechamento', key: 'prazo', default: 25 },
        ].map(({ label, key, default: def }) => (
          <FieldRow key={key} label={label} hint={`Peso atual: ${def}%`}>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={60}
                defaultValue={def}
                step={5}
                className="w-28 accent-rca-primary"
              />
              <span className="w-8 text-right text-sm font-medium text-slate-700">{def}%</span>
            </div>
          </FieldRow>
        ))}
      </Section>

      <Section icon={Bell} title="Notificações" description="Configurar alertas e lembretes">
        <FieldRow label="Lembrete de próximo contato" hint="Notificar X horas antes do contato agendado">
          <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-rca-primary focus:outline-none">
            <option>1 hora antes</option>
            <option>2 horas antes</option>
            <option>No dia</option>
          </select>
        </FieldRow>
        <FieldRow label="Alertas de inatividade" hint="Avisar sobre leads sem contato por X dias">
          <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-rca-primary focus:outline-none">
            <option>7 dias</option>
            <option>14 dias</option>
            <option>30 dias</option>
          </select>
        </FieldRow>
      </Section>

      <Section icon={Users} title="Usuários" description="Equipe com acesso ao sistema">
        {errorUsuarios && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertCircle size={14} />
            {errorUsuarios}
          </div>
        )}
        {loadingUsuarios ? (
          <p className="py-4 text-sm text-slate-400">Carregando usuários...</p>
        ) : usuarios.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">Nenhum usuário encontrado</p>
        ) : (
          <div className="space-y-0 divide-y divide-slate-50">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-rca-primary">
                    {u.nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.nome}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
                  {u.perfil}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="flex justify-end">
        <button className="rounded-lg bg-rca-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-rca-primary-dark transition-colors shadow-soft-sm">
          Salvar configurações
        </button>
      </div>
    </div>
  )
}
