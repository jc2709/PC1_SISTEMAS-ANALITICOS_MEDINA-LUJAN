import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../frontend/server/ai/strategicAnalysisHandler.js'

const KEY_ENV_NAME = 'GEMINI_API_KEY'

const validRequest = {
  organization: {
    id: 'org-1', name: 'AndesPack S.A.C.', sector: 'Industria', description: 'Empresa B2B',
    productsOrServices: ['Empaques'], customerSegments: ['Exportadores'], markets: ['Perú'], competitors: [],
    currentMission: '', currentVision: '', financialInformation: 'Ventas S/ 120 millones', operationalInformation: 'Producción local',
  },
  plan: { id: 'plan-1', organizationId: 'org-1', name: 'Plan 2027', startYear: 2027, endYear: 2029, status: 'ACTIVE' },
  focus: 'crecimiento rentable',
}

afterEach(() => {
  delete process.env[KEY_ENV_NAME]
  delete process.env.GEMINI_MODEL
  vi.unstubAllGlobals()
})

describe('strategic-analysis endpoint', () => {
  it('informa que el backend aún no tiene una clave sin exponer secretos', async () => {
    const response = await handler.fetch(new Request('https://example.vercel.app/api/ai/strategic-analysis'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'not_configured', provider: 'gemini', model: 'gemini-2.5-flash' })
  })

  it('valida la respuesta estructurada de Gemini', async () => {
    process.env[KEY_ENV_NAME] = 'unit-test-secret'
    process.env.GEMINI_MODEL = 'gemini-2.5-flash'
    const analysis = { executiveSummary: 'Existe una base operativa sólida.', strengths: ['Oferta B2B'], risks: ['Concentración'], priorities: ['Diversificar clientes'], confidence: 0.82 }
    const geminiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(analysis) }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', geminiFetch)

    const response = await handler.fetch(new Request('https://example.vercel.app/api/ai/strategic-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validRequest),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ analysis, model: 'gemini-2.5-flash', promptVersion: 'strategic-analysis-v1' })
    expect(JSON.stringify(payload)).not.toContain('unit-test-secret')
    expect(geminiFetch).toHaveBeenCalledOnce()
  })

  it('rechaza planes que no pertenecen a la organización', async () => {
    process.env[KEY_ENV_NAME] = 'unit-test-secret'
    const response = await handler.fetch(new Request('https://example.vercel.app/api/ai/strategic-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...validRequest, plan: { ...validRequest.plan, organizationId: 'org-2' } }),
    }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'El plan no pertenece a la organización indicada.' })
  })

  it('informa el estado seguro del proveedor sin exponer su respuesta ni la clave', async () => {
    process.env[KEY_ENV_NAME] = 'unit-test-secret'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":{"message":"provider detail"}}', { status: 404 })))

    const response = await handler.fetch(new Request('https://example.vercel.app/api/ai/strategic-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validRequest),
    }))
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toEqual({ error: 'El modelo configurado no está disponible para esta clave de Gemini.', upstreamStatus: 404 })
    expect(JSON.stringify(payload)).not.toContain('provider detail')
    expect(JSON.stringify(payload)).not.toContain('unit-test-secret')
  })
})
