const ACAO_TIPO = {
  mover: 'movimentacao',
  contato: 'contato',
  qualificacao: 'qualificacao',
  sync: 'sync',
  pos_venda: 'pos_venda',
  liberar_lead: 'liberacao',
}

const ETAPA_LABELS = {
  inativos: 'Inativos',
  primeiro_contato: '1º Contato',
  lead_qualificado: 'Qualificado',
  negociacao: 'Negociação',
  pos_venda: 'Pós-venda',
  banco_potenciais: 'Potenciais',
  desqualificados: 'Desqualificados',
}

function formatDescricao(atividade) {
  const { acao, detalhes } = atividade

  if (acao === 'mover' && detalhes?.de && detalhes?.para) {
    const de = ETAPA_LABELS[detalhes.de] ?? detalhes.de
    const para = ETAPA_LABELS[detalhes.para] ?? detalhes.para
    return `Card movido de ${de} para ${para}`
  }

  if (acao === 'contato' && detalhes?.tipo) {
    return `Contato registrado — ${detalhes.tipo.replace(/_/g, ' ')}`
  }

  if (acao === 'liberar_lead') {
    return 'Lead liberado na etapa Lead Qualificado'
  }

  if (acao === 'qualificacao' && detalhes?.score_total != null) {
    const de = ETAPA_LABELS[detalhes.de] ?? detalhes.de
    const para = ETAPA_LABELS[detalhes.para] ?? detalhes.para
    return `Lead qualificado (score ${detalhes.score_total}) — ${de} → ${para}`
  }

  return acao?.replace(/_/g, ' ') ?? 'Atividade no sistema'
}

export function mapTimelineActivities(atividades = []) {
  return atividades.map((a) => ({
    id: a.id,
    tipo: ACAO_TIPO[a.acao] ?? 'default',
    descricao: formatDescricao(a),
    data: a.created_at,
    usuario: a.usuarios?.nome ?? 'Sistema',
  }))
}
