# Relatório de Prontidão para Produção

**Aplicação:** Sistema RCA
**Data da análise:** 2026-06-29
**Veredito:** ❌ REPROVADO — correções necessárias antes do deploy

## Resumo executivo

A aplicação não está pronta para produção por falhas críticas de autorização e isolamento de dados no Supabase/API, além de pipeline de qualidade quebrado. O maior risco é exposição/alteração de dados comerciais e PII por usuários autenticados ou, em views específicas, por acesso anônimo. O esforço estimado é médio: a correção exige rever RLS/grants, remover bypasses perigosos via service role, corrigir testes/lint e atualizar dependências vulneráveis.

| Severidade | Quantidade |
|------------|-----------|
| 🔴 Blocker | 3 |
| 🟠 Alto    | 3 |
| 🟡 Médio   | 3 |
| 🟢 Baixo   | 0 |

## Achados detalhados

### 🔴 SEC-01 RLS/grants expõem dados e operações sensíveis de forma ampla
- **Categoria:** Segurança
- **Onde:** `supabase/migrations/20260629000004_grants_public.sql:7`
- **Problema:** `authenticated` recebe `SELECT, INSERT, UPDATE, DELETE` em todas as tabelas e `anon` recebe `SELECT` em todas as tabelas/views. As políticas RLS usam `USING (true)` em tabelas sensíveis como `usuarios`, `clientes`, `contatos`, `historico_compras`, `qualificacoes` e `atividades` (`supabase/migrations/20260625000002_rls_policies.sql:22`, `31`, `34`, `60`, `68`, `72`, `92`). Além disso, views públicas são criadas sem `security_invoker` (`supabase/migrations/20260625000001_schema_base.sql:253`, `263`).
- **Risco:** qualquer usuário autenticado pode ler grande parte da base comercial e dados pessoais; dependendo da relação/view, acesso anônimo pode consultar agregados e contatos expostos por view. Isso abre risco de vazamento de PII, BOLA/IDOR e alteração indevida de dados.
- **Como corrigir:** substituir grants globais por grants mínimos por tabela/role; remover `USING (true)` de tabelas sensíveis; criar políticas por propriedade/responsável/perfil; usar `CREATE VIEW ... WITH (security_invoker = true)` ou revogar acesso das views para `anon/authenticated`; validar com `supabase db advisors` e testes de RLS por papel.

### 🔴 SEC-02 Usuário pode receber perfil a partir de metadata controlável
- **Categoria:** Segurança
- **Onde:** `supabase/migrations/20260625000001_schema_base.sql:239`
- **Problema:** o trigger de criação de usuário grava `perfil` usando `NEW.raw_user_meta_data->>'perfil'` dentro de função `SECURITY DEFINER` (`supabase/migrations/20260625000001_schema_base.sql:231`, `243`). Em Supabase, `raw_user_meta_data` é controlável pelo usuário e não deve ser fonte de autorização.
- **Risco:** se signup ou criação externa estiver habilitada, um usuário pode se autopromover para `admin` ou `supervisor`, obtendo acesso às rotas e políticas que dependem de `perfil`.
- **Como corrigir:** nunca aceitar perfil vindo de `raw_user_meta_data`; criar sempre como `vendedor`/pendente e promover apenas por fluxo administrativo server-side; armazenar autorização em tabela controlada pelo backend ou `app_metadata`; adicionar testes de criação de usuário tentando forçar perfil.

### 🔴 SEC-03 Usuário autenticado pode apagar cards do funil aberto pela API service-role
- **Categoria:** Segurança / Perda de dados
- **Onde:** `apps/api/src/rca_api/services/pipeline_service.py:91`
- **Problema:** a rota `DELETE /api/pipeline/cards/{card_id}` chama `service.remover` (`apps/api/src/rca_api/routers/pipeline.py:61`) e o service só verifica `obter`. `obter` permite acesso a qualquer card em etapas de funil aberto (`apps/api/src/rca_api/core/security.py:25`). Como o backend usa `SUPABASE_SERVICE_KEY`, a política RLS de delete não protege essa operação.
- **Risco:** qualquer usuário autenticado pode remover cards nas etapas abertas, causando perda de dados e quebra do pipeline comercial.
- **Como corrigir:** restringir delete a `admin/supervisor` no service, preferencialmente remover delete do fluxo de usuários finais, auditar cada delete e adicionar teste de autorização garantindo que vendedor não apaga card aberto.

