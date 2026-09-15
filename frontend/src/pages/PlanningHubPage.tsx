import { useState } from 'react'
import type { StorageMode } from '../storage/StorageProvider'
import type {
  AIInteraction,
  Organization,
  StrategicPlan,
  StrategicPlanInput,
  StrategicPlanning,
  StrategicPlanningInput,
} from '../types/models'
import { PlansPage } from './PlansPage'
import { StrategicPlanningPage } from './StrategicPlanningPage'

interface PlanningHubPageProps {
  aiInteractions: AIInteraction[]
  isLoading: boolean
  mode: StorageMode
  onDeletePlan: (id: StrategicPlan['id']) => Promise<void>
  onRequestOrganization: () => void
  onSavePlan: (input: StrategicPlanInput, existing?: StrategicPlan) => Promise<StrategicPlan>
  onSavePlanning: (input: StrategicPlanningInput, existing?: StrategicPlanning) => Promise<StrategicPlanning>
  organizations: Organization[]
  plans: StrategicPlan[]
  strategicPlannings: StrategicPlanning[]
  warning: string | null
}

export function PlanningHubPage(props: PlanningHubPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const selectedPlan = props.plans.find((plan) => plan.id === selectedPlanId)
  const selectedOrganization = props.organizations.find((organization) => organization.id === selectedPlan?.organizationId)

  if (selectedPlan && selectedOrganization) {
    return (
      <StrategicPlanningPage
        aiInteractions={props.aiInteractions.filter((interaction) => interaction.planId === selectedPlan.id)}
        existing={props.strategicPlannings.find((planning) => planning.planId === selectedPlan.id)}
        key={selectedPlan.id}
        onBack={() => setSelectedPlanId(null)}
        onSave={props.onSavePlanning}
        organization={selectedOrganization}
        plan={selectedPlan}
      />
    )
  }

  return (
    <PlansPage
      isLoading={props.isLoading}
      mode={props.mode}
      onDelete={props.onDeletePlan}
      onOpenPlanning={(plan) => setSelectedPlanId(plan.id)}
      onRequestOrganization={props.onRequestOrganization}
      onSave={props.onSavePlan}
      organizations={props.organizations}
      plans={props.plans}
      warning={props.warning}
    />
  )
}
