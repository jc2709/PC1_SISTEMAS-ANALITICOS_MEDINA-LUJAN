import type { AIInteraction, AppPreferences, Organization, StrategicPlan } from '../types/models'

export type StorageMode = 'indexed-db' | 'memory'

export interface StorageProvider {
  readonly mode: StorageMode
  initialize(): Promise<void>
  getAppPreferences(): Promise<AppPreferences | null>
  saveAppPreferences(preferences: AppPreferences): Promise<void>
  getOrganizations(): Promise<Organization[]>
  saveOrganization(organization: Organization): Promise<void>
  deleteOrganization(id: Organization['id']): Promise<void>
  getPlans(): Promise<StrategicPlan[]>
  savePlan(plan: StrategicPlan): Promise<void>
  deletePlan(id: StrategicPlan['id']): Promise<void>
  getAIInteractions(): Promise<AIInteraction[]>
  saveAIInteraction(interaction: AIInteraction): Promise<void>
}
