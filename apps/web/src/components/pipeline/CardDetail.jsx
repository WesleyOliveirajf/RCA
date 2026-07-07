import { useState, useEffect } from 'react'
import {
  X,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  TrendingUp,
  Clock,
  Tag,
  User,
  FileText,
  ShieldCheck,
  Lock,
  Loader2,
  Send,
  CheckCircle2,
  Building2,
  UserCheck,
  FileCheck,
  Briefcase,
  Bell,
} from 'lucide-react'
import { formatCurrency, formatDate, getPipelineColumns, podeLiberar } from '@/lib/utils'
import { useContatos } from '@/hooks/useContatos'
import { useHistoricoCliente } from '@/hooks/useClientes'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
import { sbCreateLeadTarefa } from '@/lib/supabaseData'

const TABS = [
  { id: 'dados', label: 'Dados', icon: User },
  { id: 'contatos', label: 'Contatos', icon: MessageSquare },
  { id: 'historico', label: 'Compras', icon: TrendingUp },
]

const TIPO_ICONS = {
  ligacao: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  visita: MapPin,
  pos_venda: TrendingUp,
  sistema: FileText,
}

const RESULTADO_COLORS = {
  sem_resposta: 'bg-slate-100 text-slate-600',
  interessado: 'bg-emerald-50 text-emerald-600',
  sem_interesse: 'bg-red-50 text-red-600',
  agendar_retorno: 'bg-blue-50 text-blue-600',
  pedido_realizado: 'bg-green-50 text-green-700',
  reclamacao: 'bg-amber-50 text-amber-600',
  outro: 'bg-slate-100 text-slate-500',
}

const TIPO_OPTIONS = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'visita', label: 'Visita' },
  { value: 'pos_venda', label: 'Pós-venda' },
]

const RESULTADO_OPTIONS = [
  { value: '', label: 'Sem resultado definido' },
  { value: 'sem_resposta', label: 'Sem resposta' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'sem_interesse', label: 'Sem interesse' },
  { value: 'agendar_retorno', label: 'Agendar retorno' },
  { value: 'pedido_realizado', label: 'Pedido realizado' },
  { value: 'reclamacao', label: 'Reclamação' },
  { value: 'outro', label: 'Outro' },
]

const CONTATO_INICIAL = {
  tipo: 'ligacao',
  nome_contato: '',
  area_contato: '',
  resultado: '',
  resumo: '',
  duracao_minutos: '',
  proximo_contato: '',
  tarefa_agendada_para: '',
  tarefa_titulo: '',
}

const DESQUALIFICACAO_INICIAL = {
  motivo: '',
  observacoes: '',
  qualificacao_minima: false,
}

const MOTIVOS_DESQUALIFICACAO = [
  {
    value: 'timing_ruim',
    label: 'Agora não',
    help: 'Vai para nutrição educacional e cria tarefa de requalificação em 90 dias.',
  },
  {
    value: 'decisor_errado',
    label: 'Pessoa errada',
    help: 'Vai para nutrição até mapear o decisor correto e cria tarefa em 90 dias.',
  },
  {
    value: 'nao_icp',
    label: 'Não tem perfil',
    help: 'Bloqueia comunicações ativas e marca retenção curta por LGPD.',
  },
  {
    value: 'outro',
    label: 'Outro motivo',
    help: 'Sai do pipeline comercial e fica registrado para revisão.',
  },
]

const CHECKLIST_CONFIRMADO = {
  necessidade_identificada: true,
  potencial_ou_orcamento_validado: true,
  decisor_mapeado: true,
  timing_mapeado: true,
}

