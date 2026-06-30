# Spec-Driven Development — Sistema RCA (Reativação Comercial Automatizada)

> **Versão:** 1.0  
> **Data:** 25/06/2026  
> **Autor:** Wesley Oliveira — Analista de Sistemas  
> **Status:** Em planejamento

---

## 1. Visão geral

O Sistema RCA é uma plataforma web que automatiza o processo de reativação de clientes inativos, substituindo planilhas e processos manuais por um pipeline visual (kanban) com automações integradas.

**Problema atual:** o time comercial depende de extração manual via ODBC do SISPLAN, planilhas paralelas, ligações sem registro centralizado e pós-venda sem rastreio — resultando em leads perdidos e retrabalho.

**Solução:** um sistema que sincroniza dados do SISPLAN automaticamente, organiza o funil de contato em um kanban visual, qualifica leads com score automático e dispara ações de pós-venda e recontato via N8N.

### 1.1 Objetivos mensuráveis

| Métrica | Antes | Meta |
|---------|-------|------|
| Tempo para gerar lista de inativos | ~2h manual | < 1 min (automático) |
| Leads perdidos por esquecimento | ~30% | < 5% |
| Taxa de reativação | desconhecida | mensurável no dashboard |
| Tempo médio do ciclo de reativação | desconhecido | rastreável por etapa |

### 1.2 Usuários do sistema

| Perfil | Acesso | Ações |
|--------|--------|-------|
| Vendedor (Kendry) | Pipeline próprio | Registrar contatos, mover cards, ver clientes |
| Supervisor (Cadu) | Pipeline da equipe | Aprovar leads, ver dashboard, configurar scores |
| Admin | Total | Gerenciar usuários, configurar ODBC, parametrizar sistema |

---

## 2. Stack tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | React + Vite + Tailwind CSS | SPA rápida, responsiva, drag-and-drop nativo |
| Backend API | Python FastAPI | Alta performance, tipagem, async nativo, fácil integração ODBC |
| Banco de dados | Supabase (PostgreSQL) | Auth integrado, Realtime, Storage, Row Level Security |
| Automação | N8N (self-hosted Hostinger) | Workflows visuais, webhooks, integração WhatsApp/email |
| Integração ERP | pyodbc + APScheduler | Sync periódico com SISPLAN |
| Deploy API | Railway | CI/CD automático, scaling |
| Deploy Frontend | Cloudflare Pages | CDN global, build automático |
| Versionamento | Git + GitHub | Controle de código |

### 2.1 Dependências principais

```json
// Frontend (package.json)
{
  "dependencies": {
    "react": "^18.x",
    "@supabase/supabase-js": "^2.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x",
    "react-router-dom": "^6.x",
    "recharts": "^2.x",
    "react-hook-form": "^7.x",
    "date-fns": "^3.x",
    "lucide-react": "latest"
  }
}
```

```txt
# Backend (requirements.txt)
fastapi==0.111.0
uvicorn==0.30.0
supabase==2.5.0
pyodbc==5.1.0
apscheduler==3.10.4
pydantic==2.7.0
httpx==0.27.0
python-dotenv==1.0.1
```

---

## 3. Arquitetura do sistema

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│         React + Tailwind (Cloudflare Pages)          │
│   Kanban │ Dashboard │ Detalhes │ Qualificação       │
└────────────────────┬────────────────────────────────┘
                     │ REST API (HTTPS)
┌────────────────────▼────────────────────────────────┐
│                  BACKEND API                        │
│              FastAPI (Railway)                       │
│  /clientes │ /pipeline │ /leads │ /contatos │ /sync │
└──────┬─────────────┬──────────────────┬─────────────┘
       │             │                  │
┌──────▼──────┐ ┌────▼──────┐  ┌───────▼──────────┐
│  Supabase   │ │  SISPLAN  │  │   N8N            │
│ PostgreSQL  │ │  (ODBC)   │  │ (Hostinger)      │
│ Auth/RLS    │ │  Leitura  │  │ WhatsApp/Email   │
│ Storage     │ │           │  │ Alertas/Gatilhos  │
└─────────────┘ └───────────┘  └──────────────────┘
```

### 3.1 Fluxo de dados

1. APScheduler (dentro do FastAPI) dispara sync ODBC a cada 6h
2. FastAPI consulta SISPLAN via pyodbc, filtra inativos 6-12 meses
3. Dados normalizados são inseridos/atualizados no Supabase
4. Frontend recebe dados via Supabase Realtime (ou polling REST)
5. Vendedor interage com o kanban, ações geram webhooks para N8N
6. N8N dispara notificações (WhatsApp, email) conforme gatilhos

---

## 4. Banco de dados (Supabase)

### 4.1 Diagrama Entidade-Relacionamento

```
usuarios ──┐
            ├──< contatos
