# AGENTS.md — Guia de memória para agentes

Documento de contexto permanente do **Sistema RCA** (Reativação Comercial Automatizada).  
Leia este arquivo **antes** de alterar código, schema ou deploy. Complementa `README.md`, `docs/ARCHITECTURE.md` e `SDD_Sistema_RCA.md`.

**Última atualização:** 2026-07-20

---

## 1. O que é este sistema

Plataforma web para reativação de clientes inativos:

- Kanban de pipeline comercial
- Cadastro/consulta de clientes
- Sync com ERP SISPLAN (ODBC, read-only)
- Automações via N8N
- Auth + RLS no Supabase

### Stack

| Camada | Tecnologia | Deploy |
|--------|------------|--------|
| Frontend | React + Vite + Tailwind | Cloudflare Pages |
| Backend | Python FastAPI | Railway |
| Banco / Auth | Supabase PostgreSQL 17 + RLS | Supabase (`us-east-2`) |
| Automação | N8N | Hostinger |
| ERP | SISPLAN via ODBC | On-prem / rede interna |

### Projeto Supabase (produção)

| Campo | Valor |
|-------|--------|
| Nome | `crm` |
| Project ref / ID | `lgsxqipuydyyxqkvbfth` |
| URL | `https://lgsxqipuydyyxqkvbfth.supabase.co` |
| Host DB | `db.lgsxqipuydyyxqkvbfth.supabase.co` |
| Região | `us-east-2` |

Há outro projeto na mesma org (`Requisicao` / `hufrhxszklljjznsmoan`) — **não é o RCA**.

---

## 2. Estrutura do monorepo

```
RCA/
├── apps/
│   ├── api/                 # FastAPI — regras, sync ODBC, webhooks
│   │   └── src/rca_api/
│   │       ├── routers/     # HTTP
│   │       ├── services/    # negócio
│   │       ├── repositories/# Supabase (service_role)
│   │       ├── schemas/     # Pydantic
│   │       └── integrations/
│   └── web/                 # React SPA
│       └── src/
│           ├── pages/       # telas (ClientesPage, Kanban, …)
│           ├── hooks/       # useClientes, etc. (API + fallback Supabase)
│           └── lib/
│               ├── api.js           # fetch → FastAPI + JWT
│               ├── supabase.js      # client anon
│               └── supabaseData.js  # queries/RPCs diretas no Supabase
├── supabase/migrations/     # fonte da verdade do schema + RLS + RPCs
├── n8n/workflows/
├── docs/
├── odbc/
└── .github/workflows/
```

**Padrão backend:** Router → Service → Repository.  
**Padrão frontend resiliente:** tenta API FastAPI; se falhar, cai no Supabase (anon + JWT + RLS/RPC).

---

## 3. Perfis e autorização

Perfis em `public.usuarios`: `vendedor` | `supervisor` | `admin` | `superadmin`.

| Quem | Vê clientes / cards |
|------|---------------------|
| Gestor (`supervisor`, `admin`, `superadmin`) | Tudo |
| Vendedor | Clientes com card acessível no funil (próprio ou etapas abertas) |

Funções RLS importantes:

- `fn_eh_gestor()`, `fn_meu_perfil()`, `fn_eh_admin()`
- `fn_pode_acessar_cliente(cliente_id)` — gestor **ou** existe card visível
- `fn_pode_ver_card_row(responsavel_id, etapa)`

**Funil aberto** (todos autenticados veem/movem): `inativos`, `primeiro_contato`, `lead_qualificado`.

**Regra crítica:** cliente **sem** `pipeline_cards` some da listagem do vendedor (API filtra por IDs de cards; RLS de SELECT usa `fn_pode_acessar_cliente`). Todo cadastro manual **deve** criar card na etapa `inativos`.

---

## 4. Tabelas principais (`public`)