### 🟠 SEC-04 Rotas service-role não aplicam autorização por objeto em clientes, contatos e qualificações
- **Categoria:** Segurança
- **Onde:** `apps/api/src/rca_api/routers/clientes.py:21`
- **Problema:** várias rotas exigem autenticação, mas não validam se o usuário pode acessar o objeto. Exemplos: listar/criar/atualizar clientes (`apps/api/src/rca_api/routers/clientes.py:21`, `30`, `57`), listar/editar contatos por id/cliente (`apps/api/src/rca_api/routers/contatos.py:30`, `57`) e registrar qualificação sem validar permissão no card (`apps/api/src/rca_api/services/qualificacao_service.py:14`). Como o backend usa service role (`apps/api/src/rca_api/dependencies.py:21`), RLS não limita esses acessos.
- **Risco:** usuários autenticados podem consultar ou alterar dados de clientes e contatos fora de sua carteira/responsabilidade.
- **Como corrigir:** centralizar autorização por objeto nos services; exigir perfil mínimo em rotas administrativas; filtrar clientes/contatos por responsável ou escopo permitido; adicionar testes de IDOR/BOLA.

### 🟠 SEC-05 Dependências frontend possuem vulnerabilidades conhecidas críticas/altas
- **Categoria:** Segurança / Dependências
- **Onde:** `apps/web/package.json:36`
- **Problema:** `npm audit --audit-level=high --json` encontrou 6 vulnerabilidades: 1 crítica em `vitest`, 1 alta em `vite` e 4 moderadas transitivas relacionadas a `vite`, `esbuild`, `vite-node` e `@vitest/mocker`.
- **Risco:** cadeia de build/dev vulnerável; dependendo de exposição do dev server ou tooling, pode haver leitura/execução indevida de arquivos.
- **Como corrigir:** atualizar `vite`, `vitest`, `@vitejs/plugin-react` e lockfile para versões corrigidas; repetir `npm audit --audit-level=high`; bloquear deploy se houver crítica/alta pendente.

### 🟠 TEST-01 Testes e lint não passam de forma reprodutível
- **Categoria:** Testes / CI/CD
- **Onde:** `.github/workflows/web-ci.yml:32`
- **Problema:** `npm run lint` falha porque não há configuração ESLint apesar do script existir (`apps/web/package.json:10`). `npm run test -- --run` falha com `document is not defined`, pois Vitest não está configurado para ambiente DOM (`apps/web/vite.config.js:5`). A API também falha ao rodar `python -m pytest -q` sem `PYTHONPATH=src`; o CI instala requirements, mas não instala o pacote nem define `PYTHONPATH` (`.github/workflows/api-ci.yml:29`, `36`).
- **Risco:** pipeline não garante qualidade antes do deploy; regressões em rotas críticas e UI podem passar despercebidas.
- **Como corrigir:** adicionar configuração ESLint; configurar Vitest com `environment: 'jsdom'` e dependência necessária; corrigir empacotamento da API com instalação editável ou `PYTHONPATH`; tornar CI bloqueante.

### 🟡 OPS-01 Dockerfile usa imagem móvel e executa como root
- **Categoria:** Build, deploy e CI/CD
- **Onde:** `apps/api/Dockerfile:1`
- **Problema:** a imagem base `python:3.11-slim` não está fixada por digest/patch e não há criação/uso de usuário não-root antes do `CMD` (`apps/api/Dockerfile:25`).
- **Risco:** builds não totalmente reprodutíveis e maior impacto em caso de comprometimento do processo no container.
- **Como corrigir:** fixar imagem por versão/digest, criar usuário sem privilégios e executar `uvicorn` com `USER` não-root.

### 🟡 OBS-01 Observabilidade mínima incompleta para produção
- **Categoria:** Observabilidade
- **Onde:** `apps/api/src/rca_api/routers/health.py:6`
- **Problema:** há `/health`, logs com request id e Sentry opcional, mas não há readiness que valide dependências, métricas ou tracing. `audit_logs` existe no schema (`supabase/migrations/20260625000001_schema_base.sql:165`), mas não há evidência de escrita de auditoria nas rotas sensíveis.
- **Risco:** incidentes de banco, Supabase, ODBC ou N8N podem não ser detectados antes de tráfego real; ações sensíveis ficam sem trilha confiável.
- **Como corrigir:** adicionar readiness para Supabase/ODBC quando aplicável, métricas básicas, tracing ou APM e auditoria para operações administrativas/delete/sync.

