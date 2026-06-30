# Workflows N8N — Sistema RCA

Exportar/importar workflows no N8N self-hosted (Hostinger).

| Arquivo | Trigger | Descrição |
|---------|---------|-----------|
| `01-pos-venda.json` | Webhook `pos-venda` | Aguarda 7 dias, envia WhatsApp pós-venda |
| `02-recontato.json` | Webhook `banco-potenciais` | Recontato após 15 dias |
| `03-alerta-diario.json` | Cron 7h | Contatos pendentes por vendedor |
| `04-catalogo-digital.json` | Webhook `negociacao` | Envia catálogo por segmento |

## Segurança

- Validar header `X-Webhook-Secret` em todos os webhooks
- Usar credenciais N8N para API RCA (Bearer token de service account)
- Não expor URLs de webhook publicamente sem secret

## Import

1. N8N → Workflows → Import from File
2. Configurar variáveis de ambiente no N8N: `RCA_API_URL`, `WEBHOOK_SECRET`
3. Ativar workflows após teste

Ver SDD seção 7 para fluxos detalhados.
