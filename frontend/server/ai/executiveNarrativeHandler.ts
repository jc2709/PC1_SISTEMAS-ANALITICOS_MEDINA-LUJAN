import { buildExecutiveNarrativePrompt, EXECUTIVE_NARRATIVE_SCHEMA, extractNarrativeGeminiText, parseExecutiveNarrative, parseExecutiveNarrativeInput } from './executiveNarrative.js'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite']
const MAX_REQUEST_BYTES = 50_000

export const config = { maxDuration: 60 }

export default {
  async fetch(request: Request) {
    const cors = getCors(request)
    if (!cors.allowed) return json({ error: 'Origen no autorizado.' }, 403, cors.headers)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors.headers })
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405, { ...cors.headers, Allow: 'POST, OPTIONS' })
    if (!process.env.GEMINI_API_KEY) return json({ error: 'Gemini no está configurado en el servidor.' }, 503, cors.headers)

    try {
      const rawBody = await request.text()
      if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) return json({ error: 'La solicitud supera el tamaño permitido.' }, 413, cors.headers)
      let payload: unknown
      try { payload = JSON.parse(rawBody) as unknown } catch { return json({ error: 'La solicitud contiene JSON inválido.' }, 400, cors.headers) }
      const input = parseExecutiveNarrativeInput(payload)
      const body = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildExecutiveNarrativePrompt(input) }] }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 2_048, responseMimeType: 'application/json', responseJsonSchema: EXECUTIVE_NARRATIVE_SCHEMA },
      })
      let activeModel = getModel()
      let response = await requestGemini(activeModel, body)
      for (const fallbackModel of FALLBACK_MODELS) {
        if (![404, 503].includes(response.status) || fallbackModel === activeModel) continue
        activeModel = fallbackModel
        response = await requestGemini(activeModel, body)
      }
      let geminiPayload: unknown
      try { geminiPayload = await response.json() as unknown } catch { return json({ error: 'Gemini devolvió una respuesta ilegible. Puedes reintentar.' }, 502, cors.headers) }
      if (!response.ok) return json({ error: mapGeminiError(response.status), upstreamStatus: response.status }, 502, cors.headers)
      let narrativePayload: unknown
      try { narrativePayload = JSON.parse(extractNarrativeGeminiText(geminiPayload)) as unknown } catch { return json({ error: 'Gemini devolvió JSON inválido. Puedes reintentar.' }, 502, cors.headers) }
      return json({ narrative: parseExecutiveNarrative(narrativePayload), model: activeModel, promptVersion: 'executive-narrative-v1' }, 200, cors.headers)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') return json({ error: 'Gemini superó el tiempo máximo de respuesta.' }, 504, cors.headers)
      const message = error instanceof Error ? error.message : 'No se pudo generar la narrativa.'
      const inputError = message.startsWith('El campo') || message.startsWith('La solicitud') || message.startsWith('El plan')
      return json({ error: inputError ? message : 'Gemini devolvió una respuesta inválida. Puedes reintentar.' }, inputError ? 400 : 502, cors.headers)
    }
  },
}

function requestGemini(model: string, body: string) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY ?? '' }, body, signal: AbortSignal.timeout(45_000) })
}

function getModel() {
  const candidate = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL
  return /^[a-zA-Z0-9._-]+$/.test(candidate) ? candidate : DEFAULT_MODEL
}

function getCors(request: Request) {
  const origin = request.headers.get('origin')
  const requestOrigin = new URL(request.url).origin
  const configuredOrigins = (process.env.AI_ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  const allowed = !origin || origin === requestOrigin || configuredOrigins.includes('*') || configuredOrigins.includes(origin) || (origin === 'null' && process.env.AI_ALLOW_LOCAL_APP === 'true')
  const allowedOrigin = configuredOrigins.includes('*') ? '*' : origin && allowed ? origin : null
  const headers: Record<string, string> = { 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8', Vary: 'Origin' }
  if (allowedOrigin) headers['Access-Control-Allow-Origin'] = allowedOrigin
  return { allowed, headers }
}

function json(value: unknown, status: number, headers: Record<string, string>) { return new Response(JSON.stringify(value), { status, headers }) }
function mapGeminiError(status: number) {
  if (status === 400) return 'Gemini rechazó la solicitud. Revisa el modelo configurado.'
  if (status === 401 || status === 403) return 'La clave de Gemini no es válida o no tiene permisos.'
  if (status === 404) return 'El modelo configurado no está disponible para esta clave de Gemini.'
  if (status === 429) return 'Gemini alcanzó temporalmente su límite de solicitudes.'
  return 'Gemini no está disponible temporalmente.'
}
