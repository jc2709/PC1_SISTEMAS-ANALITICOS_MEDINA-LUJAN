import type {
  AIInteraction,
  StrategicFact,
  StrategicPlanning,
  StrategicPlanningInput,
} from '../types/models'
import type { ValidationErrors } from './workspaceService'

export function createEmptyPlanning(
  organizationId: StrategicPlanning['organizationId'],
  planId: StrategicPlanning['planId'],
): StrategicPlanningInput {
  return {
    organizationId,
    planId,
    mandate: '',
    strategicChallenge: '',
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    criticalFacts: [],
    mission: {
      priorityCustomer: '',
      criticalNeed: '',
      offer: '',
      verifiableOutcome: '',
      differentiation: '',
      capabilities: '',
      principles: '',
      statement: '',
    },
    vision: { statement: '', horizon: '' },
    strategy: {
      whereToCompete: '',
      howToWin: '',
      requiredCapabilities: [],
      managementSystem: '',
      strategicTradeoffs: [],
    },
    sectionStatuses: {
      PREPARATION: 'DRAFT',
      DIAGNOSIS: 'DRAFT',
      IDENTITY: 'DRAFT',
      STRATEGY: 'DRAFT',
    },
  }
}

export function validateStrategicPlanning(input: StrategicPlanningInput): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!input.organizationId) errors.organizationId = 'La organización es obligatoria.'
  if (!input.planId) errors.planId = 'El plan es obligatorio.'
  if (input.mandate.length > 2000) errors.mandate = 'El mandato no puede superar 2000 caracteres.'
  if (input.strategicChallenge.length > 1200) errors.strategicChallenge = 'El reto no puede superar 1200 caracteres.'
  if (input.mission.statement.length > 1200) errors.missionStatement = 'La misión no puede superar 1200 caracteres.'
  if (input.vision.statement.length > 1200) errors.visionStatement = 'La visión no puede superar 1200 caracteres.'

  if (input.sectionStatuses.PREPARATION === 'APPROVED' && (!input.mandate.trim() || !input.strategicChallenge.trim())) {
    errors.preparation = 'Completa el mandato y el reto antes de aprobar Preparación.'
  }
  const diagnosisItems = Object.values(input.swot).reduce((total, values) => total + values.length, 0) + input.criticalFacts.length
  if (input.sectionStatuses.DIAGNOSIS === 'APPROVED' && diagnosisItems === 0) {
    errors.diagnosis = 'Registra al menos un elemento FODA o hecho crítico antes de aprobar Diagnóstico.'
  }
  if (input.sectionStatuses.IDENTITY === 'APPROVED' && (!input.mission.statement.trim() || !input.vision.statement.trim())) {
    errors.identity = 'Completa la misión y la visión antes de aprobar Identidad.'
  }
  if (input.sectionStatuses.STRATEGY === 'APPROVED' && (!input.strategy.whereToCompete.trim() || !input.strategy.howToWin.trim())) {
    errors.strategy = 'Completa dónde competir y cómo ganar antes de aprobar Estrategia.'
  }

  input.criticalFacts.forEach((item, index) => {
    if (!item.fact.trim()) errors[`criticalFact.${index}`] = 'Cada hecho crítico debe tener una descripción.'
    if (item.confidence < 0 || item.confidence > 1) errors[`confidence.${index}`] = 'La confianza debe estar entre 0 y 1.'
  })
  return errors
}

