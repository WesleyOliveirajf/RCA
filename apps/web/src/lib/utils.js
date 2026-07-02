export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export const ETAPAS = [
  { id: 'inativos', label: 'Inativos', cor: 'purple' },
  { id: 'primeiro_contato', label: '1º Contato', cor: 'blue' },
  { id: 'lead_qualificado', label: 'Lead qualificado', cor: 'teal' },
  { id: 'negociacao', label: 'Negociação', cor: 'amber' },
  { id: 'pos_venda', label: 'Pós-venda', cor: 'green' },
  { id: 'banco_potenciais', label: 'Banco potenciais', cor: 'gray' },
  { id: 'desqualificados', label: 'Desqualificados', cor: 'red' },
]

/** Espelha pipeline_cards.etapa em clientes.status (listagem de Clientes). */
export const ETAPA_PARA_STATUS = {
  inativos: 'inativo',
  primeiro_contato: 'em_contato',
  lead_qualificado: 'qualificado',
  negociacao: 'negociando',
  pos_venda: 'reativado',
  banco_potenciais: 'descartado',
  desqualificados: 'desqualificado',
}

export function statusFromEtapa(etapa) {
  return ETAPA_PARA_STATUS[etapa] ?? null
}

/** Funil compartilhado: qualquer usuário autenticado pode ver e mover cards nestas etapas */
export const ETAPAS_FUNIL_ABERTO = ['inativos', 'primeiro_contato', 'lead_qualificado']

export function etapaFunilAberto(etapa) {
  return ETAPAS_FUNIL_ABERTO.includes(etapa)
}

/** Lead em lead_qualificado só avança após liberação admin */
export function precisaLiberacaoParaMover({ etapaAtual, etapaDestino, liberado }) {
  if (etapaAtual !== 'lead_qualificado') return false
  if (etapaFunilAberto(etapaDestino)) return false
  return !liberado
}

export function podeInteragirComCard({ perfil, responsavelId, userId, etapaAtual }) {
  if (etapaFunilAberto(etapaAtual)) return true
  if (perfil === 'supervisor' || perfil === 'admin' || perfil === 'superadmin') return true
  return responsavelId === userId
}

export function podeMoverParaEtapa({ perfil, responsavelId, userId, etapaDestino }) {
  if (etapaFunilAberto(etapaDestino)) return true
  if (perfil === 'supervisor' || perfil === 'admin' || perfil === 'superadmin') return true
  return responsavelId === userId
}

export function podeMoverCard(ctx) {
  if (precisaLiberacaoParaMover(ctx)) return false
  return podeInteragirComCard(ctx) && podeMoverParaEtapa(ctx)
}

export const MSG_LEAD_NAO_LIBERADO =
  'Lead bloqueado. Um administrador precisa liberar antes de avançar para esta etapa.'

/** Somente admins podem liberar leads na etapa lead_qualificado */
export function podeLiberar({ perfil, etapaAtual, liberado }) {
  return (perfil === 'admin' || perfil === 'superadmin') && etapaAtual === 'lead_qualificado' && !liberado
}

export const PRIORIDADE_CORES = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-amber-100 text-amber-700',
  urgente: 'bg-red-100 text-red-700',
}

