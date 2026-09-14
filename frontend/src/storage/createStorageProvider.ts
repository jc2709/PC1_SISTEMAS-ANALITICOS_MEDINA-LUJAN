import { InMemoryStorageProvider } from './InMemoryStorageProvider'
import { IndexedDbStorageProvider } from './IndexedDbStorageProvider'
import type { StorageProvider } from './StorageProvider'

export function createStorageProvider(): StorageProvider {
  return typeof indexedDB === 'undefined' ? new InMemoryStorageProvider() : new IndexedDbStorageProvider()
}
