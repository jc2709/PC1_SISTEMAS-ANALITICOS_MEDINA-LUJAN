import { useCallback, useEffect, useRef, useState } from 'react'
import type { NavigationItem } from '../App'
import { createStorageProvider } from '../storage/createStorageProvider'
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider'
import type { StorageMode, StorageProvider } from '../storage/StorageProvider'
import type { AppPreferences } from '../types/models'

// La URL es pública y no contiene secretos. Permite que las entregas file://
// (HTML y EXE portable) encuentren el backend seguro desde el primer inicio.
const PORTABLE_BACKEND_URL = 'https://pc1-medina-lujan.vercel.app'

const DEFAULT_PREFERENCES: AppPreferences = {
  schemaVersion: 2,
  compactSidebar: false,
  lastSection: 'Inicio',
  aiApiBaseUrl: getDefaultAIBaseUrl(),
}

interface PreferencesState {
  isLoading: boolean
  mode: StorageMode
  preferences: AppPreferences
  warning: string | null
}

export function useAppPreferences() {
  const providerRef = useRef<StorageProvider | null>(null)
  const [state, setState] = useState<PreferencesState>({
    isLoading: true,
    mode: typeof indexedDB === 'undefined' ? 'memory' : 'indexed-db',
    preferences: DEFAULT_PREFERENCES,
    warning: null,
  })

  useEffect(() => {
    let isActive = true

    async function loadPreferences() {
      try {
        const provider = createStorageProvider()
        providerRef.current = provider
        await provider.initialize()
        const stored = await provider.getAppPreferences()
        if (!isActive) return
        setState({ isLoading: false, mode: provider.mode, preferences: normalizePreferences(stored), warning: null })
      } catch {
        const fallback = new InMemoryStorageProvider()
        await fallback.initialize()
        providerRef.current = fallback
        if (!isActive) return
        setState({ isLoading: false, mode: fallback.mode, preferences: DEFAULT_PREFERENCES, warning: 'El almacenamiento persistente no está disponible. Los cambios durarán hasta cerrar la aplicación.' })
      }
    }

    void loadPreferences()
    return () => { isActive = false }
  }, [])

  const updatePreferences = useCallback(async (updates: Partial<Pick<AppPreferences, 'aiApiBaseUrl' | 'compactSidebar' | 'lastSection'>>) => {
    const nextPreferences = { ...state.preferences, ...updates, schemaVersion: 2 as const }
    setState((current) => ({ ...current, preferences: nextPreferences }))

    try {
      await providerRef.current?.saveAppPreferences(nextPreferences)
    } catch {
      setState((current) => ({ ...current, warning: 'No se pudo guardar la preferencia. La aplicación continúa funcionando.' }))
    }
  }, [state.preferences])

  const setCompactSidebar = useCallback((compactSidebar: boolean) => updatePreferences({ compactSidebar }), [updatePreferences])
  const setLastSection = useCallback((lastSection: NavigationItem) => updatePreferences({ lastSection }), [updatePreferences])
  const setAiApiBaseUrl = useCallback((aiApiBaseUrl: string) => updatePreferences({ aiApiBaseUrl: aiApiBaseUrl.trim() }), [updatePreferences])

  return { ...state, setAiApiBaseUrl, setCompactSidebar, setLastSection }
}

function normalizePreferences(stored: AppPreferences | null): AppPreferences {
  if (!stored) return DEFAULT_PREFERENCES
  return {
    schemaVersion: 2,
    compactSidebar: Boolean(stored.compactSidebar),
    lastSection: stored.lastSection || 'Inicio',
    aiApiBaseUrl: typeof stored.aiApiBaseUrl === 'string' && stored.aiApiBaseUrl.trim() ? stored.aiApiBaseUrl : getDefaultAIBaseUrl(),
  }
}

function getDefaultAIBaseUrl() {
  const configuredUrl = import.meta.env.VITE_AI_API_BASE_URL?.trim()
  if (configuredUrl) return configuredUrl
  if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol) && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return window.location.origin
  }
  return PORTABLE_BACKEND_URL
}
