# Task Tracker — Sistema RCA

## Sprint 1 — Design System + Layout Shell
- [/] Atualizar `globals.css` com design system completo
- [/] Atualizar `tailwind.config.js` com paleta estendida
- [/] Atualizar `index.html` com Google Fonts, SEO, favicon
- [/] Criar `Sidebar.jsx` com navegação completa
- [/] Refazer `Layout.jsx` com sidebar responsiva
- [/] Refazer `Header.jsx` com breadcrumb, avatar, dropdown

## Sprint 2 — Login + Kanban Board (mock data)
- [/] Criar `lib/mockData.js` com dados fictícios realistas
- [/] Refazer `LoginPage.jsx` com design premium
- [/] Implementar `KanbanBoard.jsx` com drag-and-drop real
- [/] Implementar `KanbanColumn.jsx` com cores e contadores
- [/] Implementar `KanbanCard.jsx` com badges e score visual
- [/] Implementar `CardDetail.jsx` modal completo
- [/] Atualizar `PipelinePage.jsx`

## Sprint 3 — Dashboard + Clientes + Qualificação
- [/] Refazer `DashboardPage.jsx`
- [/] Implementar `StatsCards.jsx` com KPIs
- [/] Implementar `FunnelChart.jsx` com Recharts
- [/] Implementar `Timeline.jsx`
- [/] Refazer `ClientesPage.jsx` com tabela e filtros
- [/] Refazer `ClienteDetailPage.jsx`
- [/] Refazer `QualificacaoPage.jsx`
- [/] Criar `ScoreForm.jsx`
- [/] Refazer `ConfigPage.jsx`
- [/] Melhorar componentes comuns (Badge, EmptyState, SearchInput)

## Sprint 4 — Backend: Excel ODBC + CRUD
- [/] Criar `integrations/excel_reader.py`
- [/] Adaptar `sisplan_sync_service.py` para Excel
- [/] Completar routers, services, repositories

## Sprint 5 — Backend: Scheduler + N8N (adiada)
- [~] `jobs/scheduler.py` já existe; hardening/configuração ficam para atualização futura
- [~] Conexão N8N adiada para atualização futura

## Sprint 6 — Integração Frontend ↔ Backend
- [/] Trocar mocks por chamadas API nos hooks
- [/] Implementar Supabase Realtime
- [/] Criar hooks faltantes (useDashboard, useQualificacao)
- [/] Importar 964 clientes reais da planilha ODBC (`odbc/Carteira por Representante.xlsx`) no Supabase

## Sprint 7 — Polish + Testes
- [ ] Responsividade completa
- [ ] Loading skeletons, toasts
- [ ] Testes frontend + backend
