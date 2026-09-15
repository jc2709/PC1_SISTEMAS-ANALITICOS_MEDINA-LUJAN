import { Activity, BarChart3, Bot, Check, CheckCircle2, Clock3, Edit3, Sparkles, TrendingUp, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { PlanContextSelector } from '../components/PlanContextSelector'
import { computeKPIStatus, computeObjectiveStatus, isInitiativeDelayed, toControlWorkspaceInput } from '../services/controlService'
import { createExecutiveNarrative, updateExecutiveNarrative, type AIConnectionState, type ExecutiveNarrativeRequest, type ExecutiveNarrativeResult } from '../services/aiService'
import type { ControlWorkspace, ControlWorkspaceInput, ExecutiveNarrative, ExecutiveNarrativeContent, KPIStatus, Organization, StrategicPlan } from '../types/models'

interface ExecutiveDashboardPageProps {
  aiConnection: AIConnectionState
  controlWorkspaces: ControlWorkspace[]
  onExplain: (input: ExecutiveNarrativeRequest) => Promise<ExecutiveNarrativeResult>
  onSave: (input: ControlWorkspaceInput, existing?: ControlWorkspace) => Promise<ControlWorkspace>
  organizations: Organization[]
  plans: StrategicPlan[]
}

const STATUS_LABELS: Record<KPIStatus, string> = { GREEN: 'Verde', AMBER: 'Ámbar', RED: 'Rojo', GRAY: 'Sin datos' }
const STATUS_STYLES: Record<KPIStatus, string> = { GREEN: 'bg-emerald-500 text-emerald-700', AMBER: 'bg-amber-400 text-amber-700', RED: 'bg-red-500 text-red-700', GRAY: 'bg-slate-300 text-slate-500' }
const STATUS_BADGES: Record<KPIStatus, string> = { GREEN: 'bg-emerald-50 text-emerald-700', AMBER: 'bg-amber-50 text-amber-700', RED: 'bg-red-50 text-red-700', GRAY: 'bg-slate-100 text-slate-500' }

export function ExecutiveDashboardPage({ aiConnection, controlWorkspaces, onExplain, onSave, organizations, plans }: ExecutiveDashboardPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [narrativeFocus, setNarrativeFocus] = useState('')
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string | null>(null)
  const [editingNarrative, setEditingNarrative] = useState<ExecutiveNarrative | null>(null)
  const [narrativeNotice, setNarrativeNotice] = useState<string | null>(null)
  const [narrativeError, setNarrativeError] = useState<string | null>(null)
  const effectivePlanId = plans.some((plan) => plan.id === selectedPlanId) ? selectedPlanId : plans[0]?.id ?? ''
  const workspace = controlWorkspaces.find((item) => item.planId === effectivePlanId)
  const plan = plans.find((item) => item.id === effectivePlanId)
  const organization = organizations.find((item) => item.id === plan?.organizationId)
  const narratives = [...(workspace?.executiveNarratives ?? [])].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const selectedNarrative = narratives.find((item) => item.id === selectedNarrativeId) ?? narratives[0]
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

  const persistNarrative = async (narrative: ExecutiveNarrative) => {
    if (!workspace) return
    const current = workspace.executiveNarratives ?? []
    const executiveNarratives = current.some((item) => item.id === narrative.id)
      ? current.map((item) => item.id === narrative.id ? narrative : item)
      : [narrative, ...current]
    await onSave({ ...toControlWorkspaceInput(workspace), executiveNarratives }, workspace)
  }

  const handleGenerateNarrative = async () => {
    if (!workspace || !plan || !organization) return
    setNarrativeError(null)
    setNarrativeNotice(null)
    try {
      const request = { organization, plan, workspace, focus: narrativeFocus }
      const result = await onExplain(request)
      const narrative = createExecutiveNarrative(request, result)
      await persistNarrative(narrative)
      setSelectedNarrativeId(narrative.id)
      setNarrativeNotice('Narrativa generada. Revísala antes de aprobarla.')
    } catch (error) {
      setNarrativeError(error instanceof Error ? error.message : 'No se pudo generar la narrativa ejecutiva.')
    }
  }

  const handleNarrativeDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedNarrative) return
    await persistNarrative(updateExecutiveNarrative(selectedNarrative, decision))
    setNarrativeNotice(decision === 'APPROVED' ? 'Narrativa aprobada y disponible para los reportes.' : 'Narrativa rechazada; no se utilizará en reportes.')
  }

  const handleNarrativeEdit = async (content: ExecutiveNarrativeContent) => {
    if (!editingNarrative) return
    const updated = updateExecutiveNarrative(editingNarrative, 'USER_EDITED', content)
    await persistNarrative(updated)
    setSelectedNarrativeId(updated.id)
    setEditingNarrative(null)
    setNarrativeNotice('Edición humana guardada. Puedes aprobarla o rechazarla.')
  }

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
        <section className="mt-7 rounded-3xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/60 p-5 sm:p-7" aria-labelledby="narrative-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Fase 10 · Copiloto ejecutivo</p><h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-950" id="narrative-title"><Sparkles className="size-5 text-cyan-700" aria-hidden="true" />Narrativa del dashboard</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Gemini separa dato, inferencia, pronóstico y recomendación. Ninguna propuesta se aprueba automáticamente.</p></div>
            <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">{aiConnection.model ? `Modelo: ${aiConnection.model}` : 'IA sin conexión'}</span>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]"><label className="text-sm font-bold text-slate-700">Enfoque opcional<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal outline-none focus:border-cyan-brand" maxLength={800} onChange={(event) => setNarrativeFocus(event.target.value)} placeholder="Ej.: prioriza creación de valor y riesgos de ejecución" value={narrativeFocus} /></label><button className="mt-auto inline-flex h-fit items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45" disabled={aiConnection.status !== 'CONNECTED'} onClick={() => void handleGenerateNarrative()} type="button"><Bot className="size-4" aria-hidden="true" />{aiConnection.status === 'PROCESSING' ? 'Generando…' : 'Generar narrativa IA'}</button></div>
          {narrativeNotice ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{narrativeNotice}</p> : null}
          {narrativeError ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{narrativeError}</p> : null}
          {selectedNarrative ? <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{NARRATIVE_STATUS_LABELS[selectedNarrative.status]} · {new Date(selectedNarrative.updatedAt).toLocaleString('es-PE')}</p><p className="mt-1 text-xs text-slate-500">Confianza declarada: {Math.round(selectedNarrative.finalContent.confidence * 100)}%</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600" onClick={() => setEditingNarrative(structuredClone(selectedNarrative))} type="button"><Edit3 className="size-4" aria-hidden="true" />Editar</button><button className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600" onClick={() => void handleNarrativeDecision('REJECTED')} type="button"><X className="size-4" aria-hidden="true" />Rechazar</button><button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white" onClick={() => void handleNarrativeDecision('APPROVED')} type="button"><Check className="size-4" aria-hidden="true" />Aprobar</button></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{NARRATIVE_FIELDS.map(([key, label, tone]) => <NarrativeBlock key={key} label={label} tone={tone} value={selectedNarrative.finalContent[key]} />)}</div></article> : <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">Aún no existe una narrativa ejecutiva para este plan.</p>}
        </section>
      </> : plans.length > 0 ? <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><BarChart3 className="mx-auto size-8 text-slate-300" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-800">Sin datos de control</h2><p className="mt-2 text-sm text-slate-500">Crea objetivos o simulaciones para el plan seleccionado.</p></div> : null}
      {editingNarrative ? <NarrativeEditor narrative={editingNarrative} onClose={() => setEditingNarrative(null)} onSave={handleNarrativeEdit} /> : null}
    </div>
  )
}

