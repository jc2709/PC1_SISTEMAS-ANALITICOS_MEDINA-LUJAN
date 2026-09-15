import { describe, expect, it } from 'vitest'
import {
  buildStrategicPlanning,
  createEmptyPlanning,
  importApprovedAnalysis,
  validateStrategicPlanning,
} from '../services/planningService'
import type { AIInteraction } from '../types/models'

const approvedInteraction: AIInteraction = {
  id: 'ai-1',
  organizationId: 'org-1',
  planId: 'plan-1',
  module: 'STRATEGIC_ANALYSIS',
  action: 'GENERATE_ANALYSIS',
  prompt: '{}',
  response: '{}',
  model: 'gemini-3.6-flash',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  status: 'APPROVED',
  approvedByUser: true,
  userEdited: false,
  finalContent: {
    executiveSummary: 'La concentración comercial limita el crecimiento.',
    strengths: ['Oferta especializada'],
    risks: ['Concentración de clientes'],
    priorities: ['Diversificar la cartera'],
    confidence: 0.82,
  },
}

describe('planningService', () => {
  it('crea un borrador completo para un plan', () => {
    const draft = createEmptyPlanning('org-1', 'plan-1')
    expect(draft.sectionStatuses).toEqual({ PREPARATION: 'DRAFT', DIAGNOSIS: 'DRAFT', IDENTITY: 'DRAFT', STRATEGY: 'DRAFT' })
    expect(validateStrategicPlanning(draft)).toEqual({})
  })

  it('incorpora únicamente una propuesta aprobada y evita duplicados', () => {
    const draft = createEmptyPlanning('org-1', 'plan-1')
    const imported = importApprovedAnalysis(draft, approvedInteraction)
    const importedTwice = importApprovedAnalysis(imported, approvedInteraction)

    expect(importedTwice.swot.strengths).toEqual(['Oferta especializada'])
    expect(importedTwice.swot.threats).toEqual(['Concentración de clientes'])
    expect(importedTwice.criticalFacts).toHaveLength(1)
    expect(importedTwice.criticalFacts[0]).toMatchObject({ fact: 'Diversificar la cartera', impact: 'HIGH', decisionRequired: true, confidence: 0.82 })
  })

  it('impide aprobar secciones esenciales vacías y normaliza el guardado', () => {
    const draft = createEmptyPlanning('org-1', 'plan-1')
    draft.sectionStatuses.PREPARATION = 'APPROVED'
    expect(validateStrategicPlanning(draft).preparation).toContain('mandato')

    draft.sectionStatuses.PREPARATION = 'DRAFT'
    draft.swot.strengths = [' Ventaja ', 'ventaja']
    const saved = buildStrategicPlanning(draft)
    expect(saved.swot.strengths).toEqual(['Ventaja'])
  })
})