### 🟡 PERF-01 Bundle frontend acima do limite recomendado
- **Categoria:** Performance e escala
- **Onde:** `apps/web/package.json:8`
- **Problema:** `npm run build` passou, mas o bundle JS gerado ficou com 918.42 kB minificado e o Vite alertou chunk acima de 500 kB.
- **Risco:** carregamento inicial mais lento e pior experiência em redes instáveis.
- **Como corrigir:** aplicar code splitting com `dynamic import`, separar bibliotecas pesadas e revisar chunks manuais no Rollup/Vite.

## Plano de Tasks

> Execute na ordem. Marque `[x]` ao concluir. Resolva todos os 🔴 antes de qualquer outra coisa.

### Sprint 1 — Bloqueadores (obrigatório antes do deploy)
- [ ] **[SEC-01]** Reescrever grants, RLS e views sensíveis
  - Critério de aceite: usuário autenticado só acessa dados do seu escopo; `anon` não lê dados operacionais/PII; views usam `security_invoker` ou têm grants revogados; testes de RLS passam por papel.
  - Esforço estimado: G

- [ ] **[SEC-02]** Remover autorização baseada em `raw_user_meta_data`
  - Critério de aceite: criação de usuário nunca aceita `perfil` enviado pelo cliente; promoção de perfil só por admin/backend; teste prova que signup com `perfil=admin` não cria admin.
  - Esforço estimado: M

- [ ] **[SEC-03]** Bloquear delete indevido de cards
  - Critério de aceite: vendedor não consegue deletar cards, inclusive em funil aberto; delete exige perfil autorizado e gera auditoria.
  - Esforço estimado: M

### Sprint 2 — Itens de alta prioridade
- [ ] **[SEC-04]** Aplicar autorização por objeto em rotas service-role
  - Critério de aceite: clientes, contatos, qualificações e histórico respeitam carteira/responsável/perfil; testes IDOR/BOLA cobrem leitura e escrita.
  - Esforço estimado: G

- [ ] **[SEC-05]** Atualizar dependências vulneráveis do frontend
  - Critério de aceite: `npm audit --audit-level=high` retorna zero vulnerabilidades críticas/altas.
  - Esforço estimado: M

- [ ] **[TEST-01]** Corrigir lint/test/CI
  - Critério de aceite: `npm run lint`, `npm run test -- --run`, `npm run build`, `ruff check src tests` e `pytest` passam no ambiente local e no CI.
  - Esforço estimado: M

### Sprint 3 — Médios e melhorias
- [ ] **[OPS-01]** Endurecer Dockerfile
  - Critério de aceite: imagem base fixada e container executa como usuário não-root.
  - Esforço estimado: P

- [ ] **[OBS-01]** Implementar readiness, métricas e auditoria real
  - Critério de aceite: readiness valida dependências críticas; ações sensíveis escrevem `audit_logs`; métricas/tracing estão disponíveis no ambiente de produção.
  - Esforço estimado: M

- [ ] **[PERF-01]** Reduzir bundle inicial do frontend
  - Critério de aceite: build sem alerta de chunk acima de 500 kB ou limite aumentado com justificativa técnica; rotas principais carregam por chunks.
  - Esforço estimado: M

## Critérios para nova aprovação

A aplicação será reavaliada como APROVADA quando:
- [ ] Todos os 🔴 resolvidos
- [ ] Todos os 🟠 resolvidos
- [ ] Suíte de testes dos caminhos críticos passando
- [ ] `npm audit --audit-level=high` sem críticas/altas
- [ ] RLS/grants validados com testes por papel (`anon`, `authenticated` vendedor, supervisor, admin)
- [ ] Rotas service-role com autorização por objeto e testes de IDOR/BOLA
- [ ] Pipeline CI reproduz localmente lint, testes e build sem ajustes manuais

## Próximo passo

Após concluir as tasks, rode este agente novamente para reauditoria.
