import { ArrowLeft, Bot, CheckCircle2, ClipboardCheck, Compass, FileSearch, Flag, Save, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormField } from '../components/FormField'
import { ListField } from '../components/ListField'
import { StrategicFactsEditor } from '../components/StrategicFactsEditor'
import {
  createEmptyPlanning,
  createStrategicFact,
  importApprovedAnalysis,
} from '../services/planningService'
import type {
  AIInteraction,
  MissionDesign,
  Organization,
  PlanningSection,
  PlanningSectionStatus,
  StrategicFact,
  StrategicPlan,
  StrategicPlanning,
  StrategicPlanningInput,
} from '../types/models'

interface StrategicPlanningPageProps {
  aiInteractions: AIInteraction[]
  existing?: StrategicPlanning
  onBack: () => void
  onSave: (input: StrategicPlanningInput, existing?: StrategicPlanning) => Promise<StrategicPlanning>
  organization: Organization
  plan: StrategicPlan
}

const SECTIONS: Array<{ id: PlanningSection; label: string; description: string; icon: typeof Compass }> = [
  { id: 'PREPARATION', label: 'Preparación', description: 'Mandato y reto', icon: ClipboardCheck },
  { id: 'DIAGNOSIS', label: 'Diagnóstico', description: 'FODA y hechos', icon: FileSearch },
  { id: 'IDENTITY', label: 'Identidad', description: 'Misión y visión', icon: Flag },
  { id: 'STRATEGY', label: 'Estrategia', description: 'Dónde y cómo ganar', icon: Compass },
]

const STATUS_LABELS: Record<PlanningSectionStatus, string> = {
  DRAFT: 'Borrador',
  IN_REVIEW: 'En revisión',
  APPROVED: 'Aprobado',
}

export function StrategicPlanningPage({ aiInteractions, existing, onBack, onSave, organization, plan }: StrategicPlanningPageProps) {
  const [activeSection, setActiveSection] = useState<PlanningSection>('PREPARATION')
  const [draft, setDraft] = useState<StrategicPlanningInput>(() => existing ? toInput(existing) : createEmptyPlanning(organization.id, plan.id))
  const [savedPlanning, setSavedPlanning] = useState(existing)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latestApprovedAnalysis = useMemo(() => findLatestApprovedAnalysis(aiInteractions), [aiInteractions])

  const updateDraft = (updater: (current: StrategicPlanningInput) => StrategicPlanningInput) => {
    setDraft(updater)
    setIsDirty(true)
    setNotice(null)
    setError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const planning = await onSave(draft, savedPlanning)
      setSavedPlanning(planning)
      setDraft(toInput(planning))
      setIsDirty(false)
      setNotice('Planeamiento guardado correctamente en este dispositivo.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo guardar el planeamiento.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImportAnalysis = () => {
    if (!latestApprovedAnalysis) return
    try {
      updateDraft((current) => importApprovedAnalysis(current, latestApprovedAnalysis))
      setActiveSection('DIAGNOSIS')
      setNotice('Diagnóstico aprobado incorporado al borrador. Revisa los datos y guarda los cambios.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo incorporar el diagnóstico.')
    }
  }

  const updateStatus = (status: PlanningSectionStatus) => {
    updateDraft((current) => ({ ...current, sectionStatuses: { ...current.sectionStatuses, [activeSection]: status } }))
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <button className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cyan-700" onClick={onBack} type="button"><ArrowLeft className="size-4" aria-hidden="true" />Volver a planes</button>

      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Fase 5 · Planeamiento estratégico</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">{plan.name}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{organization.name} · {plan.startYear}–{plan.endYear}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-2 text-xs font-bold ${isDirty ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{isDirty ? 'Cambios sin guardar' : savedPlanning ? 'Guardado' : 'Nuevo borrador'}</span>
          <button className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-navy-950 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={() => void handleSave()} type="button"><Save className="size-4" aria-hidden="true" />{isSaving ? 'Guardando…' : 'Guardar planeamiento'}</button>
        </div>
      </div>

      {notice ? <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{notice}</div> : null}
      {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <div className="mt-7 grid gap-6 xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="self-start rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.04)] xl:sticky xl:top-6" aria-label="Etapas del planeamiento">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${isActive ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`} key={section.id} onClick={() => setActiveSection(section.id)} type="button">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isActive ? 'bg-cyan-brand/20 text-cyan-200' : 'bg-slate-100 text-slate-500'}`}><Icon className="size-5" aria-hidden="true" /></span>
                <span className="min-w-0"><span className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${isActive ? 'text-cyan-200' : 'text-slate-400'}`}>Paso {index + 1} · {STATUS_LABELS[draft.sectionStatuses[section.id]]}</span><span className="mt-0.5 block text-sm font-bold">{section.label}</span><span className={`mt-0.5 block text-xs ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{section.description}</span></span>
              </button>
            )
          })}

          <div className="mt-3 border-t border-slate-100 p-3">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Estado de esta etapa
              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => updateStatus(event.target.value as PlanningSectionStatus)} value={draft.sectionStatuses[activeSection]}>
                <option value="DRAFT">Borrador</option><option value="IN_REVIEW">En revisión</option><option value="APPROVED">Aprobado</option>
              </select>
            </label>
          </div>
        </aside>

        <main className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-7">
          {activeSection === 'PREPARATION' ? <PreparationSection draft={draft} onChange={updateDraft} organization={organization} /> : null}
          {activeSection === 'DIAGNOSIS' ? <DiagnosisSection draft={draft} latestAnalysis={latestApprovedAnalysis} onChange={updateDraft} onImport={handleImportAnalysis} /> : null}
          {activeSection === 'IDENTITY' ? <IdentitySection draft={draft} onChange={updateDraft} organization={organization} /> : null}
          {activeSection === 'STRATEGY' ? <StrategySection draft={draft} onChange={updateDraft} /> : null}
        </main>
      </div>
    </div>
  )
}

