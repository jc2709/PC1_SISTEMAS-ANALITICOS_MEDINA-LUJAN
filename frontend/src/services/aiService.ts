import type { AIInteraction, ControlWorkspace, ExecutiveNarrative, ExecutiveNarrativeContent, Organization, StrategicAnalysisContent, StrategicPlan } from '../types/models'

export type AIAvailability = 'NOT_CONFIGURED' | 'CHECKING' | 'CONNECTED' | 'OFFLINE' | 'PROCESSING' | 'ERROR'

export interface AIConnectionState {
  status: AIAvailability
  message: string
  model: string | null
}

export interface StrategicAnalysisRequest {
  organization: Organization
  plan: StrategicPlan
  focus: string
}

export interface StrategicAnalysisResult {
  analysis: StrategicAnalysisContent
  model: string
}

export interface ExecutiveNarrativeRequest {
  organization: Organization
  plan: StrategicPlan
  workspace: ControlWorkspace
  focus: string
}

export interface ExecutiveNarrativeResult {
  narrative: ExecutiveNarrativeContent
  model: string
}

const REQUEST_TIMEOUT_MS = 45_000

export async function checkAIConnection(apiBaseUrl: string, signal?: AbortSignal): Promise<AIConnectionState> {
  if (!apiBaseUrl.trim()) {
    return { status: 'NOT_CONFIGURED', message: 'Configura la URL pública del backend para habilitar Gemini.', model: null }
  }

  try {
    const response = await fetch(buildEndpoint(apiBaseUrl), { headers: { Accept: 'application/json' }, signal })
    const payload = await readJson(response)
    if (!response.ok) throw new Error(readError(payload, 'No se pudo consultar el backend de IA.'))
    const model = typeof payload.model === 'string' ? payload.model : null
    if (payload.status === 'ready') return { status: 'CONNECTED', message: 'Backend seguro disponible.', model }
    return { status: 'NOT_CONFIGURED', message: 'El backend está activo, pero Gemini todavía no tiene una clave configurada.', model }
  } catch (error) {
    if (isAbortError(error)) throw error
    return { status: 'OFFLINE', message: 'IA no disponible temporalmente. Las funciones locales continúan operativas.', model: null }
  }
}

export async function requestStrategicAnalysis(apiBaseUrl: string, input: StrategicAnalysisRequest): Promise<StrategicAnalysisResult> {
  if (!apiBaseUrl.trim()) throw new Error('Configura primero la URL del backend de IA.')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(buildEndpoint(apiBaseUrl), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization: input.organization, plan: input.plan, focus: input.focus.trim() }),
      signal: controller.signal,
    })
    const payload = await readJson(response)
    if (!response.ok) throw new Error(readError(payload, 'Gemini no pudo completar el análisis.'))
    return validateStrategicAnalysisResult(payload)
  } catch (error) {
    if (isAbortError(error)) throw new Error('La solicitud superó el tiempo máximo. Inténtalo nuevamente.')
    throw error instanceof Error ? error : new Error('IA no disponible temporalmente.')
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function requestExecutiveNarrative(apiBaseUrl: string, input: ExecutiveNarrativeRequest): Promise<ExecutiveNarrativeResult> {
  if (!apiBaseUrl.trim()) throw new Error('Configura primero la URL del backend de IA.')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(buildNarrativeEndpoint(apiBaseUrl), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(buildExecutiveNarrativePayload(input)),
      signal: controller.signal,
    })
    const payload = await readJson(response)
    if (!response.ok) throw new Error(readError(payload, 'Gemini no pudo explicar el dashboard.'))
    return validateExecutiveNarrativeResult(payload)
  } catch (error) {
    if (isAbortError(error)) throw new Error('La solicitud superó el tiempo máximo. Inténtalo nuevamente.')
    throw error instanceof Error ? error : new Error('IA no disponible temporalmente.')
  } finally {
    window.clearTimeout(timeout)
  }
}

export function createExecutiveNarrative(input: ExecutiveNarrativeRequest, result: ExecutiveNarrativeResult): ExecutiveNarrative {
  const timestamp = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    prompt: JSON.stringify({ focus: input.focus.trim(), organization: input.organization.name, plan: input.plan.name }),
    response: JSON.stringify(result.narrative),
    model: result.model,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'AI_PROPOSED',
    approvedByUser: false,
    userEdited: false,
    finalContent: result.narrative,
  }
}

export function updateExecutiveNarrative(narrative: ExecutiveNarrative, decision: 'APPROVED' | 'REJECTED' | 'USER_EDITED', content?: ExecutiveNarrativeContent): ExecutiveNarrative {
  const finalContent = content ?? narrative.finalContent
  return {
    ...narrative,
    finalContent,
    status: decision,
    approvedByUser: decision === 'APPROVED',
    userEdited: narrative.userEdited || decision === 'USER_EDITED',
    updatedAt: new Date().toISOString(),
  }
}

