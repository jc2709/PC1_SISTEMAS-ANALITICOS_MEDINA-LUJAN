import type { AppPreferences } from '../types/models'
import type { StorageProvider } from './StorageProvider'

export class InMemoryStorageProvider implements StorageProvider {
  readonly mode = 'memory' as const
  private preferences: AppPreferences | null = null

  async initialize() {
    return Promise.resolve()
  }

  async getAppPreferences() {
    return this.preferences ? { ...this.preferences } : null
  }

  async saveAppPreferences(preferences: AppPreferences) {
    this.preferences = { ...preferences }
  }
}
