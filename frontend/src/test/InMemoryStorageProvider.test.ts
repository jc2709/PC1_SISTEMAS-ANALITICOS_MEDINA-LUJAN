import { describe, expect, it } from 'vitest'
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider'
import { buildStrategicPlanning, createEmptyPlanning } from '../services/planningService'
import { buildControlWorkspace, createEmptyControlWorkspace } from '../services/controlService'
import type { AIInteraction, AppPreferences, Organization, StrategicPlan } from '../types/models'

describe('InMemoryStorageProvider', () => {
  it('guarda y devuelve una copia de las preferencias', async () => {
    const provider = new InMemoryStorageProvider()
    const preferences: AppPreferences = { schemaVersion: 2, compactSidebar: true, lastSection: 'Configuración', aiApiBaseUrl: '' }

    await provider.initialize()
    expect(await provider.getAppPreferences()).toBeNull()

    await provider.saveAppPreferences(preferences)
    const stored = await provider.getAppPreferences()

    expect(stored).toEqual(preferences)
    expect(stored).not.toBe(preferences)
  })

  it('administra organizaciones y elimina en cascada sus planes', async () => {
    const provider = new InMemoryStorageProvider()
    const organization: Organization = {
      id: 'org-1',
      name: 'AndesPack S.A.C.',
      sector: 'Industria',
      description: 'Empresa industrial B2B peruana.',
      productsOrServices: ['Empaques'],
      customerSegments: ['Empresas exportadoras'],
      markets: ['Perú'],
      competitors: [],
      currentMission: '',
      currentVision: '',
      principles: ['Calidad'],
      financialInformation: '',
      operationalInformation: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const plan: StrategicPlan = {
      id: 'plan-1',
      organizationId: organization.id,
      name: 'Plan Estratégico 2027–2029',
      startYear: 2027,
      endYear: 2029,
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const interaction: AIInteraction = {
      id: 'ai-1', organizationId: organization.id, planId: plan.id, module: 'STRATEGIC_ANALYSIS', action: 'GENERATE_ANALYSIS',
      prompt: '{}', response: '{}', model: 'gemini-2.5-flash', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      status: 'AI_PROPOSED', approvedByUser: false, userEdited: false,
      finalContent: { executiveSummary: 'Resumen', strengths: ['Oferta'], risks: ['Concentración'], priorities: ['Diversificar'], confidence: 0.8 },
    }

    await provider.initialize()
    await provider.saveOrganization(organization)
    await provider.savePlan(plan)
    await provider.saveAIInteraction(interaction)
    const planning = buildStrategicPlanning(createEmptyPlanning(organization.id, plan.id))
    await provider.saveStrategicPlanning(planning)
    const controlWorkspace = buildControlWorkspace(createEmptyControlWorkspace(organization.id, plan.id))
    await provider.saveControlWorkspace(controlWorkspace)

    const storedOrganizations = await provider.getOrganizations()
    expect(storedOrganizations).toEqual([organization])
    expect(storedOrganizations[0]).not.toBe(organization)
    expect(await provider.getPlans()).toEqual([plan])
    expect(await provider.getAIInteractions()).toEqual([interaction])
    expect(await provider.getStrategicPlannings()).toEqual([planning])
    expect(await provider.getControlWorkspaces()).toEqual([controlWorkspace])

    await provider.deleteOrganization(organization.id)
    expect(await provider.getOrganizations()).toEqual([])
    expect(await provider.getPlans()).toEqual([])
    expect(await provider.getAIInteractions()).toEqual([])
    expect(await provider.getStrategicPlannings()).toEqual([])
    expect(await provider.getControlWorkspaces()).toEqual([])
  })
})
