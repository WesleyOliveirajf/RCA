import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KanbanCard } from '../components/pipeline/KanbanCard'
import { DndContext } from '@dnd-kit/core'

const baseCard = {
  id: '1',
  prioridade: 'alta',
  score: 85,
  cliente_id: 'c1',
  etapa: 'primeiro_contato',
  cliente: { nome_fantasia: 'Loja Teste', segmento: 'Moda', cidade: 'SP', estado: 'SP' },
}

function renderCard(props = {}) {
  return render(
    <DndContext>
      <KanbanCard card={baseCard} {...props} />
    </DndContext>
  )
}

describe('KanbanCard', () => {
  it('exibe prioridade e score do card', () => {
    renderCard()
    expect(screen.getByText('alta')).toBeTruthy()
    expect(screen.getByText('85')).toBeTruthy()
  })

  it('não exibe badge Bloqueado em lead_qualificado não liberado', () => {
    renderCard({
      card: { ...baseCard, etapa: 'lead_qualificado', liberado: false },
    })
    expect(screen.queryByText('Bloqueado')).toBeNull()
  })

  it('exibe badge Liberado em lead_qualificado liberado', () => {
    renderCard({
      card: { ...baseCard, etapa: 'lead_qualificado', liberado: true },
    })
    expect(screen.getByText('Liberado')).toBeTruthy()
  })

  it('não exibe badge de liberação fora de lead_qualificado', () => {
    renderCard({ card: { ...baseCard, etapa: 'negociacao', liberado: false } })
    expect(screen.queryByText('Bloqueado')).toBeNull()
    expect(screen.queryByText('Liberado')).toBeNull()
  })

  it('exibe botão de marcar liberado para qualquer usuário', () => {
    const onLiberar = vi.fn()
    renderCard({
      card: { ...baseCard, etapa: 'lead_qualificado', liberado: false },
      onLiberar,
    })
    const btn = screen.getByTitle('Marcar lead como liberado')
    fireEvent.click(btn)
    expect(onLiberar).toHaveBeenCalledWith('1')
  })

  it('oculta botão Liberar quando lead já está liberado', () => {
    renderCard({
      card: { ...baseCard, etapa: 'lead_qualificado', liberado: true },
      onLiberar: vi.fn(),
    })
    expect(screen.queryByTitle('Marcar lead como liberado')).toBeNull()
  })
})
