import type { AIInteraction, AppPreferences, Organization, StrategicPlan, StrategicPlanning } from '../types/models'
import type { StorageProvider } from './StorageProvider'

const DATABASE_NAME = 'gestion-control-estrategico-ia'
const DATABASE_VERSION = 4
const SETTINGS_STORE = 'settings'
const ORGANIZATIONS_STORE = 'organizations'
const PLANS_STORE = 'plans'
const AI_INTERACTIONS_STORE = 'aiInteractions'
const STRATEGIC_PLANNINGS_STORE = 'strategicPlannings'
const PREFERENCES_KEY = 'app-preferences'

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error ?? new Error('Error de IndexedDB')), { once: true })
  })
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true })
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('La transacción fue cancelada')), { once: true })
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('Error de IndexedDB')), { once: true })
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
      if (!database.objectStoreNames.contains(ORGANIZATIONS_STORE)) {
        database.createObjectStore(ORGANIZATIONS_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(PLANS_STORE)) {
        const plansStore = database.createObjectStore(PLANS_STORE, { keyPath: 'id' })
        plansStore.createIndex('organizationId', 'organizationId', { unique: false })
      }
      if (!database.objectStoreNames.contains(AI_INTERACTIONS_STORE)) {
        const interactionsStore = database.createObjectStore(AI_INTERACTIONS_STORE, { keyPath: 'id' })
        interactionsStore.createIndex('organizationId', 'organizationId', { unique: false })
        interactionsStore.createIndex('planId', 'planId', { unique: false })
      }
      if (!database.objectStoreNames.contains(STRATEGIC_PLANNINGS_STORE)) {
        const planningStore = database.createObjectStore(STRATEGIC_PLANNINGS_STORE, { keyPath: 'id' })
        planningStore.createIndex('organizationId', 'organizationId', { unique: false })
        planningStore.createIndex('planId', 'planId', { unique: true })
      }
    })

    this.database = await requestToPromise(request)
  }

  async getAppPreferences() {
    const store = this.getStore(SETTINGS_STORE, 'readonly')
    const result = await requestToPromise(store.get(PREFERENCES_KEY))
    return result ? (result as AppPreferences) : null
  }

  async saveAppPreferences(preferences: AppPreferences) {
    const transaction = this.getTransaction(SETTINGS_STORE, 'readwrite')
    transaction.objectStore(SETTINGS_STORE).put(preferences, PREFERENCES_KEY)
    await transactionToPromise(transaction)
  }

  async getOrganizations() {
    return requestToPromise(this.getStore(ORGANIZATIONS_STORE, 'readonly').getAll()) as Promise<Organization[]>
  }

  async saveOrganization(organization: Organization) {
    const transaction = this.getTransaction(ORGANIZATIONS_STORE, 'readwrite')
    transaction.objectStore(ORGANIZATIONS_STORE).put(organization)
    await transactionToPromise(transaction)
  }

  async deleteOrganization(id: Organization['id']) {
    const transaction = this.getTransaction([ORGANIZATIONS_STORE, PLANS_STORE, AI_INTERACTIONS_STORE, STRATEGIC_PLANNINGS_STORE], 'readwrite')
    transaction.objectStore(ORGANIZATIONS_STORE).delete(id)

    const plansIndex = transaction.objectStore(PLANS_STORE).index('organizationId')
    const cursorRequest = plansIndex.openKeyCursor(IDBKeyRange.only(id))
    cursorRequest.addEventListener('success', () => {
      const cursor = cursorRequest.result
      if (!cursor) return
      transaction.objectStore(PLANS_STORE).delete(cursor.primaryKey)
      cursor.continue()
    })
    this.deleteByIndex(transaction.objectStore(AI_INTERACTIONS_STORE).index('organizationId'), id)
    this.deleteByIndex(transaction.objectStore(STRATEGIC_PLANNINGS_STORE).index('organizationId'), id)
    await transactionToPromise(transaction)
  }

  async getPlans() {
    return requestToPromise(this.getStore(PLANS_STORE, 'readonly').getAll()) as Promise<StrategicPlan[]>
  }

  async savePlan(plan: StrategicPlan) {
    const transaction = this.getTransaction(PLANS_STORE, 'readwrite')
    transaction.objectStore(PLANS_STORE).put(plan)
    await transactionToPromise(transaction)
  }

  async deletePlan(id: StrategicPlan['id']) {
    const transaction = this.getTransaction([PLANS_STORE, AI_INTERACTIONS_STORE, STRATEGIC_PLANNINGS_STORE], 'readwrite')
    transaction.objectStore(PLANS_STORE).delete(id)
    this.deleteByIndex(transaction.objectStore(AI_INTERACTIONS_STORE).index('planId'), id)
    this.deleteByIndex(transaction.objectStore(STRATEGIC_PLANNINGS_STORE).index('planId'), id)
    await transactionToPromise(transaction)
  }

  async getAIInteractions() {
    return requestToPromise(this.getStore(AI_INTERACTIONS_STORE, 'readonly').getAll()) as Promise<AIInteraction[]>
  }

  async saveAIInteraction(interaction: AIInteraction) {
    const transaction = this.getTransaction(AI_INTERACTIONS_STORE, 'readwrite')
    transaction.objectStore(AI_INTERACTIONS_STORE).put(interaction)
    await transactionToPromise(transaction)
  }

  async getStrategicPlannings() {
    return requestToPromise(this.getStore(STRATEGIC_PLANNINGS_STORE, 'readonly').getAll()) as Promise<StrategicPlanning[]>
  }

  async saveStrategicPlanning(planning: StrategicPlanning) {
    const transaction = this.getTransaction(STRATEGIC_PLANNINGS_STORE, 'readwrite')
    transaction.objectStore(STRATEGIC_PLANNINGS_STORE).put(planning)
    await transactionToPromise(transaction)
  }

  private deleteByIndex(index: IDBIndex, value: string) {
    const cursorRequest = index.openKeyCursor(IDBKeyRange.only(value))
    cursorRequest.addEventListener('success', () => {
      const cursor = cursorRequest.result
      if (!cursor) return
      index.objectStore.delete(cursor.primaryKey)
      cursor.continue()
    })
  }

  private getStore(storeName: string, mode: IDBTransactionMode) {
    return this.getTransaction(storeName, mode).objectStore(storeName)
  }

  private getTransaction(storeNames: string | string[], mode: IDBTransactionMode) {
    if (!this.database) throw new Error('El almacenamiento no ha sido inicializado')
    return this.database.transaction(storeNames, mode)
  }
}
