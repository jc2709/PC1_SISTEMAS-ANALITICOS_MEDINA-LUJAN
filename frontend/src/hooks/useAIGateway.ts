import { useCallback, useEffect, useState } from 'react'
import { checkAIConnection, requestExecutiveNarrative, requestStrategicAnalysis, type AIConnectionState, type ExecutiveNarrativeRequest, type StrategicAnalysisRequest } from '../services/aiService'

const INITIAL_STATE: AIConnectionState = {
  status: 'NOT_CONFIGURED',
  message: 'Configura la URL pública del backend para habilitar Gemini.',
  model: null,
}

export function useAIGateway(apiBaseUrl: string) {
  const [connection, setConnection] = useState<AIConnectionState>(INITIAL_STATE)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setConnection((current) => ({ ...current, status: apiBaseUrl.trim() ? 'CHECKING' : 'NOT_CONFIGURED' }))
    const next = await checkAIConnection(apiBaseUrl, signal)
    setConnection(next)
    return next
  }, [apiBaseUrl])

  useEffect(() => {
    const controller = new AbortController()
    void checkAIConnection(apiBaseUrl, controller.signal).then(setConnection).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setConnection(INITIAL_STATE)
    })
    return () => controller.abort()
  }, [apiBaseUrl])

  const analyze = useCallback(async (input: StrategicAnalysisRequest) => {
    setConnection((current) => ({ ...current, status: 'PROCESSING', message: 'Gemini está preparando una propuesta estructurada.' }))
    try {
      const result = await requestStrategicAnalysis(apiBaseUrl, input)
      setConnection({ status: 'CONNECTED', message: 'Backend seguro disponible.', model: result.model })
      return result
    } catch (error) {
      setConnection((current) => ({ ...current, status: 'ERROR', message: error instanceof Error ? error.message : 'IA no disponible temporalmente.' }))
      throw error
    }
  }, [apiBaseUrl])

  const explainDashboard = useCallback(async (input: ExecutiveNarrativeRequest) => {
    setConnection((current) => ({ ...current, status: 'PROCESSING', message: 'Gemini está preparando la narrativa ejecutiva.' }))
    try {
      const result = await requestExecutiveNarrative(apiBaseUrl, input)
      setConnection({ status: 'CONNECTED', message: 'Backend seguro disponible.', model: result.model })
      return result
    } catch (error) {
      setConnection((current) => ({ ...current, status: 'ERROR', message: error instanceof Error ? error.message : 'IA no disponible temporalmente.' }))
      throw error
    }
  }, [apiBaseUrl])

  return { analyze, connection, explainDashboard, refresh }
}
