# Pasta ODBC — Carteira SISPLAN

Esta pasta guarda a **planilha exportada do SISPLAN** usada como fallback local. Em produção/desenvolvimento integrado, o RCA agora pode ler o SISPLAN direto via ODBC usando `pyodbc`.

## Arquivo esperado

| Item | Valor |
|------|--------|
| Nome padrão | `Carteira por Representante.xlsx` |
| Aba (sheet) | `Consulta1` |
| Intervalo de dados | `A1:T` (cabeçalho na linha 1) |
| Formato | Excel `.xlsx` |

Se o arquivo tiver outro nome, ajuste `SISPLAN_EXCEL_PATH` em `apps/api/.env`.  
Se a variável estiver vazia, a API usa automaticamente o **primeiro `.xlsx`** encontrado nesta pasta.

## Colunas da planilha (export SISPLAN)

A leitura principal usa ODBC direto no SISPLAN em `apps/api/src/rca_api/integrations/sisplan.py`. Se `SISPLAN_DSN` ou `SISPLAN_HOST/SISPLAN_DB` não estiverem configurados, a API usa a planilha Excel via `apps/api/src/rca_api/integrations/excel_reader.py`.

| Coluna na planilha | Campo no RCA | Uso |
|--------------------|--------------|-----|
| Código | `sisplan_id` | Identificador único do cliente |
| Razão Social | `razao_social` | Nome principal |
| Nome Ajustado (Razão Social / Grupo) | `nome_fantasia` | Nome exibido no card |
| E-mail | `email` | Contato |
| Grupo / DESC_GRUPO | `segmento` | Segmento ou grupo comercial |
| Cidade | `cidade` | — |
| Estado | `estado` | UF |
| Dt. último Ped. | `ultima_compra` | Data da última compra (filtro de inatividade) |
| Valor Líq últ. Ped. | `valor_historico` | Valor usado para prioridade no Kanban |
| Status | — | Informativo na planilha |

Colunas como Cód. Rep, Representante e Número últ. Ped. existem na exportação, mas **não são persistidas** hoje no Supabase.

## Quem entra no Kanban

Somente clientes cuja **última compra** indica inatividade entre **6 e 12 meses** (padrão configurável em `sync_config` / tela Config).

Exemplo típico após sync: **~887 clientes** na coluna **Inativos** (faixa 6–12 meses).

Prioridade do card:

- **Alta** — `valor_historico` > R$ 50.000  
- **Média** — > R$ 20.000  
- **Baixa** — demais  

## Como atualizar a carteira

1. Configure o ODBC direto no `apps/api/.env` usando `SISPLAN_DSN` ou `SISPLAN_HOST/SISPLAN_DB/SISPLAN_USER/SISPLAN_PASS`.
2. Garanta que a API está rodando com `SUPABASE_SERVICE_KEY` configurada.
3. Clique em **Sync SISPLAN** no Kanban ou em **Executar sync** nas Configurações.
4. Se o ODBC direto não estiver configurado, a API usa a planilha desta pasta como fallback.

### Opção A — Pela aplicação (recomendado)

Com a API rodando e `SUPABASE_SERVICE_KEY` configurada:

- Kanban → botão **Sync SISPLAN**, ou  
- Configurações → **Executar sync**

Endpoint: `POST /api/sync/executar` (requer usuário **admin**).

### Opção B — Script SQL (sem API)

```bash
cd apps/api
set PYTHONPATH=src
python scripts/generate_sync_sql.py
```

Gera batches em `apps/api/scripts/.sync_batches/`.  
Para aplicar no Postgres local/remoto (com `DATABASE_URL` no `.env`):

```bash
python scripts/apply_sync_batches.py
```

### Opção C — Teste rápido da leitura ODBC/SISPLAN

```bash
cd apps/api
set PYTHONPATH=src
python -c "from rca_api.integrations.sisplan import buscar_clientes_inativos; print(len(buscar_clientes_inativos(6, 12)))"
```

Deve retornar a quantidade de inativos (ex.: `887`).

## Requisitos (Windows)

- Driver ODBC do banco SISPLAN instalado/configurado ou DSN criado no Windows
- Para fallback Excel: **Microsoft Excel** ou **Microsoft Access Database Engine** (ACE) instalado
- Para fallback Excel: driver ODBC `{Microsoft Excel Driver (*.xls, *.xlsx, *.xlsm, *.xlsb)}`
- Python: pacote `pyodbc` (`pip install pyodbc`)

Configuração em `apps/api/.env`:

```env
SISPLAN_ODBC_DRIVER={ODBC Driver 17 for SQL Server}
SISPLAN_DSN=
SISPLAN_HOST=
SISPLAN_DB=
SISPLAN_USER=
SISPLAN_PASS=
SISPLAN_PORT=1433

SISPLAN_EXCEL_PATH=../../odbc/Carteira por Representante.xlsx
SISPLAN_EXCEL_SHEET=Consulta1
SISPLAN_EXCEL_RANGE=A1:T
SISPLAN_EXCEL_ODBC_DRIVER={Microsoft Excel Driver (*.xls, *.xlsx, *.xlsm, *.xlsb)}
```

## O que não colocar aqui

- Não versionar credenciais ou `.env`  
- Não usar `supabase/seed/dev_kanban.sql` — dados mockados, **depreciados**  
- Evite múltiplos `.xlsx` sem definir `SISPLAN_EXCEL_PATH` (a API pegará o primeiro por ordem alfabética)

## Fluxo resumido

```
SISPLAN → export Excel → odbc/*.xlsx → pyodbc → API sync → Supabase → Frontend RCA
```

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| `Arquivo Excel não encontrado` | Confirme caminho em `SISPLAN_EXCEL_PATH` ou arquivo nesta pasta |
| `Nenhum arquivo Excel encontrado na pasta odbc` | Coloque um `.xlsx` aqui ou configure o path |
| Erro de driver ODBC | Instale [Microsoft Access Database Engine](https://www.microsoft.com/en-us/download/details.aspx?id=54920) |
| Planilha aberta no Excel | Feche o arquivo antes do sync |
| Sync retorna 0 clientes | Verifique datas em **Dt. último Ped.** e faixa 6–12 meses em Config |
| Kanban vazio no browser | Preencha `VITE_SUPABASE_ANON_KEY` e faça login real |