| Tabela | Uso |
|--------|-----|
| `usuarios` | Perfil + vínculo com `auth.users` |
| `clientes` | Cadastro comercial (`sisplan_id` unique, sync ERP) |
| `pipeline_cards` | Cards do kanban (`cliente_id` → cliente) |
| `contatos` | Contatos / follow-ups |
| `atividades` | Timeline |
| `historico_compras` | Pedidos (sync) |
| `qualificacoes` | Checklist lead |
| `lead_desqualificacoes` / `lead_tarefas` / `lead_nutricao` | Fluxo de desqualificação |
| `configuracoes` | Config por usuário/sistema |
| `sync_logs` / `audit_logs` | Operacional / auditoria |

Migrations: `supabase/migrations/`. Preferir `apply_migration` via MCP **e** gravar o mesmo SQL no repositório.

---

## 5. RPCs intencionais (frontend)

Expostas a `authenticated` (após hardening — migration 013):

| RPC | Uso |
|-----|-----|
| `fn_admin_create_user` | Admin cria usuário |
| `fn_liberar_lead` | Liberação de lead |
| `fn_criar_cliente` | **Cadastro manual** de cliente + card `inativos` |

Helpers internas (`fn_pode_*`, etc.) **não** devem ser re-expostas a `anon`/`PUBLIC` sem necessidade.

---

## 6. Changelog de agentes — 2026-07-20

### Problema

Na tela **Clientes**, cadastro de novos clientes falhava. No banco **não havia nenhum** cliente com `sisplan_id IS NULL` — o insert nunca persistia.

### Causa raiz

Em `ClienteService.criar`, o payload usava:

```python
dados.model_dump(exclude_none=True)
```

`ClienteCreate.valor_historico` é `Decimal("0")`. O client Supabase serializa JSON e quebra com:

`Object of type Decimal is not JSON serializable`

O handler genérico devolvia só `"Erro interno do servidor"`.

### Correções aplicadas

#### A) Banco (MCP Supabase `apply_migration`)

- Migration: `supabase/migrations/20260720000001_fn_criar_cliente.sql`
- Nome remoto da migration: `fn_criar_cliente_com_card`
- Função `public.fn_criar_cliente(...)` (`SECURITY DEFINER`, `search_path = public`):
  1. Valida `auth.uid()` e perfil
  2. Insere em `clientes` (`status = inativo`)
  3. Insere em `pipeline_cards` (`etapa = inativos`, `responsavel_id = auth.uid()`)
  4. Retorna JSON do cliente + `card_id`
- `GRANT EXECUTE … TO authenticated`

#### B) Frontend

- `apps/web/src/lib/supabaseData.js` → `sbCriarCliente()` chama `supabase.rpc('fn_criar_cliente', …)`
- `apps/web/src/hooks/useClientes.js` → `criarCliente` tenta `POST /api/clientes`; em falha usa `sbCriarCliente`

#### C) Backend

- `apps/api/src/rca_api/services/cliente_service.py`:
  - `model_dump(mode="json", exclude_none=True)` no criar/atualizar
  - Após insert do cliente, cria card em `inativos` via `PipelineRepository.criar`

### Como validar

1. UI: Clientes → Novo cliente → salvar → deve aparecer na lista e no kanban (`inativos`).
2. SQL (MCP): cliente com `sisplan_id IS NULL` + card correspondente.
3. Python: `ClienteCreate(...).model_dump(mode="json")` deve ser serializável com `json.dumps`.

---

## 7. Armadilhas conhecidas (não repetir)

1. **`Decimal` / `date` / `datetime` no `model_dump`**  
   Sempre usar `mode="json"` antes de enviar ao Supabase Python client.

2. **Cliente sem card**  
   Vendedor “perde” o cliente no refetch. Sempre criar `pipeline_cards`.

3. **Create só via API sem fallback**  
   Listagem já tem fallback Supabase; mutações críticas também devem ter (padrão `fn_criar_cliente`).

4. **service_role no backend ignora RLS**  
   Autorização deve estar no Service (perfil + ownership). RLS protege o caminho direto do browser.

5. **`nome_contato`**  
   Existe no banco e no schema Pydantic; UI atual do modal pode não enviar — ok.

