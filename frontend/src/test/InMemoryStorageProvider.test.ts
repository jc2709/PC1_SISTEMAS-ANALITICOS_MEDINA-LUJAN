import { describe, expect, it } from 'vitest'
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider'
import type { AppPreferences } from '../types/models'

describe('InMemoryStorageProvider', () => {
  it('guarda y devuelve una copia de las preferencias', async () => {
    const provider = new InMemoryStorageProvider()
    const preferences: AppPreferences = { schemaVersion: 1, compactSidebar: true, lastSection: 'Configuración' }

    await provider.initialize()
    expect(await provider.getAppPreferences()).toBeNull()

    await provider.saveAppPreferences(preferences)
    const stored = await provider.getAppPreferences()

    expect(stored).toEqual(preferences)
    expect(stored).not.toBe(preferences)
  })
})