clientes ──┘
clientes ──< pipeline_cards
clientes ──< historico_compras
pipeline_cards ──< atividades
configuracoes (singleton)
```

### 4.2 Tabelas

#### `usuarios`
Gerenciada pelo Supabase Auth. Tabela auxiliar para perfil.

```sql
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil TEXT NOT NULL CHECK (perfil IN ('vendedor', 'supervisor', 'admin')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver todos"
  ON public.usuarios FOR SELECT
  USING (true);

CREATE POLICY "Apenas admin edita usuarios"
  ON public.usuarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.perfil = 'admin'
    )
  );
```

#### `clientes`
Dados sincronizados do SISPLAN + enriquecimento local.

```sql
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sisplan_id TEXT UNIQUE,                        -- ID no ERP (chave de vínculo)
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  segmento TEXT,                                 -- ex: moda feminina, infantil
  ultima_compra DATE,                            -- data da última compra no SISPLAN
  valor_historico DECIMAL(12,2) DEFAULT 0,       -- soma total de compras
  qtd_compras INTEGER DEFAULT 0,
  status TEXT DEFAULT 'inativo'
    CHECK (status IN ('inativo', 'em_contato', 'qualificado', 'negociando', 'reativado', 'descartado')),
  origem_inatividade TEXT,                       -- motivo identificado no 1o contato
  tags TEXT[],                                   -- tags livres: ['prioridade_alta', 'bras']
  sincronizado_em TIMESTAMPTZ,                   -- última sync com SISPLAN
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_ultima_compra ON public.clientes(ultima_compra);
CREATE INDEX idx_clientes_sisplan_id ON public.clientes(sisplan_id);

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados veem clientes"
  ON public.clientes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Vendedor e acima editam clientes"
  ON public.clientes FOR UPDATE
  USING (auth.role() = 'authenticated');
```

#### `pipeline_cards`
Cada card no kanban representa um cliente em uma etapa do funil.

```sql
CREATE TABLE public.pipeline_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL DEFAULT 'inativos'
    CHECK (etapa IN (
      'inativos',
      'primeiro_contato',
      'lead_qualificado',
      'negociacao',
      'pos_venda',
      'banco_potenciais'
    )),
  responsavel_id UUID REFERENCES public.usuarios(id),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  prioridade TEXT DEFAULT 'media'
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  posicao INTEGER DEFAULT 0,                     -- ordem dentro da coluna
  proximo_contato DATE,                          -- agenda do próximo contato
  notas TEXT,
  valor_proposta DECIMAL(12,2),                  -- valor do pedido sugestivo
  motivo_perda TEXT,                             -- se não vendeu, por quê
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cards_etapa ON public.pipeline_cards(etapa);
CREATE INDEX idx_cards_responsavel ON public.pipeline_cards(responsavel_id);
CREATE INDEX idx_cards_proximo_contato ON public.pipeline_cards(proximo_contato);
CREATE UNIQUE INDEX idx_cards_cliente_unico ON public.pipeline_cards(cliente_id);

-- RLS
ALTER TABLE public.pipeline_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedor ve seus cards e supervisor ve todos"
  ON public.pipeline_cards FOR SELECT
  USING (
    responsavel_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.perfil IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Vendedor edita seus cards"
  ON public.pipeline_cards FOR UPDATE
  USING (
    responsavel_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.perfil IN ('supervisor', 'admin')
    )
  );
