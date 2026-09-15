import type {
  ControlWorkspace,
  ControlWorkspaceInput,
  FinancialInputs,
  FinancialOutputs,
  Initiative,
  KPI,
  KPIStatus,
  ObjectiveRelationship,
  ScenarioKind,
  SimulationRun,
  StrategicObjective,
} from '../types/models'

export function createEmptyControlWorkspace(organizationId: string, planId: string): ControlWorkspaceInput {
  return {
    organizationId,
    planId,
    objectives: [],
    relationships: [],
    kpis: [],
    initiatives: [],
    scheduleApproved: false,
    simulations: [],
  }
}

export function buildControlWorkspace(input: ControlWorkspaceInput, existing?: ControlWorkspace): ControlWorkspace {
  validateControlWorkspace(input)
  const now = new Date().toISOString()
  return {
    ...structuredClone(input),
    id: existing?.id ?? createControlId('control'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function toControlWorkspaceInput(workspace: ControlWorkspace): ControlWorkspaceInput {
  return {
    organizationId: workspace.organizationId,
    planId: workspace.planId,
    objectives: structuredClone(workspace.objectives),
    relationships: structuredClone(workspace.relationships),
    kpis: structuredClone(workspace.kpis),
    initiatives: structuredClone(workspace.initiatives),
    scheduleApproved: workspace.scheduleApproved,
    simulations: structuredClone(workspace.simulations),
  }
}

export function validateControlWorkspace(input: ControlWorkspaceInput) {
  if (!input.organizationId || !input.planId) throw new Error('Selecciona una organización y un plan.')
  const objectiveIds = new Set(input.objectives.map((objective) => objective.id))
  const kpiIds = new Set(input.kpis.map((kpi) => kpi.id))
  const initiativeIds = new Set(input.initiatives.map((initiative) => initiative.id))

  for (const objective of input.objectives) {
    if (!objective.name.trim()) throw new Error('Todos los objetivos deben tener un nombre.')
  }
  for (const kpi of input.kpis) {
    if (!kpi.name.trim() || !objectiveIds.has(kpi.objectiveId)) throw new Error('Cada KPI debe tener nombre y un objetivo válido.')
  }
  for (const relationship of input.relationships) {
    if (relationship.sourceObjectiveId === relationship.targetObjectiveId) throw new Error('Una relación no puede conectar un objetivo consigo mismo.')
    if (!objectiveIds.has(relationship.sourceObjectiveId) || !objectiveIds.has(relationship.targetObjectiveId)) throw new Error('La relación contiene objetivos no disponibles.')
  }
  for (const initiative of input.initiatives) {
    if (!initiative.name.trim() || !objectiveIds.has(initiative.objectiveId)) throw new Error('Cada iniciativa debe tener nombre y un objetivo válido.')
    if (initiative.kpiId && !kpiIds.has(initiative.kpiId)) throw new Error('La iniciativa contiene un KPI no disponible.')
    if (initiative.endDate < initiative.startDate) throw new Error(`La fecha final de ${initiative.name} no puede preceder a la inicial.`)
    if (initiative.progress < 0 || initiative.progress > 100) throw new Error('El avance debe estar entre 0 y 100.')
    if (initiative.dependencies.some((id) => id === initiative.id || !initiativeIds.has(id))) throw new Error('La iniciativa contiene una dependencia inválida.')
  }
}

export function createStrategicObjective(): StrategicObjective {
  return { id: createControlId('objective'), name: '', description: '', perspective: 'FINANCIAL', owner: '', priority: 'MEDIUM' }
}

export function createKPI(objectiveId = ''): KPI {
  return {
    id: createControlId('kpi'), objectiveId, name: '', description: '', purpose: '', formula: '', unit: '',
    direction: 'HIGHER_IS_BETTER', source: '', frequency: 'Mensual', baseline: null, target: null,
    trajectory: null, actual: null, forecast: null, responsible: '', deviationAction: '', dataQuality: 'MISSING', risk: '',
  }
}

export function createObjectiveRelationship(): ObjectiveRelationship {
  return { id: createControlId('relationship'), sourceObjectiveId: '', targetObjectiveId: '', description: '', confidence: 0.7, approved: false }
}

export function createInitiative(objectiveId = ''): Initiative {
  const currentYear = new Date().getFullYear()
  return {
    id: createControlId('initiative'), name: '', description: '', objectiveId, kpiId: null, owner: '',
    startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, budget: 0, expectedBenefit: 0,
    risk: '', status: 'PLANNED', progress: 0, dependencies: [],
  }
}

export function computeKPIStatus(kpi: KPI): KPIStatus {
  if (kpi.actual === null || kpi.target === null || kpi.dataQuality === 'MISSING') return 'GRAY'
  if (kpi.direction === 'HIGHER_IS_BETTER') {
    if (kpi.actual >= kpi.target) return 'GREEN'
    return kpi.actual >= kpi.target * 0.9 ? 'AMBER' : 'RED'
  }
  if (kpi.direction === 'LOWER_IS_BETTER') {
    if (kpi.actual <= kpi.target) return 'GREEN'
    return kpi.actual <= kpi.target * 1.1 ? 'AMBER' : 'RED'
  }
  const denominator = Math.abs(kpi.target) || 1
  const variance = Math.abs(kpi.actual - kpi.target) / denominator
  if (variance <= 0.05) return 'GREEN'
  return variance <= 0.1 ? 'AMBER' : 'RED'
}

export function computeObjectiveStatus(objectiveId: string, kpis: KPI[]): KPIStatus {
  const statuses = kpis.filter((kpi) => kpi.objectiveId === objectiveId).map(computeKPIStatus)
  if (statuses.length === 0 || statuses.every((status) => status === 'GRAY')) return 'GRAY'
  if (statuses.includes('RED')) return 'RED'
  if (statuses.includes('AMBER')) return 'AMBER'
  return statuses.includes('GREEN') ? 'GREEN' : 'GRAY'
}

export function computeFinancialOutputs(inputs: FinancialInputs): FinancialOutputs {
  const nopat = inputs.ebit * (1 - inputs.taxRate / 100)
  const roic = inputs.investedCapital === 0 ? 0 : (nopat / inputs.investedCapital) * 100
  const eva = nopat - (inputs.wacc / 100) * inputs.investedCapital
  return { nopat: round(nopat), roic: round(roic), eva: round(eva) }
}

export function createSimulationRun(period: string, scenario: ScenarioKind, inputs: FinancialInputs): SimulationRun {
  return { id: createControlId('simulation'), period: period.trim(), scenario, inputs: structuredClone(inputs), outputs: computeFinancialOutputs(inputs), createdAt: new Date().toISOString() }
}

export function getScenarioInputs(scenario: ScenarioKind, base: FinancialInputs): FinancialInputs {
  if (scenario === 'BASE' || scenario === 'CUSTOM') return structuredClone(base)
  const factor = scenario === 'PROTECTION' ? 0.92 : 1.15
  const efficiency = scenario === 'PROTECTION' ? 0.95 : 1.08
  return {
    ...base,
    sales: round(base.sales * factor),
    ebit: round(base.ebit * factor * efficiency),
    investedCapital: round(base.investedCapital * (scenario === 'PROTECTION' ? 0.97 : 1.12)),
    otif: clamp(round(base.otif * efficiency), 0, 100),
    wape: clamp(round(base.wape * (scenario === 'PROTECTION' ? 1.08 : 0.9)), 0, 100),
    oee: clamp(round(base.oee * efficiency), 0, 100),
  }
}

export function defaultFinancialInputs(): FinancialInputs {
  return { sales: 1000000, ebit: 120000, taxRate: 29.5, wacc: 12, investedCapital: 800000, otif: 90, wape: 15, oee: 75 }
}

export function isInitiativeDelayed(initiative: Initiative, today = new Date()) {
  if (initiative.status === 'COMPLETED' || initiative.status === 'CANCELLED') return false
  const end = new Date(`${initiative.endDate}T23:59:59`)
  return Number.isFinite(end.getTime()) && end < today
}

export function deleteObjectiveFromWorkspace(input: ControlWorkspaceInput, objectiveId: string): ControlWorkspaceInput {
  const removedKpiIds = new Set(input.kpis.filter((kpi) => kpi.objectiveId === objectiveId).map((kpi) => kpi.id))
  return {
    ...input,
    objectives: input.objectives.filter((objective) => objective.id !== objectiveId),
    relationships: input.relationships.filter((relationship) => relationship.sourceObjectiveId !== objectiveId && relationship.targetObjectiveId !== objectiveId),
    kpis: input.kpis.filter((kpi) => kpi.objectiveId !== objectiveId),
    initiatives: input.initiatives.filter((initiative) => initiative.objectiveId !== objectiveId).map((initiative) => ({ ...initiative, kpiId: initiative.kpiId && removedKpiIds.has(initiative.kpiId) ? null : initiative.kpiId })),
  }
}

export function deleteKPIFromWorkspace(input: ControlWorkspaceInput, kpiId: string): ControlWorkspaceInput {
  return { ...input, kpis: input.kpis.filter((kpi) => kpi.id !== kpiId), initiatives: input.initiatives.map((initiative) => initiative.kpiId === kpiId ? { ...initiative, kpiId: null } : initiative) }
}

export function createControlId(prefix: string) {
  const uniqueValue = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${uniqueValue}`
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
