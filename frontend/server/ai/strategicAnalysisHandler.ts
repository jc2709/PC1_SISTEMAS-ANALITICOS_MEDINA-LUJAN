import { buildStrategicAnalysisPrompt, extractGeminiText, parseGeminiAnalysis, parseStrategicAnalysisInput, STRATEGIC_ANALYSIS_SCHEMA } from './strategicAnalysis.js'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash-lite']
const MAX_REQUEST_BYTES = 30_000

export const config = { maxDuration: 60 }

export default {
  async fetch(request: Request) {
    const cors = getCors(request)
    if (!cors.allowed) return json({ error: 'Origen no autorizado.' }, 403, cors.headers)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors.headers })

    const model = getModel()
    if (request.method === 'GET') {
      return json({ status: process.env.GEMINI_API_KEY ? 'ready' : 'not_configured', provider: 'gemini', model }, 200, cors.headers)
    }
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405, { ...cors.headers, Allow: 'GET, POST, OPTIONS' })
    if (!process.env.GEMINI_API_KEY) return json({ error: 'Gemini no está configurado en el servidor.' }, 503, cors.headers)

    try {
      const contentLength = Number(request.headers.get('content-length') ?? '0')
      if (contentLength > MAX_REQUEST_BYTES) return json({ error: 'La solicitud supera el tamaño permitido.' }, 413, cors.headers)
      const rawBody = await request.text()
      if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) return json({ error: 'La solicitud supera el tamaño permitido.' }, 413, cors.headers)
      let requestPayload: unknown
      try {
        requestPayload = JSON.parse(rawBody) as unknown
      } catch {
        return json({ error: 'La solicitud contiene JSON inválido.' }, 400, cors.headers)
      }
      const input = parseStrategicAnalysisInput(requestPayload)
      const prompt = buildStrategicAnalysisPrompt(input)
      const geminiBody = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2_048,
          responseMimeType: 'application/json',
          responseJsonSchema: STRATEGIC_ANALYSIS_SCHEMA,
        },
      })
      let activeModel = model
      let geminiResponse = await requestGemini(activeModel, geminiBody)
      for (const fallbackModel of FALLBACK_MODELS) {
        if (![404, 503].includes(geminiResponse.status) || fallbackModel === activeModel) continue
        activeModel = fallbackModel
        geminiResponse = await requestGemini(activeModel, geminiBody)
      }
      let geminiPayload: unknown
      try {
        geminiPayload = await geminiResponse.json() as unknown
      } catch {
        return json({ error: 'Gemini devolvió una respuesta ilegible. Puedes reintentar.' }, 502, cors.headers)
      }
      if (!geminiResponse.ok) {
        return json({ error: mapGeminiError(geminiResponse.status), upstreamStatus: geminiResponse.status }, 502, cors.headers)
      }
      let analysisPayload: unknown
      try {
        analysisPayload = JSON.parse(extractGeminiText(geminiPayload)) as unknown
      } catch {
        return json({ error: 'Gemini devolvió JSON inválido. Puedes reintentar.' }, 502, cors.headers)
      }
      const analysis = parseGeminiAnalysis(analysisPayload)
      return json({ analysis, model: activeModel, promptVersion: 'strategic-analysis-v1' }, 200, cors.headers)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') return json({ error: 'Gemini superó el tiempo máximo de respuesta.' }, 504, cors.headers)
      const message = error instanceof Error ? error.message : 'No se pudo completar el análisis.'
      const isInputError = message.startsWith('El campo') || message.startsWith('La solicitud') || message.startsWith('El plan')
      return json({ error: isInputError ? message : 'Gemini devolvió una respuesta inválida. Puedes reintentar.' }, isInputError ? 400 : 502, cors.headers)
    }
  },
}

function requestGemini(model: string, body: string) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY ?? '' },
    body,
    signal: AbortSignal.timeout(45_000),
  })
}

function getModel() {
  const candidate = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL
  return /^[a-zA-Z0-9._-]+$/.test(candidate) ? candidate : DEFAULT_MODEL
}

function getCors(request: Request) {
  const origin = request.headers.get('origin')
  const requestOrigin = new URL(request.url).origin
  const configuredOrigins = (process.env.AI_ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  const allowLocalApp = process.env.AI_ALLOW_LOCAL_APP === 'true'
  const allowed = !origin || origin === requestOrigin || configuredOrigins.includes('*') || configuredOrigins.includes(origin) || (origin === 'null' && allowLocalApp)
  const allowedOrigin = configuredOrigins.includes('*') ? '*' : origin && allowed ? origin : null
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  }
  if (allowedOrigin) headers['Access-Control-Allow-Origin'] = allowedOrigin
  return { allowed, headers }
}

function json(value: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(value), { status, headers })
}

function mapGeminiError(status: number) {
  if (status === 400) return 'Gemini rechazó la solicitud. Revisa el modelo configurado.'
  if (status === 401 || status === 403) return 'La clave de Gemini no es válida o no tiene permisos.'
  if (status === 404) return 'El modelo configurado no está disponible para esta clave de Gemini.'
  if (status === 429) return 'Gemini alcanzó temporalmente su límite de solicitudes.'
  return 'Gemini no está disponible temporalmente.'
}
