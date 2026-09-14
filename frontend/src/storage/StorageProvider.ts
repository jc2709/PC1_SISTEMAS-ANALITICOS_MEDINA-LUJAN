import type { AppPreferences } from '../types/models'

export type StorageMode = 'indexed-db' | 'memory'

export interface StorageProvider {
  readonly mode: StorageMode
  initialize(): Promise<void>
  getAppPreferences(): Promise<AppPreferences | null>
  saveAppPreferences(preferences: AppPreferences): Promise<void>
}
