import { supabase } from './supabase'
import { ETAPAS, statusFromEtapa } from './utils'

async function sessionUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

// ── Clientes ────────────────────────────────────────────────────────────────

export async function sbFetchClientes(filtros = {}) {
  let query = supabase.from('clientes').select('*').limit(1000)
  if (filtros.status) query = query.eq('status', filtros.status)
  if (filtros.cidade) query = query.ilike('cidade', `%${filtros.cidade}%`)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function sbFetchCliente(id) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function sbFetchHistoricoCliente(clienteId) {
  const { data, error } = await supabase
    .from('historico_compras')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_pedido', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function sbCriarCliente(dados) {
  const { data, error } = await supabase.rpc('fn_criar_cliente', {
    p_razao_social: dados.razao_social,
    p_nome_fantasia: dados.nome_fantasia ?? null,
    p_cnpj: dados.cnpj ?? null,
    p_telefone: dados.telefone ?? null,
    p_email: dados.email ?? null,
    p_endereco: dados.endereco ?? null,
    p_cidade: dados.cidade ?? null,
    p_estado: dados.estado ?? null,
    p_segmento: dados.segmento ?? null,
    p_nome_contato: dados.nome_contato ?? null,
  })
  if (error) throw new Error(error.message)
  return data
}

// ── Pipeline ────────────────────────────────────────────────────────────────

export async function sbFetchPipelineCards() {
  const { data, error } = await supabase
    .from('pipeline_cards')
    .select('*')
    .order('posicao', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function sbEnrichCardsWithClientes(cards) {
  if (!cards.length) return []

  const ids = [...new Set(cards.map((c) => c.cliente_id).filter(Boolean))]
  const cardIds = cards.map((c) => c.id).filter(Boolean)
  let clientes = []
  if (ids.length > 0 && ids.length <= 100) {
    const { data, error } = await supabase.from('clientes').select('*').in('id', ids)
    if (error) throw error
    clientes = data ?? []
  } else {
    clientes = await sbFetchClientes()
  }

  const map = Object.fromEntries(clientes.map((c) => [c.id, c]))
  const tarefasByCard = {}
  if (cardIds.length > 0) {
    try {
      const tarefas = []
      for (let i = 0; i < cardIds.length; i += 50) {
        const batchIds = cardIds.slice(i, i + 50)
        const { data, error: tarefasError } = await supabase
          .from('lead_tarefas')
          .select('*')
          .in('card_id', batchIds)
          .eq('status', 'pendente')
          .order('agendado_para', { ascending: true })
          .order('vencimento', { ascending: true })
        if (tarefasError) throw tarefasError
        tarefas.push(...(data ?? []))
      }
      for (const tarefa of tarefas) {
        if (!tarefasByCard[tarefa.card_id]) tarefasByCard[tarefa.card_id] = []
        tarefasByCard[tarefa.card_id].push(tarefa)
      }
    } catch (err) {
      console.warn('Tarefas pendentes não carregadas:', err.message)
    }
  }

  return cards.map((card) => ({
    ...card,
    valor_proposta: card.valor_proposta != null ? Number(card.valor_proposta) : null,
    cliente: map[card.cliente_id] ?? null,
    tarefas_pendentes: tarefasByCard[card.id] ?? [],
  }))
}

export async function sbMoverCard(cardId, etapaDestino, posicao, etapaAnterior) {
  const { data, error } = await supabase
    .from('pipeline_cards')
    .update({ etapa: etapaDestino, posicao: posicao ?? 0 })
    .eq('id', cardId)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(error.message ?? 'Erro ao mover card no banco de dados.')
  }
  if (!data) {
    throw new Error(
      'Permissão negada ou card não encontrado. Verifique se sua sessão está ativa.'
    )
  }

  const userId = await sessionUserId()
  if (userId && etapaAnterior && etapaAnterior !== etapaDestino) {
    const { error: atividadeErr } = await supabase.from('atividades').insert({
      card_id: cardId,
      usuario_id: userId,
      acao: 'mover',
      detalhes: { de: etapaAnterior, para: etapaDestino },
    })
    if (atividadeErr) {
      console.warn('Atividade não registrada:', atividadeErr.message)
    }
  }

  const novoStatus = statusFromEtapa(etapaDestino)
  if (data?.cliente_id && novoStatus) {
    const { error: statusErr } = await supabase
      .from('clientes')
      .update({ status: novoStatus })
      .eq('id', data.cliente_id)
    if (statusErr) {
      console.warn('Status do cliente não sincronizado:', statusErr.message)
    }
  }

  return data
}

export async function sbCreatePipelineCard(dados) {
  const userId = await sessionUserId()
  if (!userId) throw new Error('Usuário não autenticado')

  const payload = {
    cliente_id: dados.cliente_id,
    etapa: dados.etapa ?? 'inativos',
    prioridade: dados.prioridade ?? 'media',
    posicao: dados.posicao ?? 0,
    responsavel_id: dados.responsavel_id ?? userId,
    notas: dados.notas || null,
  }

  const { data, error } = await supabase
    .from('pipeline_cards')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este cliente já possui um card no pipeline.')
    }
    throw error
  }

  const novoStatus = statusFromEtapa(payload.etapa)
  if (novoStatus) {
    const { error: statusErr } = await supabase
      .from('clientes')
      .update({ status: novoStatus })
      .eq('id', payload.cliente_id)
    if (statusErr) {
      console.warn('Status do cliente não sincronizado:', statusErr.message)
    }
  }

  await supabase.from('atividades').insert({
    card_id: data.id,
    usuario_id: userId,
    acao: 'criar_card',
    detalhes: { etapa: payload.etapa },
  })

  return data
}

