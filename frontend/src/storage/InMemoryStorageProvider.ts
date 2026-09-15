import type { AIInteraction, AppPreferences, ControlWorkspace, Organization, StrategicPlan, StrategicPlanning } from '../types/models'
import type { StorageProvider } from './StorageProvider'

export class InMemoryStorageProvider implements StorageProvider {
  readonly mode = 'memory' as const
  private preferences: AppPreferences | null = null
  private organizations = new Map<string, Organization>()
  private plans = new Map<string, StrategicPlan>()
  private aiInteractions = new Map<string, AIInteraction>()
  private strategicPlannings = new Map<string, StrategicPlanning>()
  private controlWorkspaces = new Map<string, ControlWorkspace>()

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
    for (const [interactionId, interaction] of this.aiInteractions) {
      if (interaction.organizationId === id) this.aiInteractions.delete(interactionId)
    }
    for (const [planningId, planning] of this.strategicPlannings) {
      if (planning.organizationId === id) this.strategicPlannings.delete(planningId)
    }
    for (const [workspaceId, workspace] of this.controlWorkspaces) {
      if (workspace.organizationId === id) this.controlWorkspaces.delete(workspaceId)
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
    for (const [interactionId, interaction] of this.aiInteractions) {
      if (interaction.planId === id) this.aiInteractions.delete(interactionId)
    }
    for (const [planningId, planning] of this.strategicPlannings) {
      if (planning.planId === id) this.strategicPlannings.delete(planningId)
    }
    for (const [workspaceId, workspace] of this.controlWorkspaces) {
      if (workspace.planId === id) this.controlWorkspaces.delete(workspaceId)
    }
  }

  async getAIInteractions() {
    return Array.from(this.aiInteractions.values(), cloneAIInteraction)
  }

  async saveAIInteraction(interaction: AIInteraction) {
    this.aiInteractions.set(interaction.id, cloneAIInteraction(interaction))
  }

  async getStrategicPlannings() {
    return Array.from(this.strategicPlannings.values(), cloneStrategicPlanning)
  }

  async saveStrategicPlanning(planning: StrategicPlanning) {
    this.strategicPlannings.set(planning.id, cloneStrategicPlanning(planning))
  }

  async getControlWorkspaces() {
    return Array.from(this.controlWorkspaces.values(), cloneControlWorkspace)
  }

  async saveControlWorkspace(workspace: ControlWorkspace) {
    this.controlWorkspaces.set(workspace.id, cloneControlWorkspace(workspace))
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

function cloneAIInteraction(interaction: AIInteraction): AIInteraction {
  return {
    ...interaction,
    finalContent: interaction.finalContent ? {
      ...interaction.finalContent,
      strengths: [...interaction.finalContent.strengths],
      risks: [...interaction.finalContent.risks],
      priorities: [...interaction.finalContent.priorities],
    } : null,
  }
}

function cloneStrategicPlanning(planning: StrategicPlanning): StrategicPlanning {
  return structuredClone(planning)
}

function cloneControlWorkspace(workspace: ControlWorkspace): ControlWorkspace {
  return structuredClone(workspace)
}
