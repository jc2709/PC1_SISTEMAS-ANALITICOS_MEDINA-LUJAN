import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../frontend/server/ai/executiveNarrativeHandler'

const KEY = 'GEMINI_API_KEY'
const requestBody = {
  organization: { id: 'org-1', name: 'Andes Demo', sector: 'Logística' },
  plan: { id: 'plan-1', organizationId: 'org-1', name: 'Plan 2027', startYear: 2027, endYear: 2029 },
  focus: 'Valor económico',
  dashboard: {
    objectives: [{ id: 'obj-1', name: 'Crear valor', perspective: 'FINANCIAL' }],
    kpis: [{ name: 'EVA', unit: 'S/', actual: -10, target: 20, trajectory: 0, forecast: 10, dataQuality: 'CERTIFIED', deviationAction: 'Mejorar margen' }],
    initiatives: [{ name: 'Programa', status: 'IN_PROGRESS', progress: 30, endDate: '2027-12-31', risk: 'Demora' }],
    latestSimulation: null,
  },
}

describe('executiveNarrativeHandler', () => {
  beforeEach(() => { delete process.env[KEY]; delete process.env.GEMINI_MODEL; delete process.env.AI_ALLOWED_ORIGINS })
  afterEach(() => { vi.unstubAllGlobals(); delete process.env[KEY] })

  it('exige configuración segura del servidor', async () => {
    const response = await handler.fetch(new Request('https://example.vercel.app/api/ai/explain-dashboard', { method: 'POST', body: JSON.stringify(requestBody) }))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Gemini no está configurado en el servidor.' })
  })

  it('valida la respuesta estructurada y no expone la clave', async () => {
    process.env[KEY] = 'secret-test'
    const narrative = { data: 'EVA real -10.', inference: 'Existe una brecha.', forecast: 'Podría mejorar a 10.', recommendation: 'Ejecutar el plan de margen.', confidence: 0.9 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(narrative) }] } }] }), { status: 200 })))
    const response = await handler.fetch(new Request('https://example.vercel.app/api/ai/explain-dashboard', { method: 'POST', body: JSON.stringify(requestBody) }))
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toEqual({ narrative, model: 'gemini-2.5-flash', promptVersion: 'executive-narrative-v1' })
    expect(JSON.stringify(payload)).not.toContain('secret-test')
  })

  it('rechaza un plan ajeno a la organización', async () => {
    process.env[KEY] = 'secret-test'
    const response = await handler.fetch(new Request('https://example.vercel.app/api/ai/explain-dashboard', { method: 'POST', body: JSON.stringify({ ...requestBody, plan: { ...requestBody.plan, organizationId: 'org-2' } }) }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'El plan no pertenece a la organización indicada.' })
  })
})
