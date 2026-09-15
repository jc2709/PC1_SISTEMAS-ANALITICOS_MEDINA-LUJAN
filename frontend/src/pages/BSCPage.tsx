import { ArrowRight, CheckCircle2, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { PlanContextSelector } from '../components/PlanContextSelector'
import {
  computeKPIStatus,
  computeObjectiveStatus,
  createEmptyControlWorkspace,
  createKPI,
  createObjectiveRelationship,
  createStrategicObjective,
  deleteKPIFromWorkspace,
  deleteObjectiveFromWorkspace,
  toControlWorkspaceInput,
} from '../services/controlService'
import type {
  BalancedScorecardPerspective,
  ControlWorkspace,
  ControlWorkspaceInput,
  KPI,
  KPIDirection,
  ObjectiveRelationship,
  Organization,
  StrategicObjective,
  StrategicPlan,
} from '../types/models'

interface BSCPageProps {
  controlWorkspaces: ControlWorkspace[]
  onSave: (input: ControlWorkspaceInput, existing?: ControlWorkspace) => Promise<ControlWorkspace>
  organizations: Organization[]
  plans: StrategicPlan[]
}

const PERSPECTIVES: Array<{ id: BalancedScorecardPerspective; label: string; accent: string }> = [
  { id: 'FINANCIAL', label: 'Financiera', accent: 'border-emerald-400' },
  { id: 'CUSTOMER', label: 'Clientes', accent: 'border-blue-400' },
  { id: 'INTERNAL_PROCESS', label: 'Procesos internos', accent: 'border-violet-400' },
  { id: 'LEARNING_GROWTH', label: 'Aprendizaje y crecimiento', accent: 'border-amber-400' },
]

const STATUS_STYLES = {
  GREEN: 'bg-emerald-500', AMBER: 'bg-amber-400', RED: 'bg-red-500', GRAY: 'bg-slate-300',
} as const

export function BSCPage({ controlWorkspaces, onSave, organizations, plans }: BSCPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [objectiveDraft, setObjectiveDraft] = useState<StrategicObjective | null>(null)
  const [kpiDraft, setKpiDraft] = useState<KPI | null>(null)
  const [relationshipDraft, setRelationshipDraft] = useState<ObjectiveRelationship | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const effectivePlanId = plans.some((plan) => plan.id === selectedPlanId) ? selectedPlanId : plans[0]?.id ?? ''
  const plan = plans.find((item) => item.id === effectivePlanId)
  const workspace = controlWorkspaces.find((item) => item.planId === effectivePlanId)
  const input = workspace ? toControlWorkspaceInput(workspace) : createEmptyControlWorkspace(plan?.organizationId ?? '', effectivePlanId)

  const persist = async (next: ControlWorkspaceInput, message: string) => {
    try {
      await onSave(next, workspace)
      setNotice(message)
      setError(null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo guardar el Balanced Scorecard.')
    }
  }

  const saveObjective = async (objective: StrategicObjective) => {
    const exists = input.objectives.some((item) => item.id === objective.id)
    await persist({ ...input, objectives: exists ? input.objectives.map((item) => item.id === objective.id ? objective : item) : [...input.objectives, objective] }, exists ? 'Objetivo actualizado.' : 'Objetivo creado.')
    setObjectiveDraft(null)
  }

  const saveKPI = async (kpi: KPI) => {
    const exists = input.kpis.some((item) => item.id === kpi.id)
    await persist({ ...input, kpis: exists ? input.kpis.map((item) => item.id === kpi.id ? kpi : item) : [...input.kpis, kpi] }, exists ? 'KPI actualizado.' : 'KPI creado.')
    setKpiDraft(null)
  }

  const saveRelationship = async (relationship: ObjectiveRelationship) => {
    await persist({ ...input, relationships: [...input.relationships, relationship] }, 'Relación causa–efecto registrada.')
    setRelationshipDraft(null)
  }

  const removeObjective = (objective: StrategicObjective) => {
    if (window.confirm(`¿Eliminar el objetivo “${objective.name}” y sus KPI e iniciativas vinculadas?`)) void persist(deleteObjectiveFromWorkspace(input, objective.id), 'Objetivo eliminado.')
  }

  const removeKPI = (kpi: KPI) => {
    if (window.confirm(`¿Eliminar el KPI “${kpi.name}”?`)) void persist(deleteKPIFromWorkspace(input, kpi.id), 'KPI eliminado.')
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Fase 6 · Balanced Scorecard</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Mapa, objetivos y KPI</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Traduce la estrategia en objetivos medibles y relaciones causa–efecto.</p></div>
        <div className="w-full xl:w-auto"><PlanContextSelector onChange={setSelectedPlanId} organizations={organizations} plans={plans} selectedPlanId={effectivePlanId} /></div>
      </div>
      {notice ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{notice}</p> : null}
      {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      {plan ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3"><Summary label="Objetivos" value={input.objectives.length} /><Summary label="KPI" value={input.kpis.length} /><Summary label="Relaciones aprobadas" value={input.relationships.filter((item) => item.approved).length} /></div>
          <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold text-slate-950">Mapa estratégico</h2><p className="mt-1 text-sm text-slate-500">Las cuatro perspectivas muestran el estado calculado a partir de sus KPI.</p></div><div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-cyan-300" onClick={() => setRelationshipDraft(createObjectiveRelationship())} type="button"><Link2 className="size-4" aria-hidden="true" />Relacionar</button><button className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white" onClick={() => setObjectiveDraft(createStrategicObjective())} type="button"><Plus className="size-4" aria-hidden="true" />Objetivo</button></div></div>
            <div className="mt-6 grid gap-4 xl:grid-cols-4">
              {PERSPECTIVES.map((perspective) => (
                <div className={`rounded-2xl border border-t-4 border-slate-200 ${perspective.accent} bg-slate-50/60 p-4`} key={perspective.id}>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{perspective.label}</p>
                  <div className="mt-4 space-y-3">
                    {input.objectives.filter((objective) => objective.perspective === perspective.id).map((objective) => {
                      const objectiveKpis = input.kpis.filter((kpi) => kpi.objectiveId === objective.id)
                      return <article className="rounded-xl border border-slate-200 bg-white p-3" key={objective.id}><div className="flex items-start gap-2"><span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${STATUS_STYLES[computeObjectiveStatus(objective.id, input.kpis)]}`} /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{objective.name}</p><p className="mt-1 text-xs text-slate-400">{objectiveKpis.length} KPI · {objective.owner || 'Sin responsable'}</p></div><button aria-label={`Editar ${objective.name}`} className="text-slate-400 hover:text-cyan-700" onClick={() => setObjectiveDraft(structuredClone(objective))} type="button"><Pencil className="size-4" aria-hidden="true" /></button></div></article>
                    })}
                    {input.objectives.every((objective) => objective.perspective !== perspective.id) ? <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-400">Sin objetivos</p> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-bold text-slate-800">Relaciones causa → efecto</p><div className="mt-3 flex flex-wrap gap-2">{input.relationships.map((relationship) => <RelationshipPill key={relationship.id} objectives={input.objectives} relationship={relationship} onDelete={() => { if (window.confirm('¿Eliminar esta relación causa–efecto?')) void persist({ ...input, relationships: input.relationships.filter((item) => item.id !== relationship.id) }, 'Relación eliminada.') }} />)}{input.relationships.length === 0 ? <p className="text-sm text-slate-400">Aún no hay relaciones.</p> : null}</div></div>
          </section>

          <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-950">Ficha de indicadores</h2><p className="mt-1 text-sm text-slate-500">Real, meta, trayectoria y forecast con semáforo automático.</p></div><button className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" disabled={input.objectives.length === 0} onClick={() => setKpiDraft(createKPI(input.objectives[0]?.id))} type="button"><Plus className="size-4" aria-hidden="true" />KPI</button></div>
            <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Objetivo / KPI</th><th className="px-4 py-3">Real</th><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Trayectoria</th><th className="px-4 py-3">Forecast</th><th className="px-4 py-3">Calidad</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{input.kpis.map((kpi) => <tr key={kpi.id}><td className="px-4 py-4"><span className={`block size-3 rounded-full ${STATUS_STYLES[computeKPIStatus(kpi)]}`} /></td><td className="px-4 py-4"><p className="font-bold text-slate-800">{kpi.name}</p><p className="mt-1 text-xs text-slate-400">{input.objectives.find((item) => item.id === kpi.objectiveId)?.name}</p></td><MetricCell unit={kpi.unit} value={kpi.actual} /><MetricCell unit={kpi.unit} value={kpi.target} /><MetricCell unit={kpi.unit} value={kpi.trajectory} /><MetricCell unit={kpi.unit} value={kpi.forecast} /><td className="px-4 py-4 text-xs font-bold text-slate-500">{kpi.dataQuality}</td><td className="px-4 py-4"><div className="flex justify-end gap-1"><button aria-label={`Editar KPI ${kpi.name}`} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-cyan-50 hover:text-cyan-700" onClick={() => setKpiDraft(structuredClone(kpi))} type="button"><Pencil className="size-4" aria-hidden="true" /></button><button aria-label={`Eliminar KPI ${kpi.name}`} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeKPI(kpi)} type="button"><Trash2 className="size-4" aria-hidden="true" /></button></div></td></tr>)}</tbody></table>{input.kpis.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Crea un objetivo y luego agrega su primer KPI.</p> : null}</div>
          </section>
        </>
      ) : null}

      {objectiveDraft ? <ObjectiveModal objective={objectiveDraft} onClose={() => setObjectiveDraft(null)} onDelete={input.objectives.some((item) => item.id === objectiveDraft.id) ? () => { removeObjective(objectiveDraft); setObjectiveDraft(null) } : undefined} onSave={saveObjective} /> : null}
      {kpiDraft ? <KPIModal kpi={kpiDraft} objectives={input.objectives} onClose={() => setKpiDraft(null)} onSave={saveKPI} /> : null}
      {relationshipDraft ? <RelationshipModal objectives={input.objectives} onClose={() => setRelationshipDraft(null)} onSave={saveRelationship} relationship={relationshipDraft} /> : null}
    </div>
  )
}

function ObjectiveModal({ objective, onClose, onDelete, onSave }: { objective: StrategicObjective; onClose: () => void; onDelete?: () => void; onSave: (value: StrategicObjective) => Promise<void> }) {
  const [draft, setDraft] = useState(objective)
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); if (draft.name.trim()) void onSave({ ...draft, name: draft.name.trim() }) }
  return <Modal description="Define una prioridad estratégica dentro de una perspectiva." isOpen onClose={onClose} title={objective.name ? 'Editar objetivo' : 'Nuevo objetivo'}><form onSubmit={handleSubmit}><div className="grid gap-4 p-6 sm:grid-cols-2"><Field label="Nombre" onChange={(value) => setDraft((current) => ({ ...current, name: value }))} required value={draft.name} /><SelectField label="Perspectiva" onChange={(value) => setDraft((current) => ({ ...current, perspective: value as BalancedScorecardPerspective }))} options={PERSPECTIVES.map((item) => [item.id, item.label])} value={draft.perspective} /><div className="sm:col-span-2"><TextArea label="Descripción" onChange={(value) => setDraft((current) => ({ ...current, description: value }))} value={draft.description} /></div><Field label="Responsable" onChange={(value) => setDraft((current) => ({ ...current, owner: value }))} value={draft.owner} /><SelectField label="Prioridad" onChange={(value) => setDraft((current) => ({ ...current, priority: value as StrategicObjective['priority'] }))} options={[["HIGH", "Alta"], ["MEDIUM", "Media"], ["LOW", "Baja"]]} value={draft.priority} /></div><ModalActions onClose={onClose} onDelete={onDelete} /></form></Modal>
}

function KPIModal({ kpi, objectives, onClose, onSave }: { kpi: KPI; objectives: StrategicObjective[]; onClose: () => void; onSave: (value: KPI) => Promise<void> }) {
  const [draft, setDraft] = useState(kpi)
  const setNumber = (field: 'baseline' | 'target' | 'trajectory' | 'actual' | 'forecast', value: string) => setDraft((current) => ({ ...current, [field]: value === '' ? null : Number(value) }))
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); if (draft.name.trim() && draft.objectiveId) void onSave({ ...draft, name: draft.name.trim() }) }
  return <Modal description="Cada indicador conserva definición, valores, calidad y acción ante desvío." isOpen onClose={onClose} title={kpi.name ? 'Editar KPI' : 'Nuevo KPI'} width="large"><form onSubmit={handleSubmit}><div className="grid max-h-[65vh] gap-4 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3"><Field label="Nombre" onChange={(value) => setDraft((current) => ({ ...current, name: value }))} required value={draft.name} /><SelectField label="Objetivo" onChange={(value) => setDraft((current) => ({ ...current, objectiveId: value }))} options={objectives.map((item) => [item.id, item.name])} value={draft.objectiveId} /><Field label="Unidad" onChange={(value) => setDraft((current) => ({ ...current, unit: value }))} value={draft.unit} /><div className="sm:col-span-2 lg:col-span-3"><TextArea label="Descripción" onChange={(value) => setDraft((current) => ({ ...current, description: value }))} value={draft.description} /></div><Field label="Propósito" onChange={(value) => setDraft((current) => ({ ...current, purpose: value }))} value={draft.purpose} /><Field label="Fórmula" onChange={(value) => setDraft((current) => ({ ...current, formula: value }))} value={draft.formula} /><SelectField label="Dirección" onChange={(value) => setDraft((current) => ({ ...current, direction: value as KPIDirection }))} options={[["HIGHER_IS_BETTER", "Mayor es mejor"], ["LOWER_IS_BETTER", "Menor es mejor"], ["TARGET", "Cercanía a meta"]]} value={draft.direction} /><Field label="Fuente" onChange={(value) => setDraft((current) => ({ ...current, source: value }))} value={draft.source} /><Field label="Frecuencia" onChange={(value) => setDraft((current) => ({ ...current, frequency: value }))} value={draft.frequency} /><Field label="Responsable" onChange={(value) => setDraft((current) => ({ ...current, responsible: value }))} value={draft.responsible} />{(['baseline', 'target', 'trajectory', 'actual', 'forecast'] as const).map((field) => <NumberField key={field} label={{ baseline: 'Línea base', target: 'Meta', trajectory: 'Trayectoria', actual: 'Real', forecast: 'Forecast' }[field]} onChange={(value) => setNumber(field, value)} value={draft[field]} />)}<SelectField label="Calidad" onChange={(value) => setDraft((current) => ({ ...current, dataQuality: value as KPI['dataQuality'] }))} options={[["CERTIFIED", "Certificada"], ["REVIEW", "En revisión"], ["MISSING", "Faltante"]]} value={draft.dataQuality} /><div className="sm:col-span-2"><TextArea label="Acción ante desvío" onChange={(value) => setDraft((current) => ({ ...current, deviationAction: value }))} value={draft.deviationAction} /></div><TextArea label="Riesgo" onChange={(value) => setDraft((current) => ({ ...current, risk: value }))} value={draft.risk} /></div><ModalActions onClose={onClose} /></form></Modal>
}

function RelationshipModal({ objectives, onClose, onSave, relationship }: { objectives: StrategicObjective[]; onClose: () => void; onSave: (value: ObjectiveRelationship) => Promise<void>; relationship: ObjectiveRelationship }) {
  const [draft, setDraft] = useState(relationship)
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); if (draft.sourceObjectiveId && draft.targetObjectiveId) void onSave(draft) }
  return <Modal description="Registra una hipótesis causal que puede aprobarse explícitamente." isOpen onClose={onClose} title="Nueva relación"><form onSubmit={handleSubmit}><div className="grid gap-4 p-6"><SelectField label="Objetivo origen" onChange={(value) => setDraft((current) => ({ ...current, sourceObjectiveId: value }))} options={[["", "Seleccionar"], ...objectives.map((item) => [item.id, item.name] as [string, string])]} value={draft.sourceObjectiveId} /><SelectField label="Objetivo destino" onChange={(value) => setDraft((current) => ({ ...current, targetObjectiveId: value }))} options={[["", "Seleccionar"], ...objectives.map((item) => [item.id, item.name] as [string, string])]} value={draft.targetObjectiveId} /><TextArea label="Descripción" onChange={(value) => setDraft((current) => ({ ...current, description: value }))} value={draft.description} /><label className="text-sm font-bold text-slate-700">Confianza ({Math.round(draft.confidence * 100)} %)<input className="mt-3 w-full accent-cyan-600" max="1" min="0" onChange={(event) => setDraft((current) => ({ ...current, confidence: Number(event.target.value) }))} step="0.05" type="range" value={draft.confidence} /></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-700"><input checked={draft.approved} className="size-4 accent-cyan-600" onChange={(event) => setDraft((current) => ({ ...current, approved: event.target.checked }))} type="checkbox" />Relación aprobada</label></div><ModalActions onClose={onClose} /></form></Modal>
}

function RelationshipPill({ objectives, onDelete, relationship }: { objectives: StrategicObjective[]; onDelete: () => void; relationship: ObjectiveRelationship }) {
  const source = objectives.find((item) => item.id === relationship.sourceObjectiveId)?.name ?? 'Origen'
  const target = objectives.find((item) => item.id === relationship.targetObjectiveId)?.name ?? 'Destino'
  return <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${relationship.approved ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{source}<ArrowRight className="size-3" aria-hidden="true" />{target}<button aria-label={`Eliminar relación ${source} a ${target}`} className="ml-1 hover:text-red-600" onClick={onDelete} type="button"><Trash2 className="size-3" aria-hidden="true" /></button></span>
}

function ModalActions({ onClose, onDelete }: { onClose: () => void; onDelete?: () => void }) { return <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">{onDelete ? <button className="text-sm font-bold text-red-600" onClick={onDelete} type="button">Eliminar</button> : <span />}<div className="flex gap-2"><button className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500" onClick={onClose} type="button">Cancelar</button><button className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white" type="submit"><CheckCircle2 className="size-4" aria-hidden="true" />Guardar</button></div></div> }
function Field({ label, onChange, required, value }: { label: string; onChange: (value: string) => void; required?: boolean; value: string }) { return <label className="text-sm font-bold text-slate-700">{label}{required ? ' *' : ''}<input className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} required={required} value={value} /></label> }
function NumberField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: number | null }) { return <label className="text-sm font-bold text-slate-700">{label}<input className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} step="any" type="number" value={value ?? ''} /></label> }
function TextArea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) { return <label className="text-sm font-bold text-slate-700">{label}<textarea className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} rows={3} value={value} /></label> }
function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: Array<readonly [string, string]>; value: string }) { return <label className="text-sm font-bold text-slate-700">{label}<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([optionValue, labelValue]) => <option key={optionValue} value={optionValue}>{labelValue}</option>)}</select></label> }
function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div> }
function MetricCell({ unit, value }: { unit: string; value: number | null }) { return <td className="px-4 py-4 text-sm font-bold text-slate-700">{value === null ? '—' : `${formatNumber(value)} ${unit}`}</td> }
function formatNumber(value: number) { return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(value) }
