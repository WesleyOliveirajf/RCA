# Arquitetura — Sistema RCA

## Princípios

1. **Monorepo** — frontend, backend e infra versionados juntos
2. **Defense in depth** — JWT (API) + RLS (Supabase) + RBAC (backend)
3. **Separation of concerns** — Router → Service → Repository
4. **Backend for Frontend sensível** — sync ODBC, service role e webhooks só no FastAPI
5. **Event-driven** — movimentações de card disparam webhooks N8N de forma assíncrona

## Camadas do Backend

```
Request
  → Middleware (CORS, rate limit, request ID)
  → Router (validação HTTP, status codes)
  → Service (regra de negócio, orquestração)
  → Repository (acesso Supabase / queries)
  → Integrations (SISPLAN ODBC, N8N webhooks)
```

## Fluxo de autorização

```
Frontend (anon key + JWT do usuário)
  → FastAPI valida JWT via Supabase Auth
  → Service verifica perfil (vendedor/supervisor/admin)
  → Repository usa service key (server-side only)
  → RLS no Postgres filtra linhas por auth.uid()
```

## Escalabilidade

| Componente | Estratégia |
|------------|------------|
| API Railway | Horizontal scaling, health check `/health` |
| Supabase | Connection pooling (PgBouncer), índices nas migrations |
| Sync ODBC | Job isolado APScheduler, idempotente por `sisplan_id` |
| Frontend | CDN Cloudflare Pages, code splitting por rota |
| N8N | Workflows stateless, retry nativo |

## Tabelas operacionais (além do domínio)

- `sync_logs` — auditoria de sincronizações SISPLAN
- `atividades` — timeline de movimentações de cards
- `audit_logs` — ações sensíveis (admin, sync manual)

## Deploy

| Serviço | Plataforma | Trigger |
|---------|------------|---------|
| API | Railway | push `main` → apps/api |
| Web | Cloudflare Pages | push `main` → apps/web |
| DB | Supabase | migrations via CLI |
| N8N | Hostinger | import manual dos JSON em `n8n/workflows/` |
