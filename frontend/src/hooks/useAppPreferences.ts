import { useCallback, useEffect, useRef, useState } from 'react'
import type { NavigationItem } from '../App'
import { createStorageProvider } from '../storage/createStorageProvider'
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider'
import type { StorageMode, StorageProvider } from '../storage/StorageProvider'
import type { AppPreferences } from '../types/models'

const DEFAULT_PREFERENCES: AppPreferences = {
  schemaVersion: 1,
  compactSidebar: false,
  lastSection: 'Inicio',
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
        setState({ isLoading: false, mode: provider.mode, preferences: stored ?? DEFAULT_PREFERENCES, warning: null })
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

  const updatePreferences = useCallback(async (updates: Partial<Pick<AppPreferences, 'compactSidebar' | 'lastSection'>>) => {
    const nextPreferences = { ...state.preferences, ...updates }
    setState((current) => ({ ...current, preferences: nextPreferences }))

    try {
      await providerRef.current?.saveAppPreferences(nextPreferences)
    } catch {
      setState((current) => ({ ...current, warning: 'No se pudo guardar la preferencia. La aplicación continúa funcionando.' }))
    }
  }, [state.preferences])

  const setCompactSidebar = useCallback((compactSidebar: boolean) => updatePreferences({ compactSidebar }), [updatePreferences])
  const setLastSection = useCallback((lastSection: NavigationItem) => updatePreferences({ lastSection }), [updatePreferences])

  return { ...state, setCompactSidebar, setLastSection }
}
