import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Phone, MessageSquare, MapPin, Calendar, ShoppingBag, Tag, RefreshCw } from 'lucide-react'
import { useCliente, useHistoricoCliente } from '@/hooks/useClientes'
import { useContatos } from '@/hooks/useContatos'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge, STATUS_BADGE } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'

const TIPO_CONTATO_ICON = {
  ligacao:  Phone,
  whatsapp: MessageSquare,
  visita:   MapPin,
  pos_venda: ShoppingBag,
}

const RESULTADO_BADGE = {
  interessado:      'teal',
  pedido_realizado: 'success',
  sem_resposta:     'default',
  sem_sucesso:      'warning',
  agendar_retorno:  'warning',
}

const RESULTADO_LABEL = {
  sem_sucesso: 'Sem Sucesso',
}

export function ClienteDetailPage() {
  const { id } = useParams()
  const { cliente, loading: loadingCliente, error } = useCliente(id)
  const { contatos, loading: loadingContatos } = useContatos(id)
  const { historico: compras, loading: loadingHistorico } = useHistoricoCliente(id)

  if (loadingCliente) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        <RefreshCw size={16} className="mr-2 animate-spin" />
        Carregando cliente...
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Cliente não encontrado"
        description={error ?? 'Este cliente não existe ou foi removido.'}
      />
    )
  }

  const badgeCfg = STATUS_BADGE[cliente.status] ?? { variant: 'default', label: cliente.status }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link to="/clientes" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 truncate">
              {cliente.nome_fantasia ?? cliente.razao_social}
            </h1>
            <Badge variant={badgeCfg.variant} dot>{badgeCfg.label}</Badge>
          </div>
          <p className="text-sm text-slate-500">{cliente.razao_social}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="md:col-span-2 rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Dados cadastrais</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <InfoItem label="CNPJ" value={cliente.cnpj} />
            <InfoItem label="Telefone" value={cliente.telefone} />
            <InfoItem label="E-mail" value={cliente.email} />
            <InfoItem label="Segmento" value={cliente.segmento} />
            <InfoItem label="Cidade/UF" value={cliente.cidade ? `${cliente.cidade}, ${cliente.estado}` : null} />
            <InfoItem label="Endereço" value={cliente.endereco} />
            <InfoItem label="Última compra" value={formatDate(cliente.ultima_compra)} />
            <InfoItem label="Qtd. compras" value={`${cliente.qtd_compras} pedidos`} />
          </dl>
        </div>

        <div className="rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Resumo financeiro</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Valor histórico total</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{formatCurrency(cliente.valor_historico)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ticket médio</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-700">
                {formatCurrency(cliente.valor_historico / (cliente.qtd_compras || 1))}
              </p>
            </div>
            {cliente.tags?.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500 flex items-center gap-1"><Tag size={11} /> Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {cliente.tags.map((t) => (
                    <Badge key={t} variant="primary" size="sm">{t.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ShoppingBag size={15} />
          Histórico de compras
        </h2>
        {loadingHistorico ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : compras.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma compra registrada</p>
        ) : (
          <div className="space-y-3">
            {compras.map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Pedido {c.sisplan_pedido_id ?? c.id}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(c.data_pedido)} · {c.itens?.length ?? 0} iten{(c.itens?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(c.valor)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-rca-lg border border-slate-100 bg-white p-5 shadow-soft-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Calendar size={15} />
          Histórico de contatos
        </h2>
        {loadingContatos ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : contatos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum contato registrado</p>
        ) : (
          <ul className="space-y-3">
            {contatos.map((c) => {
              const Icon = TIPO_CONTATO_ICON[c.tipo] ?? Phone
              return (
                <li key={c.id} className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <Icon size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize text-slate-800">{c.tipo.replace(/_/g, ' ')}</p>
                      <Badge variant={RESULTADO_BADGE[c.resultado] ?? 'default'} size="sm">
                        {RESULTADO_LABEL[c.resultado] ?? c.resultado.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{c.resumo}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(c.data_contato).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      {c.duracao_minutos && ` · ${c.duracao_minutos}min`}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value ?? '—'}</dd>
    </div>
  )
}
