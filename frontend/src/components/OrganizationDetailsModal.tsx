import { Building2, ChartNoAxesCombined, Compass, Factory, Globe2, Package, Scale, Target, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Organization, StrategicPlan } from '../types/models'
import { Modal } from './Modal'

interface OrganizationDetailsModalProps {
  onClose: () => void
  organization: Organization
  plans: StrategicPlan[]
}

export function OrganizationDetailsModal({ onClose, organization, plans }: OrganizationDetailsModalProps) {
  return (
    <Modal description={organization.sector} isOpen onClose={onClose} title={organization.name} width="large">
      <div className="max-h-[72vh] space-y-7 overflow-y-auto p-6 sm:p-8">
        <DetailSection icon={Building2} title="Descripción"><TextValue value={organization.description} /></DetailSection>
        <div className="grid gap-5 md:grid-cols-2">
          <DetailSection icon={Package} title="Productos o servicios"><ListValue values={organization.productsOrServices} /></DetailSection>
          <DetailSection icon={Users} title="Segmentos de clientes"><ListValue values={organization.customerSegments} /></DetailSection>
          <DetailSection icon={Globe2} title="Mercados"><ListValue values={organization.markets} /></DetailSection>
          <DetailSection icon={Scale} title="Competidores"><ListValue values={organization.competitors} /></DetailSection>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <DetailSection icon={Compass} title="Misión actual"><TextValue value={organization.currentMission} /></DetailSection>
          <DetailSection icon={Target} title="Visión actual"><TextValue value={organization.currentVision} /></DetailSection>
        </div>
        <DetailSection icon={Scale} title="Principios"><ListValue values={organization.principles} /></DetailSection>
        <div className="grid gap-5 md:grid-cols-2">
          <DetailSection icon={ChartNoAxesCombined} title="Información financiera"><TextValue value={organization.financialInformation} /></DetailSection>
          <DetailSection icon={Factory} title="Información operativa"><TextValue value={organization.operationalInformation} /></DetailSection>
        </div>
        <DetailSection icon={Target} title="Planes estratégicos">
          {plans.length > 0 ? <div className="space-y-2">{plans.map((plan) => <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3" key={plan.id}><span className="text-sm font-semibold text-slate-700">{plan.name}</span><span className="text-xs font-bold text-slate-400">{plan.startYear}–{plan.endYear}</span></div>)}</div> : <TextValue value="" />}
        </DetailSection>
      </div>
    </Modal>
  )
}

function DetailSection({ children, icon: Icon, title }: { children: ReactNode; icon: typeof Building2; title: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-cyan-700"><Icon className="size-4" aria-hidden="true" />{title}</h3><div className="mt-3">{children}</div></section>
}

function TextValue({ value }: { value: string }) {
  return <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{value || 'Sin información registrada.'}</p>
}

function ListValue({ values }: { values: string[] }) {
  return values.length > 0 ? <div className="flex flex-wrap gap-2">{values.map((value) => <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600" key={value}>{value}</span>)}</div> : <TextValue value="" />
}