const NARRATIVE_STATUS_LABELS: Record<ExecutiveNarrative['status'], string> = { AI_PROPOSED: 'Propuesta IA', USER_EDITED: 'Editada por usuario', APPROVED: 'Aprobada', REJECTED: 'Rechazada', ERROR: 'Error' }
const NARRATIVE_FIELDS: Array<[keyof Omit<ExecutiveNarrativeContent, 'confidence'>, string, string]> = [
  ['data', 'Dato', 'border-blue-200 bg-blue-50 text-blue-900'],
  ['inference', 'Inferencia', 'border-violet-200 bg-violet-50 text-violet-900'],
  ['forecast', 'Pronóstico', 'border-amber-200 bg-amber-50 text-amber-900'],
  ['recommendation', 'Recomendación', 'border-emerald-200 bg-emerald-50 text-emerald-900'],
]

function NarrativeBlock({ label, tone, value }: { label: string; tone: string; value: string }) { return <div className={`rounded-xl border p-4 ${tone}`}><p className="text-xs font-bold uppercase tracking-[0.12em]">{label}</p><p className="mt-2 text-sm leading-6">{value}</p></div> }
function NarrativeEditor({ narrative, onClose, onSave }: { narrative: ExecutiveNarrative; onClose: () => void; onSave: (content: ExecutiveNarrativeContent) => Promise<void> }) {
  const [content, setContent] = useState(narrative.finalContent)
  return <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-navy-950/65 p-4" role="dialog"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="border-b border-slate-200 p-6"><h2 className="text-xl font-bold text-slate-950">Editar narrativa ejecutiva</h2><p className="mt-1 text-sm text-slate-500">La edición se registrará como intervención humana.</p></div><div className="grid gap-4 p-6">{NARRATIVE_FIELDS.map(([key, label]) => <label className="text-sm font-bold text-slate-700" key={key}>{label}<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-cyan-brand" onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} value={content[key]} /></label>)}</div><div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4"><button className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500" onClick={onClose} type="button">Cancelar</button><button className="rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white" onClick={() => void onSave(content)} type="button">Guardar edición</button></div></div></div>
}

function MetricCard({ format, label, value }: { format: 'currency' | 'percent' | 'number'; label: string; value: number | undefined }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p><p className={`mt-3 text-xl font-bold ${value === undefined ? 'text-slate-300' : 'text-slate-950'}`}>{value === undefined ? 'Sin datos' : format === 'currency' ? `S/ ${formatNumber(value)}` : format === 'percent' ? `${formatNumber(value)}%` : formatNumber(value)}</p></article> }
function ExecutionRow({ icon: Icon, label, tone, value }: { icon: typeof Activity; label: string; tone: string; value: number }) { return <div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden="true" /></span><span className="flex-1 text-sm font-semibold text-slate-600">{label}</span><span className="text-xl font-bold text-slate-900">{value}</span></div> }
function getLatestSimulation(workspace?: ControlWorkspace) { let latest = workspace?.simulations[0]; for (const simulation of workspace?.simulations ?? []) if (!latest || simulation.createdAt > latest.createdAt) latest = simulation; return latest }
function formatNumber(value: number) { return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(value) }
function formatKpi(value: number | null, unit: string) { return value === null ? '—' : `${formatNumber(value)} ${unit}` }