export function createAIInteraction(input: StrategicAnalysisRequest, result: StrategicAnalysisResult): AIInteraction {
  const timestamp = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    organizationId: input.organization.id,
    planId: input.plan.id,
    module: 'STRATEGIC_ANALYSIS',
    action: 'GENERATE_ANALYSIS',
    prompt: JSON.stringify({ focus: input.focus.trim(), organization: input.organization.name, plan: input.plan.name }),
    response: JSON.stringify(result.analysis),
    model: result.model,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'AI_PROPOSED',
    approvedByUser: false,
    userEdited: false,
    finalContent: result.analysis,
  }
}

export function updateAIInteraction(
  interaction: AIInteraction,
  decision: 'APPROVED' | 'REJECTED' | 'USER_EDITED',
  content?: StrategicAnalysisContent,
): AIInteraction {
  const finalContent = content ?? interaction.finalContent
  if (!finalContent) throw new Error('La interacción no contiene una propuesta editable.')
  return {
    ...interaction,
    status: decision,
    approvedByUser: decision === 'APPROVED',
    userEdited: interaction.userEdited || decision === 'USER_EDITED',
    finalContent,
    updatedAt: new Date().toISOString(),
  }
}

function buildEndpoint(apiBaseUrl: string) {
  return `${apiBaseUrl.trim().replace(/\/+$/, '')}/api/ai/strategic-analysis`
}

function buildNarrativeEndpoint(apiBaseUrl: string) {
  return `${apiBaseUrl.trim().replace(/\/+$/, '')}/api/ai/explain-dashboard`
}

function buildExecutiveNarrativePayload(input: ExecutiveNarrativeRequest) {
  const latestSimulation = [...input.workspace.simulations].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
  return {
    organization: { id: input.organization.id, name: input.organization.name, sector: input.organization.sector },
    plan: { id: input.plan.id, organizationId: input.plan.organizationId, name: input.plan.name, startYear: input.plan.startYear, endYear: input.plan.endYear },
    focus: input.focus.trim(),
    dashboard: {
      objectives: input.workspace.objectives.map((objective) => ({ id: objective.id, name: objective.name, perspective: objective.perspective })),
      kpis: input.workspace.kpis.map((kpi) => ({ name: kpi.name, unit: kpi.unit, actual: kpi.actual, target: kpi.target, trajectory: kpi.trajectory, forecast: kpi.forecast, dataQuality: kpi.dataQuality, deviationAction: kpi.deviationAction })),
      initiatives: input.workspace.initiatives.map((initiative) => ({ name: initiative.name, status: initiative.status, progress: initiative.progress, endDate: initiative.endDate, risk: initiative.risk })),
      latestSimulation: latestSimulation ? { period: latestSimulation.period, scenario: latestSimulation.scenario, inputs: latestSimulation.inputs, outputs: latestSimulation.outputs } : null,
    },
  }
}

function validateExecutiveNarrativeResult(value: Record<string, unknown>): ExecutiveNarrativeResult {
  const narrative = value.narrative
  if (!isRecord(narrative)) throw new Error('El backend devolvió una narrativa inválida.')
  const confidence = typeof narrative.confidence === 'number' ? narrative.confidence : Number.NaN
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error('El nivel de confianza de la narrativa no es válido.')
  if (typeof value.model !== 'string' || !value.model.trim()) throw new Error('El backend no identificó el modelo utilizado.')
  return {
    narrative: {
      data: readRequiredString(narrative.data, 'dato'),
      inference: readRequiredString(narrative.inference, 'inferencia'),
      forecast: readRequiredString(narrative.forecast, 'pronóstico'),
      recommendation: readRequiredString(narrative.recommendation, 'recomendación'),
      confidence,
    },
    model: value.model,
  }
}

function validateStrategicAnalysisResult(value: Record<string, unknown>): StrategicAnalysisResult {
  const analysis = value.analysis
  if (!isRecord(analysis)) throw new Error('El backend devolvió una respuesta sin análisis válido.')
  const executiveSummary = readRequiredString(analysis.executiveSummary, 'resumen ejecutivo')
  const strengths = readStringArray(analysis.strengths, 'fortalezas')
  const risks = readStringArray(analysis.risks, 'riesgos')
  const priorities = readStringArray(analysis.priorities, 'prioridades')
  const confidence = typeof analysis.confidence === 'number' ? analysis.confidence : Number.NaN
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error('El nivel de confianza de la IA no es válido.')
  if (typeof value.model !== 'string' || !value.model.trim()) throw new Error('El backend no identificó el modelo utilizado.')
  return { analysis: { executiveSummary, strengths, risks, priorities, confidence }, model: value.model }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await response.json()
    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

function readError(value: Record<string, unknown>, fallback: string) {
  return typeof value.error === 'string' && value.error.trim() ? value.error : fallback
}

function readRequiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`La IA devolvió ${label} inválido.`)
  return value.trim()
}

function readStringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`La IA devolvió una lista de ${label} inválida.`)
  }
  return value.map((item) => (item as string).trim())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
