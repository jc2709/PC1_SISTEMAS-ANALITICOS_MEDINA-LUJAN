import { Bot, Check, CheckCircle2, Clock3, Edit3, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { AIProposalEditor } from '../components/AIProposalEditor'
import { AIStatusBadge } from '../components/AIStatusBadge'
import { createAIInteraction, updateAIInteraction, type AIConnectionState, type StrategicAnalysisRequest, type StrategicAnalysisResult } from '../services/aiService'
import type { AIInteraction, Organization, StrategicAnalysisContent, StrategicPlan } from '../types/models'

interface AIPageProps {
  apiBaseUrl: string
  connection: AIConnectionState
  interactions: AIInteraction[]
  onAnalyze: (input: StrategicAnalysisRequest) => Promise<StrategicAnalysisResult>
  onConfigure: () => void
  onRefresh: () => Promise<AIConnectionState>
  onSaveInteraction: (interaction: AIInteraction) => Promise<AIInteraction>
  organizations: Organization[]
  plans: StrategicPlan[]
}

const statusLabels: Record<AIInteraction['status'], string> = {
  AI_PROPOSED: 'Propuesta de IA',
  USER_EDITED: 'Editada por usuario',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  ERROR: 'Error',
}

export function AIPage({ apiBaseUrl, connection, interactions, onAnalyze, onConfigure, onRefresh, onSaveInteraction, organizations, plans }: AIPageProps) {
  const [organizationId, setOrganizationId] = useState('')
  const [planId, setPlanId] = useState('')
  const [focus, setFocus] = useState('')
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null)
  const [editingInteraction, setEditingInteraction] = useState<AIInteraction | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedOrganization = organizations.find((organization) => organization.id === organizationId) ?? organizations[0]
  const availablePlans = selectedOrganization ? plans.filter((plan) => plan.organizationId === selectedOrganization.id) : []
  const selectedPlan = availablePlans.find((plan) => plan.id === planId) ?? availablePlans[0]
  const orderedInteractions = [...interactions].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const selectedInteraction = interactions.find((interaction) => interaction.id === selectedInteractionId) ?? orderedInteractions[0]
  const canAnalyze = connection.status === 'CONNECTED' && Boolean(selectedOrganization && selectedPlan)

  const handleAnalyze = async () => {
    if (!selectedOrganization || !selectedPlan) return
    setError(null)
    setNotice(null)
    const request = { organization: selectedOrganization, plan: selectedPlan, focus }
    try {
      const result = await onAnalyze(request)
      const interaction = createAIInteraction(request, result)
      await onSaveInteraction(interaction)
      setSelectedInteractionId(interaction.id)
      setNotice('Gemini generó una propuesta. Revísala antes de aprobarla.')
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'IA no disponible temporalmente.')
    }
  }

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedInteraction?.finalContent) return
    const updated = updateAIInteraction(selectedInteraction, decision)
    await onSaveInteraction(updated)
    setNotice(decision === 'APPROVED' ? 'La propuesta fue aprobada por el usuario.' : 'La propuesta fue rechazada. No se modificó el plan estratégico.')
  }

  const handleEditedContent = async (content: StrategicAnalysisContent) => {
    if (!editingInteraction) return
    const updated = updateAIInteraction(editingInteraction, 'USER_EDITED', content)
    await onSaveInteraction(updated)
    setSelectedInteractionId(updated.id)
    setNotice('Se guardó una versión editada por el usuario. Aún puedes aprobarla o rechazarla.')
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Asistencia estratégica segura</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Copiloto IA</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Solicita un diagnóstico inicial estructurado. Gemini propone; tú revisas, editas y decides.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AIStatusBadge status={connection.status} />
          <button aria-label="Verificar conexión de IA" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" disabled={connection.status === 'CHECKING' || connection.status === 'PROCESSING'} onClick={() => void onRefresh()} type="button"><RefreshCw className="size-4" aria-hidden="true" /></button>
        </div>
      </div>

      <div className={`mt-6 rounded-2xl border px-5 py-4 ${connection.status === 'ERROR' || connection.status === 'OFFLINE' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`} role="status">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-bold text-slate-800">{connection.message}</p><p className="mt-1 text-xs text-slate-500">{connection.model ? `Modelo: ${connection.model}` : 'La clave GEMINI_API_KEY nunca se almacena en este dispositivo.'}</p></div>
          {!apiBaseUrl ? <button className="w-fit rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-bold text-white" onClick={onConfigure} type="button">Configurar backend</button> : null}
        </div>
      </div>

      {notice ? <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status"><CheckCircle2 className="size-4" aria-hidden="true" />{notice}</div> : null}
      {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <div className="mt-7 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-7" aria-labelledby="request-title">
          <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-soft text-cyan-700"><Sparkles className="size-5" aria-hidden="true" /></span><div><h2 className="font-bold text-slate-900" id="request-title">Nuevo análisis</h2><p className="mt-1 text-sm leading-5 text-slate-500">Solo se enviarán los datos de la organización y plan que selecciones.</p></div></div>
          {organizations.length === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">Primero registra una organización y un plan estratégico.</p>
          ) : (
            <div className="mt-6 space-y-5">
              <label className="block text-sm font-bold text-slate-700">Organización<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal outline-none focus:border-cyan-brand" onChange={(event) => { setOrganizationId(event.target.value); setPlanId('') }} value={selectedOrganization?.id ?? ''}>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
              <label className="block text-sm font-bold text-slate-700">Plan estratégico<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal outline-none focus:border-cyan-brand" disabled={availablePlans.length === 0} onChange={(event) => setPlanId(event.target.value)} value={selectedPlan?.id ?? ''}>{availablePlans.length === 0 ? <option value="">Sin planes vinculados</option> : availablePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
              <label className="block text-sm font-bold text-slate-700">Enfoque opcional<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-cyan-brand" maxLength={800} onChange={(event) => setFocus(event.target.value)} placeholder="Ej.: crecimiento rentable, eficiencia operativa o expansión regional" value={focus} /></label>
              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />La respuesta se valida antes de mostrarse y nunca modifica automáticamente el plan.</div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-navy-950 disabled:cursor-not-allowed disabled:opacity-45" disabled={!canAnalyze} onClick={() => void handleAnalyze()} type="button"><Bot className="size-4" aria-hidden="true" />{connection.status === 'PROCESSING' ? 'Analizando…' : 'Generar propuesta con Gemini'}</button>
            </div>
          )}
        </section>

        <section aria-labelledby="proposal-title">
          {selectedInteraction?.finalContent ? (
            <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">Propuesta de IA</p><h2 className="mt-1 font-bold text-slate-900" id="proposal-title">Análisis estratégico inicial</h2></div>
                <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{statusLabels[selectedInteraction.status]}</span>
              </div>
              <div className="p-6 sm:p-7">
                <p className="text-sm leading-7 text-slate-700">{selectedInteraction.finalContent.executiveSummary}</p>
                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  <AnalysisList items={selectedInteraction.finalContent.strengths} title="Fortalezas" tone="emerald" />
                  <AnalysisList items={selectedInteraction.finalContent.risks} title="Riesgos" tone="amber" />
                  <AnalysisList items={selectedInteraction.finalContent.priorities} title="Prioridades" tone="cyan" />
                </div>
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Confianza declarada</p><p className="mt-1 text-lg font-bold text-slate-900">{Math.round(selectedInteraction.finalContent.confidence * 100)}%</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={() => setEditingInteraction(selectedInteraction)} type="button"><Edit3 className="size-4" aria-hidden="true" />Editar</button>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50" onClick={() => void handleDecision('REJECTED')} type="button"><X className="size-4" aria-hidden="true" />Rechazar</button>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700" onClick={() => void handleDecision('APPROVED')} type="button"><Check className="size-4" aria-hidden="true" />Aprobar</button>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <div className="grid min-h-96 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Bot className="size-6" aria-hidden="true" /></span><h2 className="mt-5 font-bold text-slate-800" id="proposal-title">Aún no hay propuestas</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Cuando el backend esté configurado, genera un análisis y revísalo antes de incorporarlo a tus decisiones.</p></div></div>
          )}
        </section>
      </div>

      <section className="mt-7 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7" aria-labelledby="history-title">
        <div className="flex items-center gap-3"><Clock3 className="size-5 text-cyan-700" aria-hidden="true" /><div><h2 className="font-bold text-slate-900" id="history-title">Bitácora local</h2><p className="mt-1 text-xs text-slate-500">Fecha, modelo y decisión humana de cada interacción.</p></div></div>
        {orderedInteractions.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">No hay interacciones registradas.</p> : <div className="mt-5 grid gap-3">{orderedInteractions.map((interaction) => <button className={`flex flex-col gap-2 rounded-xl border p-4 text-left sm:flex-row sm:items-center sm:justify-between ${selectedInteraction?.id === interaction.id ? 'border-cyan-brand bg-cyan-soft/50' : 'border-slate-200 hover:bg-slate-50'}`} key={interaction.id} onClick={() => setSelectedInteractionId(interaction.id)} type="button"><div><p className="text-sm font-bold text-slate-800">{plans.find((plan) => plan.id === interaction.planId)?.name ?? 'Plan eliminado'}</p><p className="mt-1 text-xs text-slate-500">{new Date(interaction.createdAt).toLocaleString('es-PE')} · {interaction.model}</p></div><span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{statusLabels[interaction.status]}</span></button>)}</div>}
      </section>

      {editingInteraction?.finalContent ? <AIProposalEditor content={editingInteraction.finalContent} onClose={() => setEditingInteraction(null)} onSave={handleEditedContent} /> : null}
    </div>
  )
}

function AnalysisList({ items, title, tone }: { items: string[]; title: string; tone: 'amber' | 'cyan' | 'emerald' }) {
  const colors = { amber: 'bg-amber-50 text-amber-800', cyan: 'bg-cyan-soft text-cyan-900', emerald: 'bg-emerald-50 text-emerald-800' }
  return <div className={`rounded-2xl p-4 ${colors[tone]}`}><h3 className="text-xs font-bold uppercase tracking-[0.12em]">{title}</h3><ul className="mt-3 space-y-2">{items.map((item) => <li className="text-xs leading-5" key={item}>• {item}</li>)}</ul></div>
}
