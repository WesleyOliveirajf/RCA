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
  { id: 'em_analise', label: 'Em Análise', cor: 'orange' },
  { id: 'lead_qualificado', label: 'Lead qualificado', cor: 'teal' },
  { id: 'nutricao', label: 'Nutrição', cor: 'sky' },
  { id: 'negociacao', label: 'Negociação', cor: 'amber' },
  { id: 'pos_venda', label: 'Pós-venda', cor: 'green' },
]

/** Espelha pipeline_cards.etapa em clientes.status (listagem de Clientes). */
export const ETAPA_PARA_STATUS = {
  inativos: 'inativo',
  primeiro_contato: 'em_contato',
  em_analise: 'em_contato',
  lead_qualificado: 'qualificado',
  nutricao: 'qualificado',
  negociacao: 'negociando',
  pos_venda: 'reativado',
}

export function statusFromEtapa(etapa) {
  return ETAPA_PARA_STATUS[etapa] ?? null
}

/** Funil compartilhado: qualquer usuário autenticado pode ver e mover cards nestas etapas */
export const ETAPAS_FUNIL_ABERTO = ['inativos', 'primeiro_contato', 'em_analise', 'lead_qualificado']

export function etapaFunilAberto(etapa) {
  return true
}

export function precisaLiberacaoParaMover({ etapaAtual, etapaDestino, liberado }) {
  return false
}

export function podeInteragirComCard({ perfil, responsavelId, userId, etapaAtual }) {
  return true
}

export function podeMoverParaEtapa({ perfil, responsavelId, userId, etapaDestino }) {
  return true
}

export function podeMoverCard(ctx) {
  return true
}

export const MSG_LEAD_NAO_LIBERADO =
  'Movimentação liberada para qualquer etapa do pipeline.'

export function podeLiberar({ perfil, etapaAtual, liberado }) {
  return true
}

export const PRIORIDADE_CORES = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-amber-100 text-amber-700',
  urgente: 'bg-red-100 text-red-700',
}

const COLUMN_ORDER_KEY = 'rca_kanban_column_order'
const CUSTOM_COLUMNS_KEY = 'rca_kanban_custom_columns'

export function getCustomColumns() {
  try {
    const stored = localStorage.getItem(CUSTOM_COLUMNS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return []
}

export function saveCustomColumns(columns) {
  try {
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns))
  } catch { /* ignore */ }
}

export function getPipelineColumns() {
  return [...ETAPAS, ...getCustomColumns()]
}

export function getColumnOrder() {
  try {
    const stored = localStorage.getItem(COLUMN_ORDER_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return getPipelineColumns().map((e) => e.id)
}

export function saveColumnOrder(order) {
  try {
    localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order))
  } catch { /* ignore */ }
}

export function orderedEtapas(order, columns = getPipelineColumns()) {
  const etapaMap = Object.fromEntries(columns.map((e) => [e.id, e]))
  const ordered = order.map((id) => etapaMap[id]).filter(Boolean)
  const missing = columns.filter((col) => !order.includes(col.id))
  return [...ordered, ...missing]
}

export function createCustomColumn(label) {
  const normalized = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const id = `custom_${normalized || 'coluna'}_${Date.now().toString(36)}`
  return { id, label: label.trim(), cor: 'slate', custom: true }
}

const COLUMN_LABELS_KEY = 'rca_kanban_column_labels'

export function getColumnLabels() {
  try {
    const stored = localStorage.getItem(COLUMN_LABELS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return {}
}

export function saveColumnLabels(labels) {
  try {
    localStorage.setItem(COLUMN_LABELS_KEY, JSON.stringify(labels))
  } catch { /* ignore */ }
}

