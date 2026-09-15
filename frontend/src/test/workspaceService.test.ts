import { describe, expect, it } from 'vitest'
import { parseList, validateOrganization, validatePlan } from '../services/workspaceService'
import type { OrganizationInput, StrategicPlanInput } from '../types/models'

const organizationInput: OrganizationInput = {
  name: 'AndesPack S.A.C.',
  sector: 'Industria',
  description: '',
  productsOrServices: [],
  customerSegments: [],
  markets: [],
  competitors: [],
  currentMission: '',
  currentVision: '',
  principles: [],
  financialInformation: '',
  operationalInformation: '',
}

describe('workspaceService', () => {
  it('valida los campos obligatorios de una organización', () => {
    expect(validateOrganization(organizationInput)).toEqual({})
    expect(validateOrganization({ ...organizationInput, name: '', sector: '' })).toEqual({
      name: 'Ingresa un nombre de al menos 2 caracteres.',
      sector: 'Selecciona o escribe el sector.',
    })
  })

  it('convierte listas separadas por comas o líneas', () => {
    expect(parseList('Empaques, Etiquetas\nConsultoría')).toEqual(['Empaques', 'Etiquetas', 'Consultoría'])
  })

  it('rechaza un plan cuyo año final precede al inicial', () => {
    const plan: StrategicPlanInput = { organizationId: 'org-1', name: 'Plan Estratégico', startYear: 2030, endYear: 2029, status: 'DRAFT' }
    expect(validatePlan(plan).endYear).toBe('El año final debe ser igual o posterior al inicial.')
  })
})
