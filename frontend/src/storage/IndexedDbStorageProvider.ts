import type { AppPreferences } from '../types/models'
import type { StorageProvider } from './StorageProvider'

const DATABASE_NAME = 'gestion-control-estrategico-ia'
const DATABASE_VERSION = 1
const SETTINGS_STORE = 'settings'
const PREFERENCES_KEY = 'app-preferences'

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error ?? new Error('Error de IndexedDB')), { once: true })
  })
}

export class IndexedDbStorageProvider implements StorageProvider {
  readonly mode = 'indexed-db' as const
  private database: IDBDatabase | null = null

  async initialize() {
    if (this.database) return

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.addEventListener('upgradeneeded', () => {
      const database = request.result
      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE)
      }
    })

    this.database = await requestToPromise(request)
  }

  async getAppPreferences() {
    const store = this.getStore('readonly')
    const result = await requestToPromise(store.get(PREFERENCES_KEY))
    return result ? (result as AppPreferences) : null
  }

  async saveAppPreferences(preferences: AppPreferences) {
    const store = this.getStore('readwrite')
    await requestToPromise(store.put(preferences, PREFERENCES_KEY))
  }

  private getStore(mode: IDBTransactionMode) {
    if (!this.database) throw new Error('El almacenamiento no ha sido inicializado')
    return this.database.transaction(SETTINGS_STORE, mode).objectStore(SETTINGS_STORE)
  }
}
