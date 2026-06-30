/**
 * MOCK DATA — Sistema RCA
 * Dados fictícios realistas para desenvolvimento isolado do frontend.
 * Será substituído por chamadas API no Sprint 6.
 */

// ═══════════════════════════════════════════════
// USUÁRIOS
// ═══════════════════════════════════════════════

export const MOCK_USERS = [
  {
    id: 'usr-001',
    nome: 'Kendry Silva',
    email: 'kendry@empresa.com.br',
    perfil: 'vendedor',
    ativo: true,
  },
  {
    id: 'usr-002',
    nome: 'Cadu Oliveira',
    email: 'cadu@empresa.com.br',
    perfil: 'supervisor',
    ativo: true,
  },
  {
    id: 'usr-003',
    nome: 'Wesley Oliveira',
    email: 'wesley@empresa.com.br',
    perfil: 'admin',
    ativo: true,
  },
]

// ═══════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════

export const MOCK_CLIENTES = [
  {
    id: 'cli-001',
    sisplan_id: 'SP-10234',
    razao_social: 'Confecções Lima Ltda',
    nome_fantasia: 'Confecções Lima',
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 98765-4321',
    email: 'compras@confeccoeslima.com.br',
    endereco: 'Rua Augusta, 1200',
    cidade: 'São Paulo',
    estado: 'SP',
    segmento: 'Moda Feminina',
    ultima_compra: '2025-11-15',
    valor_historico: 87500.00,
    qtd_compras: 23,
    status: 'em_contato',
    tags: ['prioridade_alta', 'grande_volume'],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-002',
    sisplan_id: 'SP-10567',
    razao_social: 'Moda Kids Eireli',
    nome_fantasia: 'Moda Kids',
    cnpj: '23.456.789/0001-01',
    telefone: '(11) 91234-5678',
    email: 'contato@modakids.com.br',
    endereco: 'Av. Paulista, 800',
    cidade: 'São Paulo',
    estado: 'SP',
    segmento: 'Moda Infantil',
    ultima_compra: '2025-09-22',
    valor_historico: 54200.00,
    qtd_compras: 15,
    status: 'inativo',
    tags: ['bras'],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-003',
    sisplan_id: 'SP-10890',
    razao_social: 'Loja Fashion Center ME',
    nome_fantasia: 'Fashion Center',
    cnpj: '34.567.890/0001-12',
    telefone: '(21) 99876-5432',
    email: 'fashion@fashioncenter.com.br',
    endereco: 'Rua da Alfândega, 350',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    segmento: 'Moda Feminina',
    ultima_compra: '2025-12-03',
    valor_historico: 132800.00,
    qtd_compras: 41,
    status: 'qualificado',
    tags: ['prioridade_alta', 'cliente_antigo'],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-004',
    sisplan_id: 'SP-11023',
    razao_social: 'Trama Têxtil Ltda',
    nome_fantasia: 'Trama Têxtil',
    cnpj: '45.678.901/0001-23',
    telefone: '(31) 98765-1234',
    email: 'vendas@tramatextil.com.br',
    endereco: 'Av. Getúlio Vargas, 1500',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    segmento: 'Tecidos',
    ultima_compra: '2025-10-18',
    valor_historico: 67300.00,
    qtd_compras: 19,
    status: 'negociando',
    tags: [],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-005',
    sisplan_id: 'SP-11156',
    razao_social: 'Boutique Elegance ME',
    nome_fantasia: 'Boutique Elegance',
    cnpj: '56.789.012/0001-34',
    telefone: '(41) 99887-6543',
    email: 'elegance@boutique.com.br',
    endereco: 'Rua XV de Novembro, 200',
    cidade: 'Curitiba',
    estado: 'PR',
    segmento: 'Moda Feminina',
    ultima_compra: '2026-01-10',
    valor_historico: 43900.00,
    qtd_compras: 12,
    status: 'reativado',
    tags: ['reativado_2026'],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-006',
    sisplan_id: 'SP-11289',
    razao_social: 'Magazine Popular Ltda',
    nome_fantasia: 'Magazine Popular',
    cnpj: '67.890.123/0001-45',
    telefone: '(62) 98123-4567',
    email: 'compras@magazinepopular.com.br',
    endereco: 'Av. Anhanguera, 2000',
    cidade: 'Goiânia',
    estado: 'GO',
    segmento: 'Moda Masculina',
    ultima_compra: '2025-08-05',
    valor_historico: 28700.00,
    qtd_compras: 8,
    status: 'inativo',
    tags: [],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-007',
    sisplan_id: 'SP-11422',
    razao_social: 'Estilo Jovem Confecções Eireli',
    nome_fantasia: 'Estilo Jovem',
    cnpj: '78.901.234/0001-56',
    telefone: '(85) 99765-4321',
    email: 'estilojovem@gmail.com',
    endereco: 'Rua José Avelino, 500',
    cidade: 'Fortaleza',
    estado: 'CE',
    segmento: 'Moda Juvenil',
    ultima_compra: '2025-07-20',
    valor_historico: 19500.00,
    qtd_compras: 6,
    status: 'descartado',
    tags: ['sem_interesse'],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-008',
    sisplan_id: 'SP-11555',
    razao_social: 'Armazém da Moda Ltda',
    nome_fantasia: 'Armazém da Moda',
    cnpj: '89.012.345/0001-67',
    telefone: '(47) 98234-5678',
    email: 'armazem@modaltda.com.br',
    endereco: 'Rua Blumenau, 800',
    cidade: 'Blumenau',
    estado: 'SC',
    segmento: 'Moda Feminina',
    ultima_compra: '2025-11-28',
    valor_historico: 95400.00,
    qtd_compras: 27,
    status: 'inativo',
    tags: ['prioridade_alta', 'grande_volume'],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-009',
    sisplan_id: 'SP-11688',
    razao_social: 'Cia dos Tecidos ME',
    nome_fantasia: 'Cia dos Tecidos',
    cnpj: '90.123.456/0001-78',
    telefone: '(51) 99345-6789',
    email: 'contato@ciatecidos.com.br',
    endereco: 'Av. Farrapos, 1200',
    cidade: 'Porto Alegre',
    estado: 'RS',
    segmento: 'Tecidos',
    ultima_compra: '2025-10-01',
    valor_historico: 38600.00,
    qtd_compras: 11,
    status: 'em_contato',
    tags: [],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-010',
    sisplan_id: 'SP-11821',
    razao_social: 'Vitrine Store Eireli',
    nome_fantasia: 'Vitrine Store',
    cnpj: '01.234.567/0001-89',
    telefone: '(27) 98456-7890',
    email: 'loja@vitrinestore.com.br',
    endereco: 'Rua da Lama, 300',
    cidade: 'Vitória',
    estado: 'ES',
    segmento: 'Moda Feminina',
    ultima_compra: '2025-12-20',
    valor_historico: 71200.00,
    qtd_compras: 20,
    status: 'inativo',
    tags: ['cliente_antigo'],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-011',
    sisplan_id: 'SP-11954',
    razao_social: 'Ponto da Moda Ltda',
    nome_fantasia: 'Ponto da Moda',
    cnpj: '12.345.098/0001-90',
    telefone: '(71) 99567-8901',
    email: 'ponto@modaltda.com.br',
    endereco: 'Av. Sete de Setembro, 1500',
    cidade: 'Salvador',
    estado: 'BA',
    segmento: 'Moda Praia',
    ultima_compra: '2025-09-10',
    valor_historico: 22100.00,
    qtd_compras: 7,
    status: 'inativo',
    tags: [],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
  {
    id: 'cli-012',
    sisplan_id: 'SP-12087',
    razao_social: 'Mega Confecções Ltda',
    nome_fantasia: 'Mega Confecções',
    cnpj: '23.456.109/0001-01',
    telefone: '(92) 98678-9012',
    email: 'mega@confeccoes.com.br',
    endereco: 'Rua Eduardo Ribeiro, 700',
    cidade: 'Manaus',
    estado: 'AM',
    segmento: 'Moda Masculina',
    ultima_compra: '2025-08-25',
    valor_historico: 15800.00,
    qtd_compras: 5,
    status: 'inativo',
    tags: [],
    sincronizado_em: '2026-06-25T10:00:00Z',
  },
]

// ═══════════════════════════════════════════════
// PIPELINE CARDS
// ═══════════════════════════════════════════════

export const MOCK_CARDS = [
  // Inativos
  {
    id: 'card-001',
    cliente_id: 'cli-002',
    etapa: 'inativos',
    responsavel_id: 'usr-001',
    score: 0,
    prioridade: 'media',
    posicao: 0,
    proximo_contato: null,
    notas: null,
    valor_proposta: null,
  },
  {
    id: 'card-002',
    cliente_id: 'cli-006',
    etapa: 'inativos',
    responsavel_id: 'usr-001',
    score: 0,
    prioridade: 'baixa',
    posicao: 1,
    proximo_contato: null,
    notas: null,
    valor_proposta: null,
  },
  {
    id: 'card-003',
    cliente_id: 'cli-008',
    etapa: 'inativos',
    responsavel_id: 'usr-001',
    score: 0,
    prioridade: 'alta',
    posicao: 2,
    proximo_contato: null,
    notas: null,
    valor_proposta: null,
  },
  {
    id: 'card-004',
    cliente_id: 'cli-010',
    etapa: 'inativos',
    responsavel_id: 'usr-001',
    score: 0,
    prioridade: 'media',
    posicao: 3,
    proximo_contato: null,
    notas: null,
    valor_proposta: null,
  },
  {
    id: 'card-005',
    cliente_id: 'cli-011',
    etapa: 'inativos',
    responsavel_id: 'usr-001',
    score: 0,
    prioridade: 'baixa',
    posicao: 4,
    proximo_contato: null,
    notas: null,
    valor_proposta: null,
  },
  {
    id: 'card-006',
    cliente_id: 'cli-012',
    etapa: 'inativos',
    responsavel_id: 'usr-001',
    score: 0,
    prioridade: 'baixa',
    posicao: 5,
    proximo_contato: null,
    notas: null,
    valor_proposta: null,
  },
  // Primeiro contato
  {
    id: 'card-007',
    cliente_id: 'cli-001',
    etapa: 'primeiro_contato',
    responsavel_id: 'usr-001',
    score: 45,
    prioridade: 'alta',
    posicao: 0,
    proximo_contato: '2026-06-27',
    notas: 'Cliente demonstrou interesse, ligar amanhã para apresentar catálogo novo.',
    valor_proposta: null,
  },
  {
    id: 'card-008',
    cliente_id: 'cli-009',
    etapa: 'primeiro_contato',
    responsavel_id: 'usr-001',
    score: 30,
    prioridade: 'media',
    posicao: 1,
    proximo_contato: '2026-06-28',
    notas: 'Deixou recado com secretária, aguardando retorno.',
    valor_proposta: null,
  },
  // Lead qualificado — bloqueado
  {
    id: 'card-009',
    cliente_id: 'cli-003',
    etapa: 'lead_qualificado',
    responsavel_id: 'usr-001',
    score: 82,
    prioridade: 'alta',
    posicao: 0,
    proximo_contato: '2026-06-26',
    notas: 'Cliente antigo com alto valor. Interesse em coleção nova. Aguardando liberação admin.',
    valor_proposta: 25000.00,
    liberado: false,
    liberado_por: null,
    liberado_em: null,
  },
  // Lead qualificado — liberado
  {
    id: 'card-012',
    cliente_id: 'cli-007',
    etapa: 'lead_qualificado',
    responsavel_id: 'usr-001',
    score: 78,
    prioridade: 'alta',
    posicao: 1,
    proximo_contato: '2026-06-29',
    notas: 'Lead qualificado e já liberado pelo admin para avançar no funil.',
    valor_proposta: 32000.00,
    liberado: true,
    liberado_por: 'usr-003',
    liberado_em: '2026-06-28T14:00:00Z',
  },
  // Negociação
  {
    id: 'card-010',
    cliente_id: 'cli-004',
    etapa: 'negociacao',
    responsavel_id: 'usr-001',
    score: 75,
    prioridade: 'urgente',
    posicao: 0,
    proximo_contato: '2026-06-26',
    notas: 'Negociando preços. Pediu desconto de 10% para fechar pedido grande.',
    valor_proposta: 18500.00,
  },
  // Pós-venda
  {
    id: 'card-011',
    cliente_id: 'cli-005',
    etapa: 'pos_venda',
    responsavel_id: 'usr-001',
    score: 90,
    prioridade: 'media',
    posicao: 0,
    proximo_contato: '2026-07-01',
    notas: 'Pedido entregue em 20/06. Contato pós-venda agendado para 01/07.',
    valor_proposta: 12800.00,
  },
]

// ═══════════════════════════════════════════════
// CONTATOS (histórico de interações)
// ═══════════════════════════════════════════════

export const MOCK_CONTATOS = [
  {
    id: 'cnt-001',
    cliente_id: 'cli-001',
    card_id: 'card-007',
    usuario_id: 'usr-001',
    tipo: 'ligacao',
    direcao: 'saida',
    resumo: 'Liguei para apresentar coleção outono/inverno. Cliente demonstrou interesse em vestidos e blusas.',
    resultado: 'interessado',
    duracao_minutos: 8,
    data_contato: '2026-06-24T14:30:00Z',
  },
  {
    id: 'cnt-002',
    cliente_id: 'cli-001',
    card_id: 'card-007',
    usuario_id: 'usr-001',
    tipo: 'whatsapp',
    direcao: 'saida',
    resumo: 'Enviei catálogo digital por WhatsApp. Cliente visualizou e pediu tabela de preços.',
    resultado: 'interessado',
    duracao_minutos: null,
    data_contato: '2026-06-25T09:15:00Z',
  },
  {
    id: 'cnt-003',
    cliente_id: 'cli-003',
    card_id: 'card-009',
    usuario_id: 'usr-001',
    tipo: 'ligacao',
    direcao: 'saida',
    resumo: 'Primeiro contato de reativação. Cliente lembrou da parceria anterior e quer ver novidades.',
    resultado: 'interessado',
    duracao_minutos: 12,
    data_contato: '2026-06-20T10:00:00Z',
  },
  {
    id: 'cnt-004',
    cliente_id: 'cli-003',
    card_id: 'card-009',
    usuario_id: 'usr-001',
    tipo: 'visita',
    direcao: 'saida',
    resumo: 'Visitei a loja com amostras. Compradora selecionou 15 modelos para pedido.',
    resultado: 'pedido_realizado',
    duracao_minutos: 45,
    data_contato: '2026-06-23T14:00:00Z',
  },
  {
    id: 'cnt-005',
    cliente_id: 'cli-004',
    card_id: 'card-010',
    usuario_id: 'usr-001',
    tipo: 'ligacao',
    direcao: 'saida',
    resumo: 'Ligação para negociar preços. Pediu 10% de desconto no pedido acima de R$15k.',
    resultado: 'agendar_retorno',
    duracao_minutos: 15,
    data_contato: '2026-06-25T16:00:00Z',
  },
  {
    id: 'cnt-006',
    cliente_id: 'cli-009',
    card_id: 'card-008',
    usuario_id: 'usr-001',
    tipo: 'ligacao',
    direcao: 'saida',
    resumo: 'Tentei contato mas não atendeu. Deixei recado com a secretária.',
    resultado: 'sem_resposta',
    duracao_minutos: 3,
    data_contato: '2026-06-24T11:00:00Z',
  },
  {
    id: 'cnt-007',
    cliente_id: 'cli-005',
    card_id: 'card-011',
    usuario_id: 'usr-001',
    tipo: 'pos_venda',
    direcao: 'saida',
    resumo: 'Confirmei recebimento do pedido. Cliente satisfeita com a qualidade.',
    resultado: 'pedido_realizado',
    duracao_minutos: 5,
    data_contato: '2026-06-22T10:30:00Z',
  },
]

// ═══════════════════════════════════════════════
// HISTÓRICO DE COMPRAS
// ═══════════════════════════════════════════════

export const MOCK_HISTORICO_COMPRAS = [
  {
    id: 'hc-001',
    cliente_id: 'cli-001',
    sisplan_pedido_id: 'PED-45678',
    data_pedido: '2025-11-15',
    valor: 12500.00,
    itens: [
      { produto: 'Vestido Midi Floral', qtd: 30, valor_unit: 89.90 },
      { produto: 'Blusa Crepe Lisa', qtd: 50, valor_unit: 45.00 },
      { produto: 'Saia Plissada', qtd: 20, valor_unit: 75.50 },
    ],
    status_pedido: 'concluido',
  },
  {
    id: 'hc-002',
    cliente_id: 'cli-001',
    sisplan_pedido_id: 'PED-44321',
    data_pedido: '2025-08-20',
    valor: 8900.00,
    itens: [
      { produto: 'Calça Alfaiataria', qtd: 40, valor_unit: 110.00 },
      { produto: 'Blazer Feminino', qtd: 15, valor_unit: 189.90 },
    ],
    status_pedido: 'concluido',
  },
  {
    id: 'hc-003',
    cliente_id: 'cli-003',
    sisplan_pedido_id: 'PED-43210',
    data_pedido: '2025-12-03',
    valor: 25600.00,
    itens: [
      { produto: 'Vestido Longo Festa', qtd: 20, valor_unit: 320.00 },
      { produto: 'Conjunto Social', qtd: 30, valor_unit: 280.00 },
      { produto: 'Top Cropped', qtd: 60, valor_unit: 35.00 },
    ],
    status_pedido: 'concluido',
  },
  {
    id: 'hc-004',
    cliente_id: 'cli-005',
    sisplan_pedido_id: 'PED-48901',
    data_pedido: '2026-01-10',
    valor: 12800.00,
    itens: [
      { produto: 'Vestido Midi', qtd: 25, valor_unit: 95.00 },
      { produto: 'Calça Jeans', qtd: 40, valor_unit: 120.00 },
      { produto: 'Camiseta Basic', qtd: 50, valor_unit: 29.90 },
    ],
    status_pedido: 'concluido',
  },
]

// ═══════════════════════════════════════════════
// QUALIFICAÇÕES
// ═══════════════════════════════════════════════

export const MOCK_QUALIFICACOES = [
  {
    id: 'qual-001',
    card_id: 'card-009',
    avaliador_id: 'usr-002',
    score_interesse: 5,
    score_volume: 4,
    score_prazo: 4,
    score_total: 87,
    aprovado: true,
    observacoes: 'Cliente com histórico excelente. Muito interesse na coleção nova.',
    created_at: '2026-06-22T15:00:00Z',
  },
  {
    id: 'qual-002',
    card_id: 'card-010',
    avaliador_id: 'usr-001',
    score_interesse: 4,
    score_volume: 4,
    score_prazo: 3,
    score_total: 73,
    aprovado: null, // Aguardando aprovação do supervisor
    observacoes: 'Bom volume potencial, mas está pedindo desconto alto.',
    created_at: '2026-06-25T11:00:00Z',
  },
]

// ═══════════════════════════════════════════════
// DASHBOARD — DADOS AGREGADOS
// ═══════════════════════════════════════════════

export const MOCK_DASHBOARD = {
  funil: {
    etapas: [
      { etapa: 'inativos', total: 6, valor_medio: 45700, tempo_medio_dias: 0 },
      { etapa: 'primeiro_contato', total: 2, valor_medio: 62850, tempo_medio_dias: 3 },
      { etapa: 'lead_qualificado', total: 1, valor_medio: 132800, tempo_medio_dias: 6 },
      { etapa: 'negociacao', total: 1, valor_medio: 67300, tempo_medio_dias: 4 },
      { etapa: 'pos_venda', total: 1, valor_medio: 43900, tempo_medio_dias: 7 },
      { etapa: 'banco_potenciais', total: 0, valor_medio: 0, tempo_medio_dias: 0 },
    ],
    total_clientes: 11,
    taxa_conversao: 9.1,
    valor_pipeline: 18500,
  },
  timeline: [
    {
      id: 'tl-001',
      tipo: 'contato',
      descricao: 'Kendry registrou contato com Confecções Lima — cliente interessado',
      data: '2026-06-25T09:15:00Z',
      usuario: 'Kendry Silva',
    },
    {
      id: 'tl-002',
      tipo: 'movimentacao',
      descricao: 'Card Trama Têxtil movido para Negociação',
      data: '2026-06-25T08:30:00Z',
      usuario: 'Kendry Silva',
    },
    {
      id: 'tl-003',
      tipo: 'qualificacao',
      descricao: 'Cadu aprovou lead Fashion Center — score 87',
      data: '2026-06-22T15:00:00Z',
      usuario: 'Cadu Oliveira',
    },
    {
      id: 'tl-004',
      tipo: 'sync',
      descricao: 'Sincronização SISPLAN — 3 novos clientes, 8 atualizados',
      data: '2026-06-25T10:00:00Z',
      usuario: 'Sistema',
    },
    {
      id: 'tl-005',
      tipo: 'contato',
      descricao: 'Kendry visitou Fashion Center — 15 modelos selecionados',
      data: '2026-06-23T14:00:00Z',
      usuario: 'Kendry Silva',
    },
    {
      id: 'tl-006',
      tipo: 'pos_venda',
      descricao: 'Pós-venda Boutique Elegance — cliente satisfeita',
      data: '2026-06-22T10:30:00Z',
      usuario: 'Kendry Silva',
    },
  ],
  contatos_hoje: 2,
  sync_status: {
    ultima_sync: '2026-06-25T10:00:00Z',
    novos: 3,
    atualizados: 8,
    status: 'sucesso',
  },
}

// ═══════════════════════════════════════════════
// HELPERS — juntar dados para os componentes
// ═══════════════════════════════════════════════

/**
 * Retorna cards enriquecidos com os dados do cliente.
 */
export function getCardsComClientes() {
  return MOCK_CARDS.map((card) => {
    const cliente = MOCK_CLIENTES.find((c) => c.id === card.cliente_id)
    const responsavel = MOCK_USERS.find((u) => u.id === card.responsavel_id)
    return {
      ...card,
      cliente,
      responsavel,
    }
  })
}

/**
 * Retorna contatos de um cliente específico, ordenados por data.
 */
export function getContatosPorCliente(clienteId) {
  return MOCK_CONTATOS
    .filter((c) => c.cliente_id === clienteId)
    .sort((a, b) => new Date(b.data_contato) - new Date(a.data_contato))
}

/**
 * Retorna histórico de compras de um cliente específico.
 */
export function getHistoricoPorCliente(clienteId) {
  return MOCK_HISTORICO_COMPRAS
    .filter((h) => h.cliente_id === clienteId)
    .sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido))
}

/**
 * Retorna qualificações pendentes de aprovação.
 */
export function getQualificacoesPendentes() {
  return MOCK_QUALIFICACOES
    .filter((q) => q.aprovado === null)
    .map((q) => {
      const card = MOCK_CARDS.find((c) => c.id === q.card_id)
      const cliente = card ? MOCK_CLIENTES.find((c) => c.id === card.cliente_id) : null
      const avaliador = MOCK_USERS.find((u) => u.id === q.avaliador_id)
      return { ...q, card, cliente, avaliador }
    })
}
