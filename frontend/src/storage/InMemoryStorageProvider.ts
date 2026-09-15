import type { AppPreferences, Organization, StrategicPlan } from '../types/models'
import type { StorageProvider } from './StorageProvider'

export class InMemoryStorageProvider implements StorageProvider {
  readonly mode = 'memory' as const
  private preferences: AppPreferences | null = null
  private organizations = new Map<string, Organization>()
  private plans = new Map<string, StrategicPlan>()

  async initialize() {
    return Promise.resolve()
  }

  async getAppPreferences() {
    return this.preferences ? { ...this.preferences } : null
  }

  async saveAppPreferences(preferences: AppPreferences) {
    this.preferences = { ...preferences }
  }

  async getOrganizations() {
    return Array.from(this.organizations.values(), cloneOrganization)
  }

  async saveOrganization(organization: Organization) {
    this.organizations.set(organization.id, cloneOrganization(organization))
  }

  async deleteOrganization(id: Organization['id']) {
    this.organizations.delete(id)
    for (const [planId, plan] of this.plans) {
      if (plan.organizationId === id) this.plans.delete(planId)
    }
  }

  async getPlans() {
    return Array.from(this.plans.values(), (plan) => ({ ...plan }))
  }

  async savePlan(plan: StrategicPlan) {
    this.plans.set(plan.id, { ...plan })
  }

  async deletePlan(id: StrategicPlan['id']) {
    this.plans.delete(id)
  }
}

function cloneOrganization(organization: Organization): Organization {
  return {
    ...organization,
    productsOrServices: [...organization.productsOrServices],
    customerSegments: [...organization.customerSegments],
    markets: [...organization.markets],
    competitors: [...organization.competitors],
    principles: [...organization.principles],
  }
}
