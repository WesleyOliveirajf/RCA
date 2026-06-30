import { describe, it, expect } from 'vitest'
import {
  podeLiberar,
  precisaLiberacaoParaMover,
  podeMoverCard,
  MSG_LEAD_NAO_LIBERADO,
} from '../lib/utils'

describe('precisaLiberacaoParaMover', () => {
  it('exige liberação para sair de lead_qualificado para negociacao', () => {
    expect(
      precisaLiberacaoParaMover({
        etapaAtual: 'lead_qualificado',
        etapaDestino: 'negociacao',
        liberado: false,
      })
    ).toBe(true)
  })

  it('permite avanço quando liberado', () => {
    expect(
      precisaLiberacaoParaMover({
        etapaAtual: 'lead_qualificado',
        etapaDestino: 'negociacao',
        liberado: true,
      })
    ).toBe(false)
  })

  it('permite retorno no funil aberto sem liberação', () => {
    expect(
      precisaLiberacaoParaMover({
        etapaAtual: 'lead_qualificado',
        etapaDestino: 'primeiro_contato',
        liberado: false,
      })
    ).toBe(false)
  })
})

describe('podeLiberar', () => {
  it('somente admin em lead_qualificado não liberado', () => {
    expect(
      podeLiberar({ perfil: 'admin', etapaAtual: 'lead_qualificado', liberado: false })
    ).toBe(true)
    expect(
      podeLiberar({ perfil: 'vendedor', etapaAtual: 'lead_qualificado', liberado: false })
    ).toBe(false)
    expect(
      podeLiberar({ perfil: 'admin', etapaAtual: 'lead_qualificado', liberado: true })
    ).toBe(false)
  })
})

describe('podeMoverCard com liberação', () => {
  it('bloqueia vendedor sem liberação', () => {
    expect(
      podeMoverCard({
        perfil: 'vendedor',
        responsavelId: 'u1',
        userId: 'u1',
        etapaAtual: 'lead_qualificado',
        etapaDestino: 'negociacao',
        liberado: false,
      })
    ).toBe(false)
  })
})

describe('MSG_LEAD_NAO_LIBERADO', () => {
  it('tem mensagem orientativa', () => {
    expect(MSG_LEAD_NAO_LIBERADO).toContain('administrador')
  })
})
