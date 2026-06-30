# Estrutura de pastas — referência rápida

```
RCA-Torp/
├── .github/workflows/       # CI (api-ci, web-ci)
├── apps/
│   ├── api/                 # FastAPI
│   │   ├── src/rca_api/
│   │   │   ├── core/        # security, logging, middleware, exceptions
│   │   │   ├── routers/     # endpoints HTTP
│   │   │   ├── services/    # regra de negócio
│   │   │   ├── repositories/# acesso Supabase
│   │   │   ├── integrations/# SISPLAN ODBC, N8N
│   │   │   ├── schemas/     # Pydantic DTOs
│   │   │   └── jobs/        # APScheduler
│   │   └── tests/
│   └── web/                 # React SPA
│       └── src/
│           ├── components/  # UI por domínio
│           ├── contexts/    # AuthContext
│           ├── hooks/       # usePipeline, useClientes...
│           ├── lib/         # supabase, api, utils
│           └── pages/       # rotas
├── supabase/
│   ├── migrations/          # schema + RLS
│   └── seed/
├── n8n/workflows/
├── scripts/
└── docs/
```

## Decisões de arquitetura

| Decisão | Motivo |
|---------|--------|
| Monorepo | Versionamento unificado, CI por path |
| Repository pattern | Testabilidade, troca de data source |
| Service role só no backend | Segurança — anon key no frontend |
| RLS + RBAC API | Defense in depth |
| sync_logs / atividades / audit_logs | Observabilidade e auditoria |
| Rate limit em `/sync/executar` | Proteção contra abuso |