```

#### `contatos`
Registro de cada interação com o cliente.

```sql
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.pipeline_cards(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  tipo TEXT NOT NULL
    CHECK (tipo IN ('ligacao', 'whatsapp', 'email', 'visita', 'pos_venda', 'sistema')),
  direcao TEXT DEFAULT 'saida'
    CHECK (direcao IN ('entrada', 'saida')),
  resumo TEXT NOT NULL,                          -- o que foi conversado
  resultado TEXT
    CHECK (resultado IN (
      'sem_resposta', 'interessado', 'sem_interesse',
      'agendar_retorno', 'pedido_realizado', 'reclamacao', 'outro'
    )),
  duracao_minutos INTEGER,
  data_contato TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contatos_cliente ON public.contatos(cliente_id);
CREATE INDEX idx_contatos_data ON public.contatos(data_contato DESC);

-- RLS
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem contatos"
  ON public.contatos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados criam contatos"
  ON public.contatos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

#### `historico_compras`
Espelho das compras do SISPLAN para análise local.

```sql
CREATE TABLE public.historico_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  sisplan_pedido_id TEXT,                         -- ID do pedido no ERP
  data_pedido DATE NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  itens JSONB,                                   -- [{produto, qtd, valor_unit}]
  status_pedido TEXT DEFAULT 'concluido'
    CHECK (status_pedido IN ('pendente', 'producao', 'enviado', 'concluido', 'cancelado')),
  sincronizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_historico_cliente ON public.historico_compras(cliente_id);
CREATE INDEX idx_historico_data ON public.historico_compras(data_pedido DESC);
```

#### `qualificacoes`
Registro das avaliações de lead (score + aprovação).

```sql
CREATE TABLE public.qualificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES public.usuarios(id),
  score_interesse INTEGER CHECK (score_interesse BETWEEN 1 AND 5),
  score_volume INTEGER CHECK (score_volume BETWEEN 1 AND 5),
  score_prazo INTEGER CHECK (score_prazo BETWEEN 1 AND 5),
  score_total INTEGER GENERATED ALWAYS AS (
    (score_interesse + score_volume + score_prazo) * 100 / 15
  ) STORED,
  aprovado BOOLEAN,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qualificacoes_card ON public.qualificacoes(card_id);
```

#### `configuracoes`
Parâmetros globais do sistema.

```sql
CREATE TABLE public.configuracoes (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valores iniciais
INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
  ('sync_intervalo_horas', '6', 'Intervalo de sync ODBC em horas'),
  ('inatividade_meses_min', '6', 'Mínimo de meses inativo para entrar no funil'),
  ('inatividade_meses_max', '12', 'Máximo de meses inativo'),
  ('recontato_dias', '15', 'Dias para recontato após sem venda'),
  ('pos_venda_dias', '7', 'Dias após entrega para contato pós-venda'),
  ('score_minimo_qualificacao', '60', 'Score mínimo para considerar lead qualificado');
```

### 4.3 Views úteis

```sql
-- View: resumo do funil por etapa
CREATE VIEW public.v_funil_resumo AS
SELECT
  pc.etapa,
  COUNT(*) AS total,
  COALESCE(SUM(c.valor_historico), 0) AS valor_historico_total,
  COALESCE(AVG(pc.score), 0)::INTEGER AS score_medio
FROM public.pipeline_cards pc
JOIN public.clientes c ON c.id = pc.cliente_id
GROUP BY pc.etapa;

-- View: contatos pendentes para hoje
CREATE VIEW public.v_contatos_hoje AS
SELECT
  pc.id AS card_id,
  c.nome_fantasia,
  c.telefone,
  pc.etapa,
  pc.prioridade,
  pc.proximo_contato,
  u.nome AS responsavel
FROM public.pipeline_cards pc
JOIN public.clientes c ON c.id = pc.cliente_id
LEFT JOIN public.usuarios u ON u.id = pc.responsavel_id
WHERE pc.proximo_contato <= CURRENT_DATE
ORDER BY pc.prioridade DESC, pc.proximo_contato ASC;
```

### 4.4 Functions (Supabase Edge Functions / PostgreSQL)

```sql
-- Function: calcular prioridade automática
CREATE OR REPLACE FUNCTION public.fn_calcular_prioridade(p_cliente_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_valor DECIMAL;
  v_meses INTEGER;
BEGIN
  SELECT
    valor_historico,
    EXTRACT(MONTH FROM AGE(now(), ultima_compra))::INTEGER
  INTO v_valor, v_meses
  FROM public.clientes
  WHERE id = p_cliente_id;

  IF v_valor > 50000 OR v_meses >= 10 THEN
    RETURN 'alta';
  ELSIF v_valor > 20000 OR v_meses >= 8 THEN
    RETURN 'media';
  ELSE
    RETURN 'baixa';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();

CREATE TRIGGER trg_cards_updated
  BEFORE UPDATE ON public.pipeline_cards
  FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();
```

---

## 5. API Backend (FastAPI)

### 5.1 Estrutura de pastas

```
api/
├── main.py                  # App FastAPI, CORS, startup
├── config.py                # Settings (env vars)
├── dependencies.py          # Supabase client, auth middleware
├── routers/
│   ├── clientes.py          # CRUD clientes
│   ├── pipeline.py          # Kanban: cards, movimentação
│   ├── contatos.py          # Registro de contatos
│   ├── qualificacao.py      # Score e aprovação de leads
│   ├── sync.py              # Sync ODBC manual + status
│   └── dashboard.py         # Métricas e relatórios
├── services/
│   ├── sisplan_sync.py      # Lógica de sync ODBC
│   ├── score_engine.py      # Cálculo de score de lead
│   ├── notification.py      # Webhooks para N8N
│   └── prioridade.py        # Cálculo de prioridade
├── models/
│   ├── cliente.py           # Pydantic schemas
│   ├── pipeline.py
│   ├── contato.py
│   └── qualificacao.py
├── jobs/
│   └── scheduler.py         # APScheduler para sync periódico
└── tests/
    ├── test_clientes.py
    ├── test_pipeline.py
    └── test_sync.py
```

### 5.2 Endpoints

#### Clientes

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/clientes` | Lista clientes com filtros (status, cidade, segmento) |
| `GET` | `/api/clientes/{id}` | Detalhes de um cliente |
| `GET` | `/api/clientes/{id}/historico` | Histórico de compras do SISPLAN |
| `PATCH` | `/api/clientes/{id}` | Atualizar dados locais (tags, segmento) |

```python
# GET /api/clientes — exemplo de query params
# ?status=inativo&cidade=São Paulo&ordem=valor_historico&limite=50

class ClienteFilter(BaseModel):
    status: Optional[str] = None
    cidade: Optional[str] = None
    segmento: Optional[str] = None
    ordem: str = "ultima_compra"
    direcao: str = "asc"
    limite: int = 50
    offset: int = 0
```

#### Pipeline (Kanban)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/pipeline` | Todos os cards agrupados por etapa |
| `GET` | `/api/pipeline/meus` | Cards do vendedor logado |
| `POST` | `/api/pipeline/cards` | Criar card (adicionar cliente ao funil) |
| `PATCH` | `/api/pipeline/cards/{id}` | Atualizar card (notas, prioridade) |
| `POST` | `/api/pipeline/cards/{id}/mover` | Mover card para outra etapa |
| `DELETE` | `/api/pipeline/cards/{id}` | Remover card do funil |

```python
# POST /api/pipeline/cards/{id}/mover
class MoverCardRequest(BaseModel):
    etapa_destino: str       # ex: "lead_qualificado"
    posicao: Optional[int]   # ordem na coluna
    notas: Optional[str]     # motivo da movimentação

class MoverCardResponse(BaseModel):
    card_id: str
    etapa_anterior: str
    etapa_nova: str
    webhook_disparado: bool  # se N8N foi notificado
```

#### Contatos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/contatos/{cliente_id}` | Histórico de contatos do cliente |
| `POST` | `/api/contatos` | Registrar novo contato |
| `GET` | `/api/contatos/pendentes` | Contatos agendados para hoje |

```python
# POST /api/contatos
class NovoContato(BaseModel):
    cliente_id: str
    card_id: Optional[str]
    tipo: Literal["ligacao", "whatsapp", "email", "visita", "pos_venda"]
    resumo: str
    resultado: Literal[
        "sem_resposta", "interessado", "sem_interesse",
        "agendar_retorno", "pedido_realizado", "reclamacao"
    ]
    duracao_minutos: Optional[int]
    proximo_contato: Optional[date]    # agenda próximo contato
```

#### Qualificação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/qualificacao/{card_id}` | Registrar avaliação do lead |
| `POST` | `/api/qualificacao/{card_id}/aprovar` | Supervisor aprova lead |
| `GET` | `/api/qualificacao/pendentes` | Leads aguardando aprovação |

```python
# POST /api/qualificacao/{card_id}
class AvaliacaoLead(BaseModel):
    score_interesse: int = Field(ge=1, le=5)   # 1-5
    score_volume: int = Field(ge=1, le=5)
    score_prazo: int = Field(ge=1, le=5)
    observacoes: Optional[str]
```

#### Sync SISPLAN

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/sync/executar` | Forçar sync manual |
| `GET` | `/api/sync/status` | Status da última sincronização |
| `GET` | `/api/sync/log` | Log das últimas 10 sincronizações |

#### Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard/funil` | Resumo do funil (contagem por etapa) |
| `GET` | `/api/dashboard/conversao` | Taxa de conversão por período |
| `GET` | `/api/dashboard/vendedor/{id}` | Performance individual |
| `GET` | `/api/dashboard/timeline` | Atividades recentes |

```python
# GET /api/dashboard/funil — response
class FunilResumo(BaseModel):
    etapas: list[EtapaResumo]
    total_clientes: int
    taxa_conversao: float       # % inativos que viraram venda
    valor_pipeline: float       # soma dos pedidos em negociação

class EtapaResumo(BaseModel):
    etapa: str
    total: int
    valor_medio: float
    tempo_medio_dias: float     # tempo médio nessa etapa
```

### 5.3 Middleware e autenticação

```python
# dependencies.py
from supabase import create_client
from fastapi import Request, HTTPException

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async def get_current_user(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(401, "Token não fornecido")

    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(401, "Token inválido")

    return user.user
```

---

## 6. Frontend (React)

### 6.1 Estrutura de pastas

```
src/
├── main.jsx
├── App.jsx                    # Router + AuthProvider
├── lib/
│   ├── supabase.js            # Client Supabase
│   ├── api.js                 # Axios/fetch wrapper para FastAPI
│   └── utils.js               # Formatação, helpers
├── hooks/
│   ├── useAuth.js             # Login/logout Supabase
│   ├── usePipeline.js         # CRUD pipeline cards
│   ├── useClientes.js         # Lista e detalhes
│   └── useContatos.js         # Registro de contatos
├── components/
│   ├── Layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── Layout.jsx
│   ├── Pipeline/
│   │   ├── KanbanBoard.jsx    # Board completo com drag-and-drop
│   │   ├── KanbanColumn.jsx   # Coluna individual
│   │   ├── KanbanCard.jsx     # Card do cliente
│   │   └── CardDetail.jsx     # Modal de detalhes
│   ├── Dashboard/
│   │   ├── StatsCards.jsx     # Cards de métricas
│   │   ├── FunnelChart.jsx    # Gráfico de funil
│   │   └── Timeline.jsx       # Atividades recentes
│   ├── Clientes/
│   │   ├── ClienteList.jsx
│   │   └── ClienteDetail.jsx
│   ├── Qualificacao/
│   │   ├── ScoreForm.jsx      # Formulário de avaliação
│   │   └── PendentesLista.jsx
│   └── common/
│       ├── Badge.jsx
│       ├── SearchInput.jsx
│       └── EmptyState.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── PipelinePage.jsx
│   ├── DashboardPage.jsx
│   ├── ClientesPage.jsx
│   └── ConfigPage.jsx
└── styles/
    └── globals.css            # Tailwind base
```

### 6.2 Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/login` | LoginPage | Público |
| `/` | PipelinePage (kanban) | Vendedor+ |
| `/dashboard` | DashboardPage | Supervisor+ |
| `/clientes` | ClientesPage | Vendedor+ |
| `/clientes/:id` | ClienteDetail | Vendedor+ |
| `/qualificacao` | PendentesLista | Supervisor+ |
| `/config` | ConfigPage | Admin |

### 6.3 Estado e realtime

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// hooks/usePipeline.js — Realtime subscription
export function usePipeline() {
  const [cards, setCards] = useState([])

  useEffect(() => {
    // Carrega cards iniciais
    fetchCards()

    // Escuta mudanças em tempo real
    const channel = supabase
      .channel('pipeline-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipeline_cards'
      }, (payload) => {
        handleRealtimeUpdate(payload)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ... resto do hook
}
```

### 6.4 Componente KanbanBoard (esqueleto)

```jsx
// components/Pipeline/KanbanBoard.jsx
import { DndContext, closestCorners } from '@dnd-kit/core'

const ETAPAS = [
  { id: 'inativos', label: 'Inativos', cor: 'purple' },
  { id: 'primeiro_contato', label: '1º Contato', cor: 'blue' },
  { id: 'lead_qualificado', label: 'Lead qualificado', cor: 'teal' },
  { id: 'negociacao', label: 'Negociação', cor: 'amber' },
  { id: 'pos_venda', label: 'Pós-venda', cor: 'green' },
  { id: 'banco_potenciais', label: 'Banco potenciais', cor: 'gray' },
]

export function KanbanBoard() {
  const { cards, moverCard } = usePipeline()

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const cardId = active.id
    const novaEtapa = over.id

    moverCard(cardId, novaEtapa)
  }

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {ETAPAS.map(etapa => (
          <KanbanColumn
            key={etapa.id}
            etapa={etapa}
            cards={cards.filter(c => c.etapa === etapa.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}
```

---

## 7. Automação N8N

### 7.1 Workflows

#### Workflow 1: Pós-venda automático

```
Trigger: Webhook (FastAPI envia quando card move para "pos_venda")
   │
   ├─ Wait (7 dias)
   │
   ├─ HTTP Request: GET /api/pipeline/cards/{id}
   │   └─ Verifica se card ainda está em "pos_venda"
   │
   ├─ IF card ativo:
   │   ├─ WhatsApp: Envia mensagem de pós-venda ao cliente
   │   ├─ HTTP Request: POST /api/contatos (registra contato tipo "pos_venda")
   │   └─ Notificação: Avisa vendedor responsável
   │
   └─ ELSE: Encerra (card já foi movido)
```

#### Workflow 2: Recontato automático (sem venda)

```
Trigger: Webhook (card move para "banco_potenciais")
   │
   ├─ Wait (15 dias — configurável)
   │
   ├─ HTTP Request: PATCH /api/pipeline/cards/{id}/mover
   │   └─ Move card de volta para "inativos"
   │
   ├─ HTTP Request: POST /api/contatos
   │   └─ Registra contato tipo "sistema" com resumo "Recontato automático"
   │
   └─ Notificação WhatsApp: Avisa vendedor
       └─ "Cliente {nome} voltou ao funil para novo contato"
```

#### Workflow 3: Alerta diário de contatos pendentes

```
Trigger: Cron (todo dia às 7h)
   │
   ├─ HTTP Request: GET /api/contatos/pendentes
   │
   ├─ IF tem contatos pendentes:
   │   ├─ Agrupa por vendedor
   │   └─ Para cada vendedor:
   │       └─ WhatsApp: "Bom dia! Você tem {n} contatos agendados para hoje"
   │
   └─ ELSE: Encerra
```

#### Workflow 4: Envio de catálogo digital

```
Trigger: Webhook (card move para "negociacao")
   │
   ├─ HTTP Request: GET /api/clientes/{id}
   │   └─ Pega segmento e histórico
   │
   ├─ Seleciona catálogo do Supabase Storage
   │   └─ Baseado no segmento do cliente
   │
   ├─ E-mail: Envia catálogo + pedido sugestivo
   │
   └─ HTTP Request: POST /api/contatos
       └─ Registra envio do catálogo
```

### 7.2 Webhooks (FastAPI → N8N)

```python
# services/notification.py
import httpx

N8N_BASE_URL = os.getenv("N8N_WEBHOOK_URL")

async def notificar_n8n(evento: str, dados: dict):
    webhooks = {
        "card_movido": f"{N8N_BASE_URL}/webhook/card-movido",
        "pos_venda": f"{N8N_BASE_URL}/webhook/pos-venda",
        "lead_qualificado": f"{N8N_BASE_URL}/webhook/lead-qualificado",
    }

    url = webhooks.get(evento)
    if not url:
        return

    async with httpx.AsyncClient() as client:
        await client.post(url, json={
            "evento": evento,
            "dados": dados,
            "timestamp": datetime.utcnow().isoformat()
        })
```

---

## 8. Integração ODBC — SISPLAN

### 8.1 Configuração de conexão

```python
# services/sisplan_sync.py
import pyodbc

def get_sisplan_connection():
    conn_str = (
        f"DRIVER={os.getenv('SISPLAN_ODBC_DRIVER')};"
        f"SERVER={os.getenv('SISPLAN_HOST')};"
        f"DATABASE={os.getenv('SISPLAN_DB')};"
        f"UID={os.getenv('SISPLAN_USER')};"
        f"PWD={os.getenv('SISPLAN_PASS')};"
        f"PORT={os.getenv('SISPLAN_PORT', '1433')};"
    )
    return pyodbc.connect(conn_str, timeout=30)
```

### 8.2 Query de clientes inativos

```python
QUERY_INATIVOS = """
    SELECT
        c.CODIGO           AS sisplan_id,
        c.RAZAO_SOCIAL     AS razao_social,
        c.NOME_FANTASIA    AS nome_fantasia,
        c.CNPJ             AS cnpj,
        c.TELEFONE         AS telefone,
        c.EMAIL            AS email,
        c.ENDERECO         AS endereco,
        c.CIDADE           AS cidade,
        c.UF               AS estado,
        MAX(p.DATA_PEDIDO) AS ultima_compra,
        SUM(p.VALOR_TOTAL) AS valor_historico,
        COUNT(p.CODIGO)    AS qtd_compras
    FROM CLIENTES c
    LEFT JOIN PEDIDOS p ON p.CLIENTE_ID = c.CODIGO
    GROUP BY c.CODIGO, c.RAZAO_SOCIAL, c.NOME_FANTASIA,
             c.CNPJ, c.TELEFONE, c.EMAIL, c.ENDERECO,
             c.CIDADE, c.UF
    HAVING MAX(p.DATA_PEDIDO) BETWEEN
        DATEADD(MONTH, -:max_meses, GETDATE())
        AND DATEADD(MONTH, -:min_meses, GETDATE())
    ORDER BY SUM(p.VALOR_TOTAL) DESC
"""
```

### 8.3 Lógica de sincronização

```python
async def executar_sync():
    """Sincroniza clientes inativos do SISPLAN para o Supabase."""
    log = SyncLog(inicio=datetime.utcnow())

    try:
        conn = get_sisplan_connection()
        cursor = conn.cursor()
        cursor.execute(QUERY_INATIVOS, {
            'min_meses': config['inatividade_meses_min'],
            'max_meses': config['inatividade_meses_max']
        })

        rows = cursor.fetchall()
        novos, atualizados = 0, 0

        for row in rows:
            cliente_data = mapear_row_para_dict(row)

            # Verifica se já existe no Supabase
            existente = supabase.table('clientes') \
                .select('id') \
                .eq('sisplan_id', cliente_data['sisplan_id']) \
                .execute()

            if existente.data:
                # Atualiza dados do SISPLAN (não sobrescreve dados locais)
                supabase.table('clientes') \
                    .update({
                        'razao_social': cliente_data['razao_social'],
                        'ultima_compra': cliente_data['ultima_compra'],
                        'valor_historico': cliente_data['valor_historico'],
                        'qtd_compras': cliente_data['qtd_compras'],
                        'sincronizado_em': datetime.utcnow().isoformat()
                    }) \
                    .eq('sisplan_id', cliente_data['sisplan_id']) \
                    .execute()
                atualizados += 1
            else:
                # Insere novo cliente + cria card na etapa "inativos"
                result = supabase.table('clientes') \
                    .insert(cliente_data) \
                    .execute()

                cliente_id = result.data[0]['id']
                prioridade = calcular_prioridade(cliente_data)

                supabase.table('pipeline_cards').insert({
                    'cliente_id': cliente_id,
                    'etapa': 'inativos',
                    'prioridade': prioridade,
                }).execute()

                novos += 1

        log.novos = novos
        log.atualizados = atualizados
        log.status = 'sucesso'

    except Exception as e:
        log.status = 'erro'
        log.erro = str(e)

    finally:
        conn.close()
        log.fim = datetime.utcnow()
        salvar_log_sync(log)

    return log
```

### 8.4 Scheduler

```python
# jobs/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

def configurar_scheduler():
    intervalo = int(config.get('sync_intervalo_horas', 6))

    scheduler.add_job(
        executar_sync,
        'interval',
        hours=intervalo,
        id='sync_sisplan',
        replace_existing=True,
        next_run_time=datetime.utcnow()  # executa imediatamente ao iniciar
    )
    scheduler.start()
```

---

## 9. Variáveis de ambiente

```env
# .env (nunca commitar no Git)

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# SISPLAN ODBC
SISPLAN_ODBC_DRIVER={ODBC Driver 17 for SQL Server}
SISPLAN_HOST=192.168.x.x
SISPLAN_DB=SISPLAN_PROD
SISPLAN_USER=readonly_user
SISPLAN_PASS=senha_segura
SISPLAN_PORT=1433

# N8N
N8N_WEBHOOK_URL=https://n8n.srv1631991.hstgr.cloud

# API
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://rca.seudominio.com.br
```

---

## 10. Fases de desenvolvimento (MVP)

### Fase 1 — Fundação (2 semanas)

- [ ] Criar projeto Supabase + schema completo (tabelas, RLS, functions)
- [ ] Criar projeto FastAPI com rotas básicas de clientes
- [ ] Configurar conexão ODBC com SISPLAN (ambiente teste)
- [ ] Implementar sync básico (query + insert no Supabase)
- [ ] Deploy API no Railway
- [ ] Testar sync end-to-end

**Entregável:** API rodando com dados reais do SISPLAN no Supabase.

### Fase 2 — Pipeline visual (2 semanas)

- [ ] Criar projeto React + Vite + Tailwind
- [ ] Implementar tela de login (Supabase Auth)
- [ ] Construir KanbanBoard com drag-and-drop
- [ ] Implementar detalhes do card (modal)
- [ ] Conectar frontend com API (lista e movimentação de cards)
- [ ] Deploy frontend no Cloudflare Pages

**Entregável:** vendedor consegue ver e mover cards no kanban.

### Fase 3 — Contatos e qualificação (2 semanas)

- [ ] Implementar registro de contatos (formulário + API)
- [ ] Implementar formulário de qualificação de lead (score)
- [ ] Implementar tela de aprovação de leads (supervisor)
- [ ] Histórico de contatos no card
- [ ] Supabase Realtime para atualização em tempo real

**Entregável:** fluxo completo de contato → qualificação → aprovação.

### Fase 4 — Automações N8N (1 semana)

- [ ] Criar webhook de movimentação de card
- [ ] Workflow: pós-venda automático (7 dias)
- [ ] Workflow: recontato automático (15 dias)
- [ ] Workflow: alerta diário de contatos
- [ ] Workflow: envio de catálogo

**Entregável:** automações rodando, vendedor recebendo alertas.

### Fase 5 — Dashboard e refinamento (1 semana)

- [ ] Dashboard com métricas do funil
- [ ] Gráficos de conversão (Recharts)
- [ ] Performance por vendedor
- [ ] Ajustes de UX baseados em feedback
- [ ] Documentação de uso

**Entregável:** sistema completo em produção.

### Cronograma resumido

| Fase | Duração | Acumulado |
|------|---------|-----------|
| 1. Fundação | 2 semanas | Semana 2 |
| 2. Pipeline visual | 2 semanas | Semana 4 |
| 3. Contatos e qualificação | 2 semanas | Semana 6 |
| 4. Automações N8N | 1 semana | Semana 7 |
| 5. Dashboard | 1 semana | Semana 8 |

**Total estimado: 8 semanas (2 meses)**

---

## 11. Testes

### 11.1 Backend (pytest)

```python
# tests/test_pipeline.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_mover_card_para_etapa_valida(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/pipeline/cards/uuid-card/mover",
        json={"etapa_destino": "lead_qualificado"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["etapa_nova"] == "lead_qualificado"

@pytest.mark.asyncio
async def test_mover_card_para_etapa_invalida(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/pipeline/cards/uuid-card/mover",
        json={"etapa_destino": "etapa_que_nao_existe"},
        headers=auth_headers
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_sync_sisplan_retorna_log(client: AsyncClient, admin_headers):
    response = await client.post(
        "/api/sync/executar",
        headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "novos" in data
    assert "atualizados" in data
```

### 11.2 Frontend (Vitest + Testing Library)

```javascript
// __tests__/KanbanCard.test.jsx
import { render, screen } from '@testing-library/react'
import { KanbanCard } from '../components/Pipeline/KanbanCard'

test('exibe nome do cliente e prioridade', () => {
  render(<KanbanCard
    cliente={{ nome_fantasia: 'Confecções Lima' }}
    prioridade="alta"
    score={85}
  />)

  expect(screen.getByText('Confecções Lima')).toBeInTheDocument()
  expect(screen.getByText('Prioridade alta')).toBeInTheDocument()
})
```

---

## 12. Segurança

| Item | Implementação |
|------|--------------|
| Autenticação | Supabase Auth (email/senha, magic link) |
| Autorização | Row Level Security (RLS) no Supabase |
| API | Bearer token validado contra Supabase |
| CORS | Apenas domínio do frontend |
| SISPLAN | Conexão ODBC com user read-only |
| Secrets | Variáveis de ambiente (nunca no código) |
| HTTPS | Obrigatório em todas as conexões |

---

## 13. Monitoramento

| O quê | Ferramenta |
|-------|-----------|
| Uptime API | Railway health check + UptimeRobot |
| Erros API | Sentry (Python SDK) |
| Logs sync | Tabela interna `sync_logs` no Supabase |
| Métricas N8N | Dashboard nativo do N8N |
| Frontend | Cloudflare Analytics |

---

## Glossário

| Termo | Definição |
|-------|-----------|
| RCA | Reativação Comercial Automatizada — nome do sistema |
| SISPLAN | ERP utilizado pelo cliente (sistema legado) |
| ODBC | Open Database Connectivity — protocolo de conexão com bancos |
| Pipeline | Funil visual de etapas comerciais (kanban) |
| Lead | Cliente inativo com potencial de reativação |
| Score | Pontuação de 0-100 que indica potencial do lead |
| Card | Representação visual de um cliente no kanban |
| Sync | Sincronização automática de dados do SISPLAN |