export function buildStrategicPlanning(
  input: StrategicPlanningInput,
  existing?: StrategicPlanning,
): StrategicPlanning {
  const now = new Date().toISOString()
  return {
    ...input,
    id: existing?.id ?? createId('planning'),
    mandate: input.mandate.trim(),
    strategicChallenge: input.strategicChallenge.trim(),
    swot: {
      strengths: normalizeList(input.swot.strengths),
      weaknesses: normalizeList(input.swot.weaknesses),
      opportunities: normalizeList(input.swot.opportunities),
      threats: normalizeList(input.swot.threats),
    },
    criticalFacts: input.criticalFacts
      .filter((item) => item.fact.trim())
      .map((item) => normalizeFact(item)),
    mission: {
      priorityCustomer: input.mission.priorityCustomer.trim(),
      criticalNeed: input.mission.criticalNeed.trim(),
      offer: input.mission.offer.trim(),
      verifiableOutcome: input.mission.verifiableOutcome.trim(),
      differentiation: input.mission.differentiation.trim(),
      capabilities: input.mission.capabilities.trim(),
      principles: input.mission.principles.trim(),
      statement: input.mission.statement.trim(),
    },
    vision: {
      statement: input.vision.statement.trim(),
      horizon: input.vision.horizon.trim(),
    },
    strategy: {
      whereToCompete: input.strategy.whereToCompete.trim(),
      howToWin: input.strategy.howToWin.trim(),
      requiredCapabilities: normalizeList(input.strategy.requiredCapabilities),
      managementSystem: input.strategy.managementSystem.trim(),
      strategicTradeoffs: normalizeList(input.strategy.strategicTradeoffs),
    },
    sectionStatuses: { ...input.sectionStatuses },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function importApprovedAnalysis(
  input: StrategicPlanningInput,
  interaction: AIInteraction,
): StrategicPlanningInput {
  if (interaction.planId !== input.planId || interaction.organizationId !== input.organizationId) {
    throw new Error('El diagnóstico aprobado pertenece a otro plan.')
  }
  if (interaction.status !== 'APPROVED' || !interaction.finalContent) {
    throw new Error('Solo se puede incorporar un diagnóstico de IA aprobado.')
  }

  const content = interaction.finalContent
  const importedFacts = content.priorities.map<StrategicFact>((priority) => ({
    id: createId('fact'),
    fact: priority,
    evidence: '',
    impact: 'HIGH',
    explanation: content.executiveSummary,
    uncertainty: 'Validar con evidencia interna y fuentes externas antes de decidir.',
    decisionRequired: true,
    source: `Diagnóstico IA aprobado · ${interaction.model}`,
    confidence: content.confidence,
  }))

  return {
    ...input,
    swot: {
      ...input.swot,
      strengths: mergeUnique(input.swot.strengths, content.strengths),
      threats: mergeUnique(input.swot.threats, content.risks),
    },
    criticalFacts: mergeFacts(input.criticalFacts, importedFacts),
  }
}

export function createStrategicFact(): StrategicFact {
  return {
    id: createId('fact'),
    fact: '',
    evidence: '',
    impact: 'MEDIUM',
    explanation: '',
    uncertainty: '',
    decisionRequired: false,
    source: '',
    confidence: 0.5,
  }
}

function normalizeFact(fact: StrategicFact): StrategicFact {
  return {
    ...fact,
    fact: fact.fact.trim(),
    evidence: fact.evidence.trim(),
    explanation: fact.explanation.trim(),
    uncertainty: fact.uncertainty.trim(),
    source: fact.source.trim(),
    confidence: Math.max(0, Math.min(1, Number(fact.confidence.toFixed(2)))),
  }
}

function mergeFacts(current: StrategicFact[], incoming: StrategicFact[]) {
  const known = new Set(current.map((item) => item.fact.trim().toLocaleLowerCase('es')))
  return [...current, ...incoming.filter((item) => {
    const key = item.fact.trim().toLocaleLowerCase('es')
    if (!key || known.has(key)) return false
    known.add(key)
    return true
  })]
}

function mergeUnique(current: string[], incoming: string[]) {
  return normalizeList([...current, ...incoming])
}

function normalizeList(values: string[]) {
  const result: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const normalized = value.trim()
    const key = normalized.toLocaleLowerCase('es')
    if (!normalized || seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result
}

function createId(prefix: string) {
  const uniqueValue = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${uniqueValue}`
}
