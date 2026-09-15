import { AlertCircle } from 'lucide-react'
import type { Organization, StrategicPlan } from '../types/models'

interface PlanContextSelectorProps {
  organizations: Organization[]
  plans: StrategicPlan[]
  selectedPlanId: string
  onChange: (planId: string) => void
}

export function PlanContextSelector({ onChange, organizations, plans, selectedPlanId }: PlanContextSelectorProps) {
  const organizationMap = new Map(organizations.map((organization) => [organization.id, organization.name]))
  if (plans.length === 0) {
    return <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert"><AlertCircle className="size-4" aria-hidden="true" />Crea primero un plan estratégico en Planeamiento.</div>
  }
  return (
    <label className="text-sm font-bold text-slate-700">Plan de trabajo
      <select className="mt-2 w-full min-w-64 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} value={selectedPlanId}>
        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {organizationMap.get(plan.organizationId) ?? 'Sin organización'}</option>)}
      </select>
    </label>
  )
}
