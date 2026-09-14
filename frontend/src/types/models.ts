export interface Organization {
  id: string
  name: string
  sector: string
  description: string
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