6. **Erros 500 genéricos**  
   `exceptions.py` engole detalhe. Olhar logs da API + Postgres (`get_logs` MCP).

7. **Logs recorrentes**  
   `permission denied for table sync_logs` aparece com frequência — investigar grants/policies se for tarefa relacionada a sync.

8. **Não confundir projetos Supabase**  
   RCA = `lgsxqipuydyyxqkvbfth` (`crm`).

---

## 8. Como o agente deve usar o Supabase MCP

Servidores: `plugin-supabase-supabase` e/ou `user-supabase`.

Fluxo típico:

1. `list_projects` / confirmar ref `lgsxqipuydyyxqkvbfth`
2. `list_tables` / `execute_sql` para inspecionar
3. DDL → `apply_migration` (nome snake_case) **e** arquivo em `supabase/migrations/`
4. `get_logs` (`postgres`, `api`, `auth`) e `get_advisors` após mudanças sensíveis
5. Nunca expor `service_role` no frontend; nunca colar secrets na documentação

Para testar RPC com usuário simulado:

```sql
SELECT set_config('request.jwt.claim.sub', '<uuid-usuario>', true);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"<uuid-usuario>","role":"authenticated"}',
  true
);
SELECT public.fn_criar_cliente(p_razao_social := 'Teste');
-- limpar dados de teste depois
```

---

## 9. Mapa rápido de arquivos (cadastro de clientes)

| Etapa | Arquivo |
|-------|---------|
| Tela / modal | `apps/web/src/pages/ClientesPage.jsx` |
| Hook | `apps/web/src/hooks/useClientes.js` |
| Fallback RPC | `apps/web/src/lib/supabaseData.js` → `sbCriarCliente` |
| HTTP client | `apps/web/src/lib/api.js` |
| Router | `apps/api/src/rca_api/routers/clientes.py` |
| Service | `apps/api/src/rca_api/services/cliente_service.py` |
| Schema | `apps/api/src/rca_api/schemas/cliente.py` |
| Repo | `apps/api/src/rca_api/repositories/cliente_repository.py` |
| RPC SQL | `supabase/migrations/20260720000001_fn_criar_cliente.sql` |

---

## 10. Convenções para novos trabalhos

- Responder e documentar em **português (Brasil)** quando o usuário estiver em PT.
- Mudanças de schema: migration versionada + aplicar no projeto remoto `crm`.
- Preferir corrigir causa raiz; fallback Supabase para resiliência da UI.
- Não commitiar `.env` / chaves. Usar `.env.example` sem secrets.
- Não ampliar escopo: só o pedido + o mínimo para não deixar o sistema inconsistente (ex.: cliente + card).
- Antes de aprovar “pronto pra produção”, considerar o agente/regra `revisor-producao` e `RELATORIO-PRODUCAO.md` se existir.

---

## 11. Documentação relacionada

| Doc | Conteúdo |
|-----|----------|
| `README.md` | Setup local, stack, segurança básica |
| `docs/ARCHITECTURE.md` | Camadas, authz, deploy |
| `docs/FOLDER_STRUCTURE.md` | Árvore de pastas |
| `SDD_Sistema_RCA.md` | Spec funcional completa |
| `RELATORIO-PRODUCAO.md` | Achados de audit de produção (se presente) |
| `odbc/README.md` | Sync SISPLAN / Excel |

---

## 12. Checklist rápido ao tocar em “Clientes”

- [ ] Payload serializável (`mode="json"` se houver Decimal/date)
- [ ] Card `pipeline_cards` criado junto (API e/ou `fn_criar_cliente`)
- [ ] Fallback UI se a API estiver offline
- [ ] RLS/RPC: usuário autenticado + perfil permitido
- [ ] Migration no repo **e** aplicada no Supabase `crm`
- [ ] Teste: gestor e vendedor veem o cliente após criar
- [ ] Atualizar **esta seção 6** (changelog) se a regra mudar de novo
