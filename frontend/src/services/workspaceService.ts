import type { Organization, OrganizationInput, StrategicPlan, StrategicPlanInput } from '../types/models'

export interface ValidationErrors {
  [field: string]: string
}

export function validateOrganization(input: OrganizationInput): ValidationErrors {
  const errors: ValidationErrors = {}
  if (input.name.trim().length < 2) errors.name = 'Ingresa un nombre de al menos 2 caracteres.'
  if (input.name.trim().length > 120) errors.name = 'El nombre no puede superar 120 caracteres.'
  if (!input.sector.trim()) errors.sector = 'Selecciona o escribe el sector.'
  if (input.description.trim().length > 1200) errors.description = 'La descripción no puede superar 1200 caracteres.'
  return errors
}

export function validatePlan(input: StrategicPlanInput): ValidationErrors {
  const errors: ValidationErrors = {}
  const currentYear = new Date().getFullYear()
  if (!input.organizationId) errors.organizationId = 'Selecciona una organización.'
  if (input.name.trim().length < 3) errors.name = 'Ingresa un nombre de al menos 3 caracteres.'
  if (input.startYear < currentYear - 20 || input.startYear > currentYear + 50) errors.startYear = 'El año inicial está fuera del rango permitido.'
  if (input.endYear < input.startYear) errors.endYear = 'El año final debe ser igual o posterior al inicial.'
  if (input.endYear > currentYear + 60) errors.endYear = 'El año final está fuera del rango permitido.'
  return errors
}

export function buildOrganization(input: OrganizationInput, existing?: Organization): Organization {
  const now = new Date().toISOString()
  return {
    ...input,
    id: existing?.id ?? createId('org'),
    name: input.name.trim(),
    sector: input.sector.trim(),
    description: input.description.trim(),
    currentMission: input.currentMission.trim(),
    currentVision: input.currentVision.trim(),
    financialInformation: input.financialInformation.trim(),
    operationalInformation: input.operationalInformation.trim(),
    productsOrServices: normalizeList(input.productsOrServices),
    customerSegments: normalizeList(input.customerSegments),
    markets: normalizeList(input.markets),
    competitors: normalizeList(input.competitors),
    principles: normalizeList(input.principles),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function buildPlan(input: StrategicPlanInput, existing?: StrategicPlan): StrategicPlan {
  const now = new Date().toISOString()
  return {
    ...input,
    id: existing?.id ?? createId('plan'),
    name: input.name.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function parseList(value: string) {
  return normalizeList(value.split(/[\n,]/))
}

export function formatList(values: string[]) {
  return values.join('\n')
}

function createId(prefix: string) {
  const uniqueValue = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${uniqueValue}`
}

function normalizeList(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}
