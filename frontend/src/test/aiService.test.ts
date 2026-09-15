import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkAIConnection, createAIInteraction, requestStrategicAnalysis, updateAIInteraction } from '../services/aiService'
import type { Organization, StrategicPlan } from '../types/models'

const organization: Organization = {
  id: 'org-1', name: 'AndesPack S.A.C.', sector: 'Industria', description: '', productsOrServices: [],
  customerSegments: [], markets: [], competitors: [], currentMission: '', currentVision: '', principles: [],
  financialInformation: '', operationalInformation: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}
const plan: StrategicPlan = {
  id: 'plan-1', organizationId: organization.id, name: 'Plan 2027', startYear: 2027, endYear: 2029,
  status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}
const analysis = { executiveSummary: 'Resumen verificable.', strengths: ['Oferta'], risks: ['Concentración'], priorities: ['Diversificar'], confidence: 0.8 }

afterEach(() => vi.unstubAllGlobals())

describe('aiService', () => {
  it('no hace solicitudes cuando el backend no está configurado', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await checkAIConnection('')).toMatchObject({ status: 'NOT_CONFIGURED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('valida una respuesta estructurada antes de aceptarla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ analysis, model: 'gemini-2.5-flash' }), { status: 200 })))
    await expect(requestStrategicAnalysis('https://example.vercel.app', { organization, plan, focus: '' })).resolves.toEqual({ analysis, model: 'gemini-2.5-flash' })
  })

  it('registra la propuesta y las decisiones humanas', () => {
    const interaction = createAIInteraction({ organization, plan, focus: 'crecimiento' }, { analysis, model: 'gemini-2.5-flash' })
    const edited = updateAIInteraction(interaction, 'USER_EDITED', { ...analysis, executiveSummary: 'Resumen revisado.' })
    const approved = updateAIInteraction(edited, 'APPROVED')
    expect(edited).toMatchObject({ status: 'USER_EDITED', userEdited: true, approvedByUser: false })
    expect(approved).toMatchObject({ status: 'APPROVED', userEdited: true, approvedByUser: true })
  })
})