interface SectionProps {
  draft: StrategicPlanningInput
  onChange: (updater: (current: StrategicPlanningInput) => StrategicPlanningInput) => void
}

function PreparationSection({ draft, onChange, organization }: SectionProps & { organization: Organization }) {
  return (
    <section>
      <SectionHeading description="Delimita la razón del proceso y la decisión central que debe resolver el plan." eyebrow="Paso 1" title="Preparación estratégica" />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <FormField hint="Qué encargo, necesidad o cambio origina este proceso." label="Mandato estratégico" maxLength={2000} name="mandate" onChange={(event) => onChange((current) => ({ ...current, mandate: event.target.value }))} placeholder="Ej.: definir el crecimiento rentable de los próximos tres años…" rows={7} value={draft.mandate} />
        <FormField hint="Formula una pregunta estratégica concreta que exija una elección." label="Reto estratégico principal" maxLength={1200} name="strategicChallenge" onChange={(event) => onChange((current) => ({ ...current, strategicChallenge: event.target.value }))} placeholder="Ej.: ¿cómo crecer sin deteriorar la calidad del servicio?" rows={7} value={draft.strategicChallenge} />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Contexto registrado</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3"><ContextItem label="Sector" value={organization.sector} /><ContextItem label="Mercados" value={organization.markets.join(', ') || 'Sin registrar'} /><ContextItem label="Clientes" value={organization.customerSegments.join(', ') || 'Sin registrar'} /></div>
      </div>
    </section>
  )
}