export async function sbLiberarLead(cardId) {
  const { data, error } = await supabase.rpc('fn_liberar_lead', { p_card_id: cardId })
  if (error) throw error
  return data
}

export async function sbDesqualificarLead(card, dados) {
  const userId = await sessionUserId()
  if (!userId) throw new Error('Usuário não autenticado')

  const hoje = new Date()
  const in90 = new Date(hoje)
  in90.setDate(in90.getDate() + 90)
  const in365 = new Date(hoje)
  in365.setDate(in365.getDate() + 365)

  const dataISO = (date) => date.toISOString().slice(0, 10)
  const nutricao = ['timing_ruim', 'decisor_errado'].includes(dados.motivo)
  const clienteUpdate = nutricao
    ? {
        status: 'desqualificado',
        desqualificado_motivo: dados.motivo,
        desqualificado_em: new Date().toISOString(),
        nutricao_segmento: `nutricao_${dados.motivo}`,
        comunicacao_ativa: true,
        retencao_ate: null,
        anonimizar_apos: null,
      }
    : {
        status: 'desqualificado',
        desqualificado_motivo: dados.motivo,
        desqualificado_em: new Date().toISOString(),
        nutricao_segmento: null,
        comunicacao_ativa: false,
        retencao_ate: dataISO(in365),
        anonimizar_apos: dataISO(in365),
      }

  const { error: clienteError } = await supabase
    .from('clientes')
    .update(clienteUpdate)
    .eq('id', card.cliente_id)
  if (clienteError) throw clienteError

  const { data: updatedCard, error: cardError } = await supabase
    .from('pipeline_cards')
    .update({ etapa: 'desqualificados', notas: dados.observacoes, proximo_contato: null })
    .eq('id', card.id)
    .select()
    .single()
  if (cardError) throw cardError

  const acaoAutomatica = nutricao ? 'nutricao_90_dias' : 'retencao_curta_lgpd'
  const { error: desqError } = await supabase.from('lead_desqualificacoes').insert({
    card_id: card.id,
    cliente_id: card.cliente_id,
    usuario_id: userId,
    motivo: dados.motivo,
    checklist: dados.checklist,
    observacoes: dados.observacoes,
    acao_automatica: acaoAutomatica,
    retencao_ate: clienteUpdate.retencao_ate,
    anonimizar_apos: clienteUpdate.anonimizar_apos,
  })
  if (desqError) throw desqError

  const agendadoParaDeVencimento = (date) => `${dataISO(date)}T00:00:00.000Z`

  const tarefa = nutricao
    ? {
        titulo: 'Requalificar este lead em 90 dias',
        tipo: 'requalificacao',
        vencimento: dataISO(in90),
        agendado_para: agendadoParaDeVencimento(in90),
      }
    : {
        titulo: 'Revisar retenção LGPD deste lead',
        tipo: 'lgpd_revisao',
        vencimento: dataISO(in365),
        agendado_para: agendadoParaDeVencimento(in365),
      }

  const { error: tarefaError } = await supabase.from('lead_tarefas').insert({
    card_id: card.id,
    cliente_id: card.cliente_id,
    usuario_id: userId,
    ...tarefa,
  })
  if (tarefaError) throw tarefaError

  if (nutricao) {
    const { error: nutricaoError } = await supabase.from('lead_nutricao').upsert(
      {
        card_id: card.id,
        cliente_id: card.cliente_id,
        motivo: dados.motivo,
        segmento: `nutricao_${dados.motivo}`,
        sequencia_email: 'educacional_requalificacao',
        ativo: true,
      },
      { onConflict: 'cliente_id' }
    )
    if (nutricaoError) throw nutricaoError
  }

  return updatedCard
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export async function sbFetchDashboardFunil() {
  const { data: rows, error } = await supabase
    .from('pipeline_cards')
    .select('etapa, score, clientes(valor_historico)')
  if (error) throw error

  const agg = Object.fromEntries(
    ETAPAS.map((e) => [e.id, { etapa: e.id, total: 0, valor_historico_total: 0, _scores: [] }])
  )

  for (const row of rows ?? []) {
    const bucket = agg[row.etapa]
    if (!bucket) continue
    bucket.total += 1
    bucket.valor_historico_total += Number(row.clientes?.valor_historico ?? 0)
    bucket._scores.push(row.score ?? 0)
  }

  const etapas = ETAPAS.map(({ id }) => {
    const b = agg[id]
    const total = b.total
    return {
      etapa: id,
      total,
      valor_medio: total ? b.valor_historico_total / total : 0,
      valor_historico_total: b.valor_historico_total,
      score_medio: b._scores.length
        ? Math.round(b._scores.reduce((a, c) => a + c, 0) / b._scores.length)
        : 0,
    }
  })

  const totalClientes = rows?.length ?? 0
  const posVenda = agg.pos_venda?.total ?? 0
  const valorPipeline = etapas.reduce((s, e) => s + e.valor_historico_total, 0)

  return {
    etapas,
    total_clientes: totalClientes,
    taxa_conversao: totalClientes ? (posVenda / totalClientes) * 100 : 0,
    valor_pipeline: valorPipeline,
  }
}

export async function sbFetchTimeline(limite = 20) {
  const { data, error } = await supabase
    .from('atividades')
    .select('*, usuarios(nome), pipeline_cards(cliente_id)')
    .order('created_at', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data ?? []
}

export async function sbFetchContatosPendentes() {
  const { data, error } = await supabase.from('v_contatos_hoje').select('*')
  if (error) throw error
  return data ?? []
}

export async function sbFetchSyncStatus() {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .order('inicio', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  if (!data) return null
  return {
    ultima_sync: data.inicio,
    status: data.status,
    novos: data.novos ?? 0,
    atualizados: data.atualizados ?? 0,
  }
}

// ── Contatos ────────────────────────────────────────────────────────────────

export async function sbFetchContatosPorCliente(clienteId) {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_contato', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function sbCreateContato(dados) {
  const userId = await sessionUserId()
  if (!userId) throw new Error('Usuário não autenticado')

  const { proximo_contato, tarefa_agendada_para, ...contatoDados } = dados
  const payload = { ...contatoDados, usuario_id: userId }
  const { data, error } = await supabase.from('contatos').insert(payload).select().single()
  if (error) throw error

  if ((proximo_contato || tarefa_agendada_para) && dados.card_id) {
    await supabase
      .from('pipeline_cards')
      .update({ proximo_contato: proximo_contato || tarefa_agendada_para.slice(0, 10) })
      .eq('id', dados.card_id)
  }

  return data
}

export async function sbCreateLeadTarefa(dados) {
  const userId = await sessionUserId()
  if (!userId) throw new Error('Usuário não autenticado')

  const agendada = new Date(dados.agendado_para)
  if (Number.isNaN(agendada.getTime())) {
    throw new Error('Data e hora da tarefa inválidas')
  }

  const payload = {
    card_id: dados.card_id,
    cliente_id: dados.cliente_id,
    usuario_id: userId,
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    tipo: dados.tipo || 'contato',
    vencimento: agendada.toISOString().slice(0, 10),
    agendado_para: agendada.toISOString(),
  }

  const { data, error } = await supabase
    .from('lead_tarefas')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function sbFetchTarefasPendentes({ vencidas = false } = {}) {
  let query = supabase
    .from('lead_tarefas')
    .select('*')
    .eq('status', 'pendente')
    .order('agendado_para', { ascending: true })
    .limit(50)

  if (vencidas) {
    query = query.lte('agendado_para', new Date().toISOString())
  }

  const { data, error } = await query
  if (!error) return data ?? []

  let fallback = supabase
    .from('lead_tarefas')
    .select('*')
    .eq('status', 'pendente')
    .order('vencimento', { ascending: true })
    .limit(50)

  if (vencidas) {
    fallback = fallback.lte('vencimento', new Date().toISOString().slice(0, 10))
  }

  const { data: fallbackData, error: fallbackError } = await fallback
  if (fallbackError) throw fallbackError
  return fallbackData ?? []
}

export async function sbConcluirLeadTarefa(tarefaId) {
  const { data, error } = await supabase
    .from('lead_tarefas')
    .update({ status: 'concluida' })
    .eq('id', tarefaId)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Tarefa não encontrada ou sem permissão para concluir.')
  return data
}

// ── Qualificação ────────────────────────────────────────────────────────────

const ETAPA_QUALIFICACAO = 'primeiro_contato'
const ETAPA_APOS_QUALIFICACAO = 'lead_qualificado'

export async function sbFetchQualificacoes() {
  const { data, error } = await supabase
    .from('qualificacoes')
    .select('*, pipeline_cards(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Leads pendentes = cards na mesma etapa da coluna "1º Contato" do Kanban. */
export async function sbFetchQualificacaoPendentes() {
  const { data: cards, error: cardsErr } = await supabase
    .from('pipeline_cards')
    .select('*')
    .eq('etapa', ETAPA_QUALIFICACAO)
    .order('updated_at', { ascending: false })
  if (cardsErr) throw cardsErr

  const enriched = await sbEnrichCardsWithClientes(cards ?? [])
  if (!enriched.length) return []

  const cardIds = enriched.map((c) => c.id)
  const clienteIds = [...new Set(enriched.map((c) => c.cliente_id).filter(Boolean))]
  const { data: quals, error: qualsErr } = await supabase
    .from('qualificacoes')
    .select('*')
    .in('card_id', cardIds)
    .order('created_at', { ascending: false })
  if (qualsErr) throw qualsErr

  let contatos = []
  if (clienteIds.length > 0) {
    const { data, error: contatosErr } = await supabase
      .from('contatos')
      .select('*')
      .in('cliente_id', clienteIds)
      .order('data_contato', { ascending: false })
    if (contatosErr) throw contatosErr
    contatos = data ?? []
  }

  const latestByCard = {}
  for (const q of quals ?? []) {
    if (!latestByCard[q.card_id]) latestByCard[q.card_id] = q
  }

  const contatosByCliente = {}
  for (const contato of contatos) {
    if (!contatosByCliente[contato.cliente_id]) contatosByCliente[contato.cliente_id] = []
    contatosByCliente[contato.cliente_id].push(contato)
  }

  return enriched.map((card) => {
    const qualificacao = latestByCard[card.id] ?? null
    return {
      card_id: card.id,
      card,
      cliente: card.cliente,
      qualificacao,
      score_total: qualificacao?.score_total ?? card.score ?? 0,
      observacoes: qualificacao?.observacoes ?? null,
      aprovado: qualificacao?.aprovado ?? null,
      contatos: contatosByCliente[card.cliente_id] ?? [],
      created_at: qualificacao?.created_at ?? card.updated_at ?? card.created_at,
    }
  })
}

export async function sbFetchQualificacaoStats() {
  const [{ data: cards, error: cardsErr }, { data: quals, error: qualsErr }] = await Promise.all([
    supabase.from('pipeline_cards').select('etapa'),
    supabase.from('qualificacoes').select('id, aprovado'),
  ])
  if (cardsErr) throw cardsErr
  if (qualsErr) throw qualsErr

  const etapaCounts = {}
  for (const c of cards ?? []) {
    etapaCounts[c.etapa] = (etapaCounts[c.etapa] ?? 0) + 1
  }

  return {
    totalPendentes: etapaCounts[ETAPA_QUALIFICACAO] ?? 0,
    totalAprovados: (quals ?? []).filter((q) => q.aprovado === true).length,
    totalQualificacoes: (quals ?? []).length,
  }
}

export async function sbEnrichQualificacoes(items) {
  if (!items.length) return []

  const clientes = await sbFetchClientes()
  const map = Object.fromEntries(clientes.map((c) => [c.id, c]))

  return items.map((q) => {
    const card = q.pipeline_cards ?? null
    return {
      ...q,
      card,
      cliente: card?.cliente_id ? map[card.cliente_id] ?? null : null,
    }
  })
}

export const sbEnrichQualificacaoPendentes = sbEnrichQualificacoes

export async function sbRegistrarQualificacao(cardId, dados) {
  const userId = await sessionUserId()
  if (!userId) throw new Error('Usuário não autenticado')

  const aprovado = dados.aprovado === true
  const { data, error } = await supabase
    .from('qualificacoes')
    .insert({
      card_id: cardId,
      avaliador_id: userId,
      aprovado,
      observacoes: dados.observacoes ?? null,
    })
    .select()
    .single()
  if (error) throw error

  if (aprovado) {
    const { error: cardErr } = await supabase
      .from('pipeline_cards')
      .update({ etapa: ETAPA_APOS_QUALIFICACAO })
      .eq('id', cardId)
    if (cardErr) throw cardErr
  }

  await supabase.from('atividades').insert({
    card_id: cardId,
    usuario_id: userId,
    acao: 'analise',
    detalhes: {
      analisado: aprovado,
      score_total: data.score_total,
      de: ETAPA_QUALIFICACAO,
      para: aprovado ? ETAPA_APOS_QUALIFICACAO : ETAPA_QUALIFICACAO,
    },
  })

  return data
}

export async function sbAprovarQualificacao(cardId, aprovado, observacoes) {
  const { data: pendentes, error: findErr } = await supabase
    .from('qualificacoes')
    .select('id')
    .eq('card_id', cardId)
    .is('aprovado', null)
    .limit(1)
    .maybeSingle()
  if (findErr) throw findErr
  if (!pendentes) throw new Error('Qualificação pendente não encontrada')

  const { data, error } = await supabase
    .from('qualificacoes')
    .update({ aprovado, observacoes })
    .eq('id', pendentes.id)
    .select()
    .single()
  if (error) throw error

  if (aprovado) {
    await supabase.from('pipeline_cards').update({ etapa: 'lead_qualificado' }).eq('id', cardId)
  }
  return data
}

// ── Usuários ────────────────────────────────────────────────────────────────

export async function sbFetchUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, ativo, created_at')
    .order('nome')
  if (error) throw error
  return data ?? []
}
