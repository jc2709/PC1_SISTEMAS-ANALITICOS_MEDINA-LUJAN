export interface Organization {
  id: string
  name: string
  sector: string
  description: string
  productsOrServices: string[]
  customerSegments: string[]
  markets: string[]
  competitors: string[]
  currentMission: string
  currentVision: string
  principles: string[]
  financialInformation: string
  operationalInformation: string
  createdAt: string
  updatedAt: string
}

export type StrategicPlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export interface StrategicPlan {
  id: string
  organizationId: Organization['id']
  name: string
  startYear: number
  endYear: number
  status: StrategicPlanStatus
  createdAt: string
  updatedAt: string
}

export interface AppPreferences {
  schemaVersion: 1
  compactSidebar: boolean
  lastSection: string
}

export type OrganizationInput = Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
export type StrategicPlanInput = Omit<StrategicPlan, 'id' | 'createdAt' | 'updatedAt'>