function DiagnosisSection({ draft, latestAnalysis, onChange, onImport }: SectionProps & { latestAnalysis: AIInteraction | null; onImport: () => void }) {
  const updateSwot = (field: keyof StrategicPlanningInput['swot'], value: string[]) => onChange((current) => ({ ...current, swot: { ...current.swot, [field]: value } }))
  const updateFact = (id: string, changes: Partial<StrategicFact>) => onChange((current) => ({ ...current, criticalFacts: current.criticalFacts.map((fact) => fact.id === id ? { ...fact, ...changes } : fact) }))
  return (
    <section>
      <SectionHeading description="Convierte información interna y externa en hechos que orienten decisiones." eyebrow="Paso 2" title="Diagnóstico estratégico" />
      <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-cyan-700"><Bot className="size-5" aria-hidden="true" /></span><div><p className="font-bold text-slate-900">Incorporación controlada desde IA</p><p className="mt-1 text-sm leading-6 text-slate-600">{latestAnalysis ? `Disponible: diagnóstico aprobado con ${latestAnalysis.model}. Nada se incorpora hasta que pulses el botón.` : 'No existe todavía un diagnóstico de IA aprobado para este plan. Genéralo y apruébalo desde la sección IA.'}</p></div></div>
          <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={!latestAnalysis} onClick={onImport} type="button"><Sparkles className="size-4" aria-hidden="true" />Incorporar al plan</button>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <ListField hint="Un elemento por línea." label="Fortalezas" name="strengths" onChange={(value) => updateSwot('strengths', value)} placeholder="Capacidad interna favorable" value={draft.swot.strengths} />
        <ListField hint="Un elemento por línea." label="Debilidades" name="weaknesses" onChange={(value) => updateSwot('weaknesses', value)} placeholder="Limitación interna relevante" value={draft.swot.weaknesses} />
        <ListField hint="Un elemento por línea." label="Oportunidades" name="opportunities" onChange={(value) => updateSwot('opportunities', value)} placeholder="Condición externa aprovechable" value={draft.swot.opportunities} />
        <ListField hint="Un elemento por línea." label="Amenazas" name="threats" onChange={(value) => updateSwot('threats', value)} placeholder="Riesgo externo significativo" value={draft.swot.threats} />
      </div>

      <div className="mt-8 border-t border-slate-100 pt-7">
        <StrategicFactsEditor facts={draft.criticalFacts} onAdd={() => onChange((current) => ({ ...current, criticalFacts: [...current.criticalFacts, createStrategicFact()] }))} onChange={updateFact} onRemove={(id) => onChange((current) => ({ ...current, criticalFacts: current.criticalFacts.filter((fact) => fact.id !== id) }))} />
      </div>
    </section>
  )
}

function IdentitySection({ draft, onChange, organization }: SectionProps & { organization: Organization }) {
  const updateMission = (field: keyof MissionDesign, value: string) => onChange((current) => ({ ...current, mission: { ...current.mission, [field]: value } }))
  const importCurrentIdentity = () => onChange((current) => ({ ...current, mission: { ...current.mission, statement: organization.currentMission }, vision: { ...current.vision, statement: organization.currentVision } }))
  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeading description="Diseña una identidad útil para decidir, medir y comunicar prioridades." eyebrow="Paso 3" title="Identidad estratégica" />
        <button className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-700" onClick={importCurrentIdentity} type="button">Usar identidad actual como base</button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <FormField label="Cliente prioritario" name="priorityCustomer" onChange={(event) => updateMission('priorityCustomer', event.target.value)} placeholder="A quién servimos primero" value={draft.mission.priorityCustomer} />
        <FormField label="Necesidad crítica" name="criticalNeed" onChange={(event) => updateMission('criticalNeed', event.target.value)} placeholder="Qué problema importante resolvemos" value={draft.mission.criticalNeed} />
        <FormField label="Oferta de valor" name="offer" onChange={(event) => updateMission('offer', event.target.value)} placeholder="Qué entregamos" value={draft.mission.offer} />
        <FormField label="Resultado verificable" name="verifiableOutcome" onChange={(event) => updateMission('verifiableOutcome', event.target.value)} placeholder="Qué cambio observable producimos" value={draft.mission.verifiableOutcome} />
        <FormField label="Diferenciación" name="differentiation" onChange={(event) => updateMission('differentiation', event.target.value)} placeholder="Por qué nos elegirán" value={draft.mission.differentiation} />
        <FormField label="Capacidades esenciales" name="capabilities" onChange={(event) => updateMission('capabilities', event.target.value)} placeholder="Qué debemos hacer especialmente bien" value={draft.mission.capabilities} />
        <div className="lg:col-span-2"><FormField label="Principios que guían decisiones" name="missionPrinciples" onChange={(event) => updateMission('principles', event.target.value)} placeholder="Criterios no negociables" rows={3} value={draft.mission.principles} /></div>
        <div className="lg:col-span-2"><FormField hint="Síntesis final construida a partir de los campos anteriores." label="Declaración de misión" maxLength={1200} name="missionStatement" onChange={(event) => updateMission('statement', event.target.value)} rows={4} value={draft.mission.statement} /></div>
        <FormField label="Visión" maxLength={1200} name="visionStatement" onChange={(event) => onChange((current) => ({ ...current, vision: { ...current.vision, statement: event.target.value } }))} placeholder="Estado futuro deseado y observable" rows={4} value={draft.vision.statement} />
        <FormField hint="Año o periodo al que apunta la visión." label="Horizonte de visión" name="visionHorizon" onChange={(event) => onChange((current) => ({ ...current, vision: { ...current.vision, horizon: event.target.value } }))} placeholder="Ej.: 2029" value={draft.vision.horizon} />
      </div>
    </section>
  )
}