export function CardDetail({ card, onClose, onLiberar, onDesqualificar, onCardUpdate, liberando = false, desqualificando = false }) {
  const [activeTab, setActiveTab] = useState('dados')
  const [contatoForm, setContatoForm] = useState(CONTATO_INICIAL)
  const [salvandoContato, setSalvandoContato] = useState(false)
  const [erroContato, setErroContato] = useState(null)
  const [showDesqualificacao, setShowDesqualificacao] = useState(false)
  const [desqualificacaoForm, setDesqualificacaoForm] = useState(DESQUALIFICACAO_INICIAL)
  const [erroDesqualificacao, setErroDesqualificacao] = useState(null)
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [clienteEdit, setClienteEdit] = useState({})
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const { contatos, loading: loadingContatos, registrar } = useContatos(card.cliente_id)
  const { historico, loading: loadingHistorico } = useHistoricoCliente(card.cliente_id)
  const { user, profile } = useAuth()
  const liberadorNome = useLiberadorNome(card.liberado_por, user?.id, profile?.nome)
  const cliente = card.cliente
  const etapaInfo = getPipelineColumns().find((e) => e.id === card.etapa)
  const showLiberacao = card.etapa === 'lead_qualificado'
  const canRelease = podeLiberar({
    perfil: profile?.perfil,
    etapaAtual: card.etapa,
    liberado: card.liberado,
  })

  async function handleContatoSubmit(event) {
    event.preventDefault()
    const resumo = contatoForm.resumo.trim()

    if (resumo.length < 3) {
      setErroContato('Digite um relato com pelo menos 3 caracteres.')
      return
    }

    setSalvandoContato(true)
    setErroContato(null)

    try {
      await registrar({
        cliente_id: card.cliente_id,
        card_id: card.id,
        tipo: contatoForm.tipo,
        nome_contato: contatoForm.nome_contato.trim() || null,
        area_contato: contatoForm.area_contato.trim() || null,
        resumo,
        resultado: contatoForm.resultado || null,
        duracao_minutos: contatoForm.duracao_minutos
          ? Number(contatoForm.duracao_minutos)
          : null,
        proximo_contato: contatoForm.proximo_contato || null,
        tarefa_agendada_para: contatoForm.tarefa_agendada_para || null,
        tarefa_titulo: contatoForm.tarefa_titulo || null,
      })
      let novaTarefa = null
      if (contatoForm.tarefa_agendada_para) {
        novaTarefa = await sbCreateLeadTarefa({
          card_id: card.id,
          cliente_id: card.cliente_id,
          titulo: contatoForm.tarefa_titulo?.trim() || 'Retornar contato com o lead',
          descricao: resumo,
          agendado_para: contatoForm.tarefa_agendada_para,
          tipo: 'contato',
        })
        onCardUpdate?.({
          ...card,
          proximo_contato: contatoForm.tarefa_agendada_para.slice(0, 10),
          tarefas_pendentes: [
            ...(card.tarefas_pendentes || []),
            novaTarefa,
          ].sort((a, b) => new Date(a.agendado_para || a.vencimento) - new Date(b.agendado_para || b.vencimento)),
        })
      }
      setContatoForm(CONTATO_INICIAL)
    } catch (err) {
      setErroContato(err.message ?? 'Não foi possível salvar o relato.')
    } finally {
      setSalvandoContato(false)
    }
  }

  async function handleDesqualificacaoSubmit(event) {
    event.preventDefault()

    if (!desqualificacaoForm.motivo) {
      setErroDesqualificacao('Escolha um motivo para desqualificar.')
      return
    }
    if (!desqualificacaoForm.qualificacao_minima) {
      setErroDesqualificacao('Confirme que você fez a qualificação mínima.')
      return
    }
    if (desqualificacaoForm.observacoes.trim().length < 10) {
      setErroDesqualificacao('Conte rapidamente o que aconteceu com pelo menos 10 caracteres.')
      return
    }

    try {
      setErroDesqualificacao(null)
      await onDesqualificar?.(card.id, {
        motivo: desqualificacaoForm.motivo,
        checklist: CHECKLIST_CONFIRMADO,
        observacoes: desqualificacaoForm.observacoes.trim(),
      })
      setDesqualificacaoForm(DESQUALIFICACAO_INICIAL)
      setShowDesqualificacao(false)
    } catch (err) {
      setErroDesqualificacao(err.message ?? 'Não foi possível desqualificar o lead.')
    }
  }

  async function updateChecklistField(field, value) {
    try {
      await supabase.from('pipeline_cards').update({ [field]: value }).eq('id', card.id)
    } catch { /* fallback silencioso */ }
    onCardUpdate?.({ ...card, [field]: value })
  }

  function openEditCliente() {
    setClienteEdit({
      nome_fantasia: cliente?.nome_fantasia || '',
      nome_contato: cliente?.nome_contato || '',
      cnpj: cliente?.cnpj || '',
      telefone: cliente?.telefone || '',
      email: cliente?.email || '',
      cidade: cliente?.cidade || '',
      estado: cliente?.estado || '',
      segmento: cliente?.segmento || '',
    })
    setEditandoCliente(true)
  }

  async function saveClienteEdit(event) {
    event.preventDefault()
    setSalvandoCliente(true)
    try {
      await supabase.from('clientes').update(clienteEdit).eq('id', cliente.id)
      onCardUpdate?.({
        ...card,
        cliente: { ...cliente, ...clienteEdit },
      })
      setEditandoCliente(false)
    } catch {
      /* erro silencioso */
    } finally {
      setSalvandoCliente(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="
        fixed right-0 top-0 z-50 h-screen w-full max-w-lg
        bg-white shadow-2xl
        animate-slide-right
        flex flex-col
        overflow-hidden
      " style={{ animationDuration: '0.3s' }}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {cliente?.nome_fantasia || 'Cliente'}
            </h2>
            <p className="text-xs text-slate-400 truncate">{cliente?.razao_social}</p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost btn-icon shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Quick info bar ── */}
        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6 py-3 bg-slate-50/50">
          <div className="text-center">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Etapa</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{etapaInfo?.label}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Score</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{card.score || '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Proposta</p>
            <p className="text-xs font-semibold text-emerald-600 mt-0.5">
              {card.valor_proposta ? formatCurrency(card.valor_proposta) : '—'}
            </p>
          </div>
        </div>

        {showLiberacao && (
          <LiberacaoBanner
            card={card}
            liberadorNome={liberadorNome}
            canRelease={canRelease}
            liberando={liberando}
            onLiberar={() => onLiberar?.(card.id)}
          />
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-100 px-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1.5 px-3 py-3 text-sm font-medium
                border-b-2 transition-all -mb-px
                ${activeTab === id
                  ? 'border-rca-primary text-rca-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
                }
              `}
            >
              <Icon size={14} />
              {label}
              {id === 'contatos' && contatos.length > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
                  {contatos.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dados' && (
            <div className="space-y-5 animate-fade-in">
              {/* Client info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Informações do Cliente
                  </h3>
                  {!editandoCliente && (
                    <button
                      type="button"
                      onClick={openEditCliente}
                      className="text-xs font-medium text-rca-primary hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editandoCliente ? (
                  <form onSubmit={saveClienteEdit} className="space-y-2">
                    <EditField label="Nome fantasia" value={clienteEdit.nome_fantasia} onChange={(v) => setClienteEdit((p) => ({ ...p, nome_fantasia: v }))} />
                    <EditField label="Pessoa de contato" value={clienteEdit.nome_contato} onChange={(v) => setClienteEdit((p) => ({ ...p, nome_contato: v }))} />
                    <EditField label="CNPJ" value={clienteEdit.cnpj} onChange={(v) => setClienteEdit((p) => ({ ...p, cnpj: v }))} />
                    <EditField label="Telefone" value={clienteEdit.telefone} onChange={(v) => setClienteEdit((p) => ({ ...p, telefone: v }))} />
                    <EditField label="E-mail" type="email" value={clienteEdit.email} onChange={(v) => setClienteEdit((p) => ({ ...p, email: v }))} />
                    <div className="grid grid-cols-2 gap-2">
                      <EditField label="Cidade" value={clienteEdit.cidade} onChange={(v) => setClienteEdit((p) => ({ ...p, cidade: v }))} />
                      <EditField label="Estado" value={clienteEdit.estado} onChange={(v) => setClienteEdit((p) => ({ ...p, estado: v }))} />
                    </div>
                    <EditField label="Segmento" value={clienteEdit.segmento} onChange={(v) => setClienteEdit((p) => ({ ...p, segmento: v }))} />
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={salvandoCliente} className="rounded-lg bg-rca-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-rca-primary/90 disabled:opacity-60">
                        {salvandoCliente ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button type="button" onClick={() => setEditandoCliente(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <InfoRow icon={User} label="CNPJ" value={cliente?.cnpj} />
                    <InfoRow icon={User} label="Contato" value={cliente?.nome_contato || '-'} />
                    <InfoRow icon={Phone} label="Telefone" value={cliente?.telefone} isLink={`tel:${cliente?.telefone}`} />
                    <InfoRow icon={Mail} label="E-mail" value={cliente?.email} isLink={`mailto:${cliente?.email}`} />
                    <InfoRow icon={MapPin} label="Cidade" value={`${cliente?.cidade}/${cliente?.estado}`} />
                    <InfoRow icon={Tag} label="Segmento" value={cliente?.segmento} />
                  </>
                )}
              </div>

              {/* Financial summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Histórico Financeiro
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Total Compras" value={formatCurrency(cliente?.valor_historico)} />
                  <MiniStat label="Nº Pedidos" value={cliente?.qtd_compras} />
                  <MiniStat label="Última Compra" value={formatDate(cliente?.ultima_compra)} />
                </div>
              </div>

              {/* Checklist de qualificação */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Checklist de Qualificação
                </h3>
                <CheckItem
                  label="Cliente demonstrou interesse"
                  checked={card.tem_interesse}
                  onChange={(value) => updateChecklistField('tem_interesse', value)}
                  icon={UserCheck}
                />
                <CheckItem
                  label="Catálogo enviado"
                  checked={card.catalogo_enviado}
                  onChange={(value) => updateChecklistField('catalogo_enviado', value)}
                  icon={FileCheck}
                />
                <CheckItem
                  label="Atualização cadastral feita"
                  checked={card.atualizacao_cadastral}
                  onChange={(value) => updateChecklistField('atualizacao_cadastral', value)}
                  icon={FileText}
                />
                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2">
                  <Briefcase size={14} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-600 flex-1">Tipo de contato</span>
                  <select
                    value={card.tipo_contato_cliente || ''}
                    onChange={(e) => updateChecklistField('tipo_contato_cliente', e.target.value || null)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-rca-primary"
                  >
                    <option value="">—</option>
                    <option value="representante">Representante</option>
                    <option value="direto">Direto</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              {cliente?.tags?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cliente.tags.map((tag) => (
                      <span key={tag} className="badge bg-indigo-50 text-indigo-600">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {card.notas && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notas</h3>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3">
                    {card.notas}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Desqualificar lead</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Tire o lead do forecast e aplique a automação correta.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={card.etapa === 'desqualificados'}
                    onClick={() => setShowDesqualificacao((value) => !value)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {card.etapa === 'desqualificados' ? 'Já desqualificado' : 'Abrir formulário'}
                  </button>
                </div>

                {showDesqualificacao && (
                  <form onSubmit={handleDesqualificacaoSubmit} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Por que este lead foi desqualificado?
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {MOTIVOS_DESQUALIFICACAO.map((motivo) => {
                          const selected = desqualificacaoForm.motivo === motivo.value
                          return (
                            <button
                              key={motivo.value}
                              type="button"
                              onClick={() => setDesqualificacaoForm((prev) => ({ ...prev, motivo: motivo.value }))}
                              className={`rounded-2xl border p-3 text-left transition-all ${
                                selected
                                  ? 'border-red-300 bg-white shadow-sm ring-2 ring-red-100'
                                  : 'border-white bg-white/70 hover:border-red-100 hover:bg-white'
                              }`}
                            >
                              <span className="block text-sm font-bold text-slate-800">{motivo.label}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{motivo.help}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {desqualificacaoForm.motivo && (
                      <p className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600">
                        {['timing_ruim', 'decisor_errado'].includes(desqualificacaoForm.motivo)
                          ? 'Automação: nutrição educacional + tarefa de requalificação em 90 dias.'
                          : 'Automação: sem comunicação ativa + revisão de retenção/LGPD.'}
                      </p>
                    )}

                    <label className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={desqualificacaoForm.qualificacao_minima}
                        onChange={(e) => setDesqualificacaoForm((prev) => ({
                          ...prev,
                          qualificacao_minima: e.target.checked,
                        }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rca-primary focus:ring-rca-primary"
                      />
                      <span>
                        Sim, tentei entender necessidade, pessoa certa e timing antes de desqualificar.
                      </span>
                    </label>

                    <label className="block space-y-1 text-xs font-medium text-slate-500">
                      O que aconteceu?
                      <textarea
                        rows={4}
                        value={desqualificacaoForm.observacoes}
                        onChange={(e) => setDesqualificacaoForm((prev) => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Ex.: cliente só deve comprar no próximo semestre; pediu para retomar em 90 dias."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </label>

                    {erroDesqualificacao && (
                      <p className="rounded-lg bg-white px-3 py-2 text-xs text-red-600">
                        {erroDesqualificacao}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={desqualificando}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {desqualificando && <Loader2 size={16} className="animate-spin" />}
                      Confirmar desqualificação
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contatos' && (
            <div className="space-y-4 animate-fade-in">
              <form
                onSubmit={handleContatoSubmit}
                className="rounded-2xl border border-rca-primary/10 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Registrar relato do contato</h3>
                    <p className="text-xs text-slate-500">
                      Descreva o que foi tratado com o cliente.
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rca-primary shadow-sm">
                    <MessageSquare size={17} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-slate-500">
                    Tipo de contato
                    <select
                      value={contatoForm.tipo}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, tipo: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                    >
                      {TIPO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-xs font-medium text-slate-500">
                    Resultado
                    <select
                      value={contatoForm.resultado}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, resultado: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                    >
                      {RESULTADO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-slate-500">
                    Nome do contato
                    <input
                      type="text"
                      value={contatoForm.nome_contato}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, nome_contato: e.target.value }))}
                      placeholder="Ex.: Maria Silva"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                    />
                  </label>

                  <label className="space-y-1 text-xs font-medium text-slate-500">
                    Área do contato
                    <input
                      type="text"
                      value={contatoForm.area_contato}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, area_contato: e.target.value }))}
                      placeholder="Ex.: Compras, Financeiro, Diretoria"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                    />
                  </label>
                </div>

                <label className="mt-3 block space-y-1 text-xs font-medium text-slate-500">
                  Relato
                  <textarea
                    value={contatoForm.resumo}
                    onChange={(e) => setContatoForm((prev) => ({ ...prev, resumo: e.target.value }))}
                    rows={4}
                    placeholder="Ex.: Cliente pediu retorno na próxima semana, solicitou tabela de preços e confirmou interesse em novos pedidos."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                  />
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-slate-500">
                    Duração (min)
                    <input
                      type="number"
                      min="0"
                      value={contatoForm.duracao_minutos}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, duracao_minutos: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                    />
                  </label>

                  <label className="space-y-1 text-xs font-medium text-slate-500">
                    Próximo contato
                    <input
                      type="date"
                      value={contatoForm.proximo_contato}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, proximo_contato: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-rca-primary focus:ring-2 focus:ring-rca-primary/10"
                    />
                  </label>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                  <div className="mb-3 flex items-start gap-2">
                    <Bell size={16} className="mt-0.5 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Agendar tarefa</p>
                      <p className="text-xs text-amber-700/80">
                        Quando chegar a data e hora, a pipeline mostra uma notificação e destaca o card.
                      </p>
                    </div>
                  </div>
                  <label className="block space-y-1 text-xs font-medium text-slate-500">
                    Título da tarefa
                    <input
                      type="text"
                      value={contatoForm.tarefa_titulo}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, tarefa_titulo: e.target.value }))}
                      placeholder="Ex.: Ligar para confirmar pedido"
                      className="w-full rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </label>
                  <label className="mt-3 block space-y-1 text-xs font-medium text-slate-500">
                    Data e hora da tarefa
                    <input
                      type="datetime-local"
                      value={contatoForm.tarefa_agendada_para}
                      onChange={(e) => setContatoForm((prev) => ({ ...prev, tarefa_agendada_para: e.target.value }))}
                      className="w-full rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </label>
                </div>

                {erroContato && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {erroContato}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={salvandoContato}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rca-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rca-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvandoContato ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {salvandoContato ? 'Salvando relato...' : 'Salvar relato'}
                </button>
              </form>

              {loadingContatos ? (
                <p className="py-12 text-center text-sm text-slate-400">Carregando contatos...</p>
              ) : contatos.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Nenhum contato registrado</p>
                </div>
              ) : (
                contatos.map((contato) => {
                  const TipoIcon = TIPO_ICONS[contato.tipo] || MessageSquare
                  const resultadoColor = RESULTADO_COLORS[contato.resultado] || RESULTADO_COLORS.outro
                  const resultadoLabel = contato.resultado?.replace(/_/g, ' ')

                  return (
                    <div
                      key={contato.id}
                      className="relative border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <TipoIcon size={14} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-700 capitalize">
                              {contato.tipo.replace(/_/g, ' ')}
                            </span>
                            {resultadoLabel && (
                              <span className={`badge text-[10px] ${resultadoColor}`}>
                                {resultadoLabel}
                              </span>
                            )}
                          </div>
                          {(contato.nome_contato || contato.area_contato) && (
                            <p className="mb-1 text-xs font-medium text-slate-500">
                              {[contato.nome_contato, contato.area_contato].filter(Boolean).join(' • ')}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {contato.resumo}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(contato.data_contato).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {contato.duracao_minutos && (
                              <span>{contato.duracao_minutos} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-4 animate-fade-in">
              {loadingHistorico ? (
                <p className="py-12 text-center text-sm text-slate-400">Carregando histórico...</p>
              ) : historico.length === 0 ? (
                <div className="py-12 text-center">
                  <TrendingUp size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Nenhum pedido registrado</p>
                </div>
              ) : (
                historico.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-700">
                          {pedido.sisplan_pedido_id ?? pedido.id}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          {formatDate(pedido.data_pedido)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(pedido.valor)}
                      </span>
                    </div>
                    {pedido.itens && (
                      <div className="space-y-1">
                        {pedido.itens.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-slate-500">
                            <span>{item.produto}</span>
                            <span className="text-slate-400">
                              {item.qtd}× {formatCurrency(item.valor_unit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function useLiberadorNome(liberadoPor, currentUserId, currentUserNome) {
  const [nome, setNome] = useState(null)

  useEffect(() => {
    if (!liberadoPor) {
      setNome(null)
      return undefined
    }

    if (liberadoPor === currentUserId && currentUserNome) {
      setNome(currentUserNome)
      return undefined
    }

    if (isDemoMode) {
      setNome('Administrador')
      return undefined
    }

    let cancelled = false
    supabase
      .from('usuarios')
      .select('nome')
      .eq('id', liberadoPor)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setNome(data?.nome ?? null)
      })

    return () => { cancelled = true }
  }, [liberadoPor, currentUserId, currentUserNome])

  return nome
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function LiberacaoBanner({ card, liberadorNome, canRelease, liberando, onLiberar }) {
  const liberado = card.liberado === true

  return (
    <div
      className={`mx-6 mt-4 rounded-xl border px-4 py-3 ${
        liberado
          ? 'border-emerald-200 bg-emerald-50/80'
          : 'border-red-200 bg-red-50/80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {liberado ? (
            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Lock size={18} className="text-red-500 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${liberado ? 'text-emerald-800' : 'text-red-800'}`}>
              {liberado ? 'Lead liberado' : 'Lead bloqueado'}
            </p>
            <p className={`text-xs mt-0.5 ${liberado ? 'text-emerald-700' : 'text-red-700'}`}>
              {liberado
                ? 'Este lead pode avançar para Negociação e etapas seguintes.'
                : 'Aguardando liberação de um administrador para avançar no funil.'}
            </p>
            {liberado && (
              <p className="text-[11px] text-emerald-600 mt-1.5">
                {liberadorNome ? `Liberado por ${liberadorNome}` : 'Liberado por administrador'}
                {card.liberado_em ? ` em ${formatDateTime(card.liberado_em)}` : ''}
              </p>
            )}
          </div>
        </div>

        {canRelease && onLiberar && (
          <button
            type="button"
            onClick={onLiberar}
            disabled={liberando}
            className="
              shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-white border border-red-200 text-red-700
              hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700
              text-xs font-semibold transition-all disabled:opacity-60
            "
          >
            {liberando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShieldCheck size={14} />
            )}
            Liberar
          </button>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, isLink }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-slate-300 shrink-0" />
      <span className="text-xs text-slate-400 w-16 shrink-0">{label}</span>
      {isLink ? (
        <a
          href={isLink}
          className="text-sm text-rca-primary hover:underline truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      ) : (
        <span className="text-sm text-slate-700 truncate">{value}</span>
      )}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
    </div>
  )
}

function CheckItem({ label, checked, onChange, icon: Icon }) {
  const SIM = 'sim'
  const NAO = 'nao'
  const value = checked === true ? SIM : checked === false ? NAO : null

  function handleChange(newValue) {
    if (value === newValue) {
      onChange(null)
      return
    }
    onChange(newValue === SIM)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
      <Icon size={14} className="text-slate-400 shrink-0" />
      <span className="text-xs text-slate-600 flex-1">{label}</span>
      <button type="button" onClick={() => handleChange(SIM)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${value === SIM ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
          {value === SIM && <CheckCircle2 size={10} className="text-white" />}
        </div>
        Sim
      </button>
      <button type="button" onClick={() => handleChange(NAO)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${value === NAO ? 'border-red-400 bg-red-400' : 'border-slate-300'}`}>
          {value === NAO && <CheckCircle2 size={10} className="text-white" />}
        </div>
        Não
      </button>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      <span className="block mb-0.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-rca-primary focus:ring-1 focus:ring-rca-primary/20"
      />
    </label>
  )
}
