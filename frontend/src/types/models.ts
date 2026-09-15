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
  schemaVersion: 2
  compactSidebar: boolean
  lastSection: string
  aiApiBaseUrl: string
}

export type AIInteractionStatus = 'AI_PROPOSED' | 'USER_EDITED' | 'APPROVED' | 'REJECTED' | 'ERROR'

export interface StrategicAnalysisContent {
  executiveSummary: string
  strengths: string[]
  risks: string[]
  priorities: string[]
  confidence: number
}

export interface AIInteraction {
  id: string
  organizationId: Organization['id']
  planId: StrategicPlan['id']
  module: 'STRATEGIC_ANALYSIS'
  action: 'GENERATE_ANALYSIS'
  prompt: string
  response: string
  model: string
  createdAt: string
  updatedAt: string
  status: AIInteractionStatus
  approvedByUser: boolean
  userEdited: boolean
  finalContent: StrategicAnalysisContent | null
}

export type PlanningSection = 'PREPARATION' | 'DIAGNOSIS' | 'IDENTITY' | 'STRATEGY'
export type PlanningSectionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED'
export type StrategicImpact = 'LOW' | 'MEDIUM' | 'HIGH'

export interface SWOTAnalysis {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export interface StrategicFact {
  id: string
  fact: string
  evidence: string
  impact: StrategicImpact
  explanation: string
  uncertainty: string
  decisionRequired: boolean
  source: string
  confidence: number
}

export interface MissionDesign {
  priorityCustomer: string
  criticalNeed: string
  offer: string
  verifiableOutcome: string
  differentiation: string
  capabilities: string
  principles: string
  statement: string
}

export interface VisionDesign {
  statement: string
  horizon: string
}

export interface StrategicChoice {
  whereToCompete: string
  howToWin: string
  requiredCapabilities: string[]
  managementSystem: string
  strategicTradeoffs: string[]
}

export interface StrategicPlanning {
  id: string
  organizationId: Organization['id']
  planId: StrategicPlan['id']
  mandate: string
  strategicChallenge: string
  swot: SWOTAnalysis
  criticalFacts: StrategicFact[]
  mission: MissionDesign
  vision: VisionDesign
  strategy: StrategicChoice
  sectionStatuses: Record<PlanningSection, PlanningSectionStatus>
  createdAt: string
  updatedAt: string
}

export type OrganizationInput = Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
export type StrategicPlanInput = Omit<StrategicPlan, 'id' | 'createdAt' | 'updatedAt'>
export type StrategicPlanningInput = Omit<StrategicPlanning, 'id' | 'createdAt' | 'updatedAt'>
