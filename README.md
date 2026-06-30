# Sistema RCA — Reativação Comercial Automatizada

Plataforma web para reativação de clientes inativos com pipeline kanban, sync SISPLAN e automações N8N.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React + Vite + Tailwind (Cloudflare Pages) |
| Backend | Python FastAPI (Railway) |
| Banco | Supabase PostgreSQL + Auth + RLS |
| Automação | N8N (Hostinger) |
| ERP | SISPLAN via ODBC |

## Estrutura do monorepo

```
RCA-Torp/
├── apps/
│   ├── api/          # FastAPI — lógica de negócio, sync ODBC, webhooks N8N
│   └── web/          # React SPA — kanban, dashboard, contatos
├── supabase/         # Migrations, RLS, Edge Functions
├── n8n/              # Export dos workflows
├── scripts/          # Utilitários de setup e deploy
├── docs/             # Documentação técnica
└── .github/workflows # CI/CD
```

## Pré-requisitos

- Node.js 20+
- Python 3.11+
- Supabase CLI
- ODBC Driver 17 for SQL Server (sync SISPLAN)

## Setup local

```bash
# Backend
cd apps/api
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements-dev.txt
copy .env.example .env   # preencher variáveis

# Frontend
cd apps/web
npm install
copy .env.example .env.local

# Supabase local (opcional)
supabase start
supabase db reset
```

## Desenvolvimento

```bash
# API — http://localhost:8000
cd apps/api && uvicorn rca_api.main:app --reload

# Web — http://localhost:5173
cd apps/web && npm run dev
```

## Segurança

- **Frontend:** apenas `SUPABASE_ANON_KEY` — nunca service role
- **Backend:** `SUPABASE_SERVICE_KEY` + validação JWT em toda rota protegida
- **SISPLAN:** usuário ODBC read-only
- **RLS:** políticas no PostgreSQL como segunda camada de autorização
- **Secrets:** somente via variáveis de ambiente (Railway, Cloudflare, Supabase)

## Documentação

- [SDD completo](./SDD_Sistema_RCA.md)
- [Arquitetura detalhada](./docs/ARCHITECTURE.md)