function StrategySection({ draft, onChange }: SectionProps) {
  return (
    <section>
      <SectionHeading description="Haz explícitas las elecciones que concentrarán recursos y también aquello que no se hará." eyebrow="Paso 4" title="Elección estratégica" />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <FormField label="Dónde competir" name="whereToCompete" onChange={(event) => onChange((current) => ({ ...current, strategy: { ...current.strategy, whereToCompete: event.target.value } }))} placeholder="Clientes, mercados, productos y alcance elegidos" rows={5} value={draft.strategy.whereToCompete} />
        <FormField label="Cómo ganar" name="howToWin" onChange={(event) => onChange((current) => ({ ...current, strategy: { ...current.strategy, howToWin: event.target.value } }))} placeholder="Ventaja y lógica para crear valor" rows={5} value={draft.strategy.howToWin} />
        <ListField hint="Una capacidad por línea." label="Capacidades requeridas" name="requiredCapabilities" onChange={(value) => onChange((current) => ({ ...current, strategy: { ...current.strategy, requiredCapabilities: value } }))} placeholder="Analítica avanzada" value={draft.strategy.requiredCapabilities} />
        <ListField hint="Incluye renuncias concretas: qué no se financiará, atenderá o priorizará." label="Renuncias estratégicas" name="strategicTradeoffs" onChange={(value) => onChange((current) => ({ ...current, strategy: { ...current.strategy, strategicTradeoffs: value } }))} placeholder="No competir por precio bajo" value={draft.strategy.strategicTradeoffs} />
        <div className="lg:col-span-2"><FormField label="Sistema de gestión requerido" name="managementSystem" onChange={(event) => onChange((current) => ({ ...current, strategy: { ...current.strategy, managementSystem: event.target.value } }))} placeholder="Gobierno, ritmos, responsabilidades y mecanismos de seguimiento" rows={4} value={draft.strategy.managementSystem} /></div>
      </div>
    </section>
  )
}

function SectionHeading({ description, eyebrow, title }: { description: string; eyebrow: string; title: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p></div>
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>
}

function findLatestApprovedAnalysis(interactions: AIInteraction[]) {
  let latest: AIInteraction | null = null
  for (const interaction of interactions) {
    if (interaction.status !== 'APPROVED' || !interaction.finalContent) continue
    if (!latest || interaction.updatedAt > latest.updatedAt) latest = interaction
  }
  return latest
}

function toInput(planning: StrategicPlanning): StrategicPlanningInput {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = planning
  return structuredClone(input)
}
