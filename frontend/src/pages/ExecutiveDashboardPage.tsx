import { Activity, BarChart3, CheckCircle2, Clock3, TrendingUp, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { PlanContextSelector } from '../components/PlanContextSelector'
import { computeKPIStatus, computeObjectiveStatus, isInitiativeDelayed } from '../services/controlService'
import type { ControlWorkspace, KPIStatus, Organization, StrategicPlan } from '../types/models'

interface ExecutiveDashboardPageProps {
  controlWorkspaces: ControlWorkspace[]
  organizations: Organization[]
  plans: StrategicPlan[]
}

const STATUS_LABELS: Record<KPIStatus, string> = { GREEN: 'Verde', AMBER: 'Ámbar', RED: 'Rojo', GRAY: 'Sin datos' }
const STATUS_STYLES: Record<KPIStatus, string> = { GREEN: 'bg-emerald-500 text-emerald-700', AMBER: 'bg-amber-400 text-amber-700', RED: 'bg-red-500 text-red-700', GRAY: 'bg-slate-300 text-slate-500' }
const STATUS_BADGES: Record<KPIStatus, string> = { GREEN: 'bg-emerald-50 text-emerald-700', AMBER: 'bg-amber-50 text-amber-700', RED: 'bg-red-50 text-red-700', GRAY: 'bg-slate-100 text-slate-500' }

export function ExecutiveDashboardPage({ controlWorkspaces, organizations, plans }: ExecutiveDashboardPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const effectivePlanId = plans.some((plan) => plan.id === selectedPlanId) ? selectedPlanId : plans[0]?.id ?? ''
  const workspace = controlWorkspaces.find((item) => item.planId === effectivePlanId)
  const latestSimulation = getLatestSimulation(workspace)
  const statusCounts: Record<KPIStatus, number> = { GREEN: 0, AMBER: 0, RED: 0, GRAY: 0 }
  for (const objective of workspace?.objectives ?? []) statusCounts[computeObjectiveStatus(objective.id, workspace?.kpis ?? [])] += 1
  const initiatives = workspace?.initiatives ?? []
  const financialCards = [
    ['EVA', latestSimulation?.outputs.eva, 'currency'], ['Ventas', latestSimulation?.inputs.sales, 'currency'],
    ['EBIT', latestSimulation?.inputs.ebit, 'currency'], ['NOPAT', latestSimulation?.outputs.nopat, 'currency'],
    ['ROIC', latestSimulation?.outputs.roic, 'percent'], ['OTIF', latestSimulation?.inputs.otif, 'percent'],
    ['WAPE', latestSimulation?.inputs.wape, 'percent'], ['OEE', latestSimulation?.inputs.oee, 'percent'],
    ['KPI certificados', workspace?.kpis.filter((kpi) => kpi.dataQuality === 'CERTIFIED').length ?? 0, 'number'],
  ] as const

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Fase 9 · Seguimiento</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Dashboard ejecutivo</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Integra desempeño estratégico, valor económico, calidad de datos e iniciativas.</p></div><div className="w-full xl:w-auto"><PlanContextSelector onChange={setSelectedPlanId} organizations={organizations} plans={plans} selectedPlanId={effectivePlanId} /></div></div>

      {workspace ? <>
        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {financialCards.map(([label, value, format]) => <MetricCard format={format} key={label} label={label} value={value} />)}
        </section>
        <section className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl bg-navy-900 p-6 text-white shadow-[0_18px_50px_rgba(7,20,38,0.18)] sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Salud estratégica</p><h2 className="mt-2 text-xl font-bold">Objetivos por semáforo</h2></div><Activity className="size-6 text-cyan-300" aria-hidden="true" /></div>
            <div className="mt-7 grid grid-cols-4 gap-3">{(['GREEN', 'AMBER', 'RED', 'GRAY'] as const).map((status) => <div className="rounded-2xl bg-white/[0.07] p-4 text-center" key={status}><span className={`mx-auto block size-3 rounded-full ${STATUS_STYLES[status].split(' ')[0]}`} /><p className="mt-3 text-2xl font-bold">{statusCounts[status]}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{STATUS_LABELS[status]}</p></div>)}</div>
            <div className="mt-7"><div className="flex h-4 overflow-hidden rounded-full bg-white/10">{(['GREEN', 'AMBER', 'RED', 'GRAY'] as const).map((status) => { const total = Math.max(1, workspace.objectives.length); return <span className={STATUS_STYLES[status].split(' ')[0]} key={status} style={{ width: `${(statusCounts[status] / total) * 100}%` }} /> })}</div><p className="mt-3 text-xs text-slate-400">El gris indica datos faltantes o insuficientes, no un resultado favorable.</p></div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Ejecución</p><h2 className="mt-2 text-xl font-bold text-slate-950">Estado de iniciativas</h2><div className="mt-6 space-y-4"><ExecutionRow icon={CheckCircle2} label="Completadas" tone="text-emerald-600 bg-emerald-50" value={initiatives.filter((item) => item.status === 'COMPLETED').length} /><ExecutionRow icon={TrendingUp} label="En ejecución" tone="text-cyan-700 bg-cyan-50" value={initiatives.filter((item) => item.status === 'IN_PROGRESS').length} /><ExecutionRow icon={TriangleAlert} label="Retrasadas" tone="text-red-600 bg-red-50" value={initiatives.filter((item) => isInitiativeDelayed(item)).length} /><ExecutionRow icon={Clock3} label="Planificadas" tone="text-blue-600 bg-blue-50" value={initiatives.filter((item) => item.status === 'PLANNED').length} /></div></article>
        </section>
        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Cockpit ejecutivo</p><h2 className="mt-2 text-xl font-bold text-slate-950">Real, trayectoria, forecast y acción</h2><p className="mt-1 text-sm text-slate-500">La acción recomendada corresponde a la regla definida por el usuario en cada KPI.</p></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-4 py-3">Objetivo</th><th className="px-4 py-3">KPI</th><th className="px-4 py-3">Real</th><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Trayectoria</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Forecast</th><th className="px-4 py-3">Acción ante desvío</th></tr></thead><tbody className="divide-y divide-slate-100">{workspace.kpis.map((kpi) => { const status = computeKPIStatus(kpi); return <tr key={kpi.id}><td className="px-4 py-4 text-sm font-semibold text-slate-600">{workspace.objectives.find((objective) => objective.id === kpi.objectiveId)?.name ?? '—'}</td><td className="px-4 py-4 font-bold text-slate-800">{kpi.name}</td><td className="px-4 py-4 text-sm font-bold text-slate-700">{formatKpi(kpi.actual, kpi.unit)}</td><td className="px-4 py-4 text-sm text-slate-600">{formatKpi(kpi.target, kpi.unit)}</td><td className="px-4 py-4 text-sm text-slate-600">{formatKpi(kpi.trajectory, kpi.unit)}</td><td className="px-4 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGES[status]}`}><span className={`size-2 rounded-full ${STATUS_STYLES[status].split(' ')[0]}`} />{STATUS_LABELS[status]}</span></td><td className="px-4 py-4 text-sm font-bold text-slate-700">{formatKpi(kpi.forecast, kpi.unit)}</td><td className="max-w-xs px-4 py-4 text-sm leading-5 text-slate-500">{status === 'GREEN' ? 'Mantener seguimiento.' : kpi.deviationAction || 'Definir acción correctiva.'}</td></tr> })}</tbody></table>{workspace.kpis.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Registra KPI en Balanced Scorecard para activar el cockpit.</p> : null}</div>
        </section>
      </> : plans.length > 0 ? <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><BarChart3 className="mx-auto size-8 text-slate-300" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-800">Sin datos de control</h2><p className="mt-2 text-sm text-slate-500">Crea objetivos o simulaciones para el plan seleccionado.</p></div> : null}
    </div>
  )
}

function MetricCard({ format, label, value }: { format: 'currency' | 'percent' | 'number'; label: string; value: number | undefined }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p><p className={`mt-3 text-xl font-bold ${value === undefined ? 'text-slate-300' : 'text-slate-950'}`}>{value === undefined ? 'Sin datos' : format === 'currency' ? `S/ ${formatNumber(value)}` : format === 'percent' ? `${formatNumber(value)}%` : formatNumber(value)}</p></article> }
function ExecutionRow({ icon: Icon, label, tone, value }: { icon: typeof Activity; label: string; tone: string; value: number }) { return <div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden="true" /></span><span className="flex-1 text-sm font-semibold text-slate-600">{label}</span><span className="text-xl font-bold text-slate-900">{value}</span></div> }
function getLatestSimulation(workspace?: ControlWorkspace) { let latest = workspace?.simulations[0]; for (const simulation of workspace?.simulations ?? []) if (!latest || simulation.createdAt > latest.createdAt) latest = simulation; return latest }
function formatNumber(value: number) { return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(value) }
function formatKpi(value: number | null, unit: string) { return value === null ? '—' : `${formatNumber(value)} ${unit}` }
