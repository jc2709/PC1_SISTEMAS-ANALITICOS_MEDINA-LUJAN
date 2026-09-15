import { Calculator, CheckCircle2, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PlanContextSelector } from '../components/PlanContextSelector'
import {
  computeFinancialOutputs,
  createEmptyControlWorkspace,
  createSimulationRun,
  defaultFinancialInputs,
  getScenarioInputs,
  toControlWorkspaceInput,
} from '../services/controlService'
import type { ControlWorkspace, ControlWorkspaceInput, FinancialInputs, Organization, ScenarioKind, StrategicPlan } from '../types/models'

interface SimulationPageProps {
  controlWorkspaces: ControlWorkspace[]
  onSave: (input: ControlWorkspaceInput, existing?: ControlWorkspace) => Promise<ControlWorkspace>
  organizations: Organization[]
  plans: StrategicPlan[]
}

const SCENARIOS: Array<{ id: ScenarioKind; label: string; description: string }> = [
  { id: 'BASE', label: 'Base', description: 'Continuidad de supuestos actuales' },
  { id: 'PROTECTION', label: 'Protección', description: 'Preserva caja ante contracción' },
  { id: 'EXPANSION', label: 'Expansión', description: 'Acelera crecimiento e inversión' },
  { id: 'CUSTOM', label: 'Personalizado', description: 'Variables definidas por el usuario' },
]

export function SimulationPage({ controlWorkspaces, onSave, organizations, plans }: SimulationPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [scenario, setScenario] = useState<ScenarioKind>('BASE')
  const [period, setPeriod] = useState(String(new Date().getFullYear()))
  const [inputs, setInputs] = useState<FinancialInputs>(defaultFinancialInputs)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const effectivePlanId = plans.some((plan) => plan.id === selectedPlanId) ? selectedPlanId : plans[0]?.id ?? ''
  const plan = plans.find((item) => item.id === effectivePlanId)
  const workspace = controlWorkspaces.find((item) => item.planId === effectivePlanId)
  const workspaceInput = workspace ? toControlWorkspaceInput(workspace) : createEmptyControlWorkspace(plan?.organizationId ?? '', effectivePlanId)
  const latestBase = findLatestBase(workspaceInput)
  const baseInputs = latestBase?.inputs ?? defaultFinancialInputs()
  const baseOutputs = computeFinancialOutputs(baseInputs)
  const outputs = computeFinancialOutputs(inputs)

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId)
    const selectedWorkspace = controlWorkspaces.find((item) => item.planId === planId)
    const selectedBase = selectedWorkspace?.simulations.filter((item) => item.scenario === 'BASE').at(-1)?.inputs ?? defaultFinancialInputs()
    setScenario('BASE')
    setInputs(structuredClone(selectedBase))
    setNotice(null)
  }

  const selectScenario = (nextScenario: ScenarioKind) => {
    setScenario(nextScenario)
    setInputs(getScenarioInputs(nextScenario, baseInputs))
    setNotice(null)
  }

  const saveSimulation = async () => {
    if (!period.trim()) { setError('Ingresa el periodo de la simulación.'); return }
    try {
      const run = createSimulationRun(period, scenario, inputs)
      await onSave({ ...workspaceInput, simulations: [...workspaceInput.simulations, run] }, workspace)
      setNotice(`Escenario ${SCENARIOS.find((item) => item.id === scenario)?.label} guardado para ${period}.`)
      setError(null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo guardar la simulación.')
    }
  }

  const deleteSimulation = async (id: string) => {
    if (!window.confirm('¿Eliminar este escenario guardado?')) return
    try {
      await onSave({ ...workspaceInput, simulations: workspaceInput.simulations.filter((run) => run.id !== id) }, workspace)
      setNotice('Simulación eliminada.')
      setError(null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo eliminar la simulación.')
    }
  }

  const updateInput = (field: keyof FinancialInputs, value: string) => setInputs((current) => ({ ...current, [field]: Number(value) }))
  const comparisons = [
    ['Ventas', baseInputs.sales, inputs.sales, 'S/'], ['EBIT', baseInputs.ebit, inputs.ebit, 'S/'],
    ['NOPAT', baseOutputs.nopat, outputs.nopat, 'S/'], ['ROIC', baseOutputs.roic, outputs.roic, '%'],
    ['EVA', baseOutputs.eva, outputs.eva, 'S/'], ['OTIF', baseInputs.otif, inputs.otif, '%'],
    ['WAPE', baseInputs.wape, inputs.wape, '%'], ['OEE', baseInputs.oee, inputs.oee, '%'],
  ] as const

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Fase 8 · Simulador determinístico</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Simulación multiperiodo y multiescenario</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Compara Base, Protección, Expansión o un caso personalizado y recalcula valor económico.</p></div><div className="w-full xl:w-auto"><PlanContextSelector onChange={handlePlanChange} organizations={organizations} plans={plans} selectedPlanId={effectivePlanId} /></div></div>
      {notice ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{notice}</p> : null}
      {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}
      {plan ? <div className="mt-7 grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-cyan-soft text-cyan-700"><Calculator className="size-5" aria-hidden="true" /></span><div><h2 className="text-lg font-bold text-slate-900">Variables</h2><p className="text-xs text-slate-400">El cálculo ocurre localmente.</p></div></div>
          <label className="mt-5 block text-sm font-bold text-slate-700">Periodo<input className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => setPeriod(event.target.value)} placeholder="2027 o 2027-T1" value={period} /></label>
          <div className="mt-4 grid grid-cols-2 gap-2">{SCENARIOS.map((item) => <button className={`rounded-xl border p-3 text-left ${scenario === item.id ? 'border-cyan-500 bg-cyan-50 text-cyan-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} key={item.id} onClick={() => selectScenario(item.id)} type="button"><span className="block text-sm font-bold">{item.label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-400">{item.description}</span></button>)}</div>
          <div className="mt-5 grid grid-cols-2 gap-3"><NumberInput label="Ventas (S/)" onChange={(value) => updateInput('sales', value)} value={inputs.sales} /><NumberInput label="EBIT (S/)" onChange={(value) => updateInput('ebit', value)} value={inputs.ebit} /><NumberInput label="Tasa fiscal (%)" onChange={(value) => updateInput('taxRate', value)} value={inputs.taxRate} /><NumberInput label="WACC (%)" onChange={(value) => updateInput('wacc', value)} value={inputs.wacc} /><div className="col-span-2"><NumberInput label="Capital invertido (S/)" onChange={(value) => updateInput('investedCapital', value)} value={inputs.investedCapital} /></div><NumberInput label="OTIF (%)" onChange={(value) => updateInput('otif', value)} value={inputs.otif} /><NumberInput label="WAPE (%)" onChange={(value) => updateInput('wape', value)} value={inputs.wape} /><NumberInput label="OEE (%)" onChange={(value) => updateInput('oee', value)} value={inputs.oee} /></div>
          <div className="mt-5 flex gap-2"><button className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => setInputs(getScenarioInputs(scenario, baseInputs))} title="Restablecer escenario" type="button"><RefreshCw className="size-4" aria-hidden="true" /></button><button className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-bold text-white" onClick={() => void saveSimulation()} type="button"><Save className="size-4" aria-hidden="true" />Guardar simulación</button></div>
        </section>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3"><ResultCard label="NOPAT" unit="S/" value={outputs.nopat} /><ResultCard label="ROIC" unit="%" value={outputs.roic} /><ResultCard label="EVA" unit="S/" value={outputs.eva} accent /></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7"><div><h2 className="text-xl font-bold text-slate-950">Comparación con Base</h2><p className="mt-1 text-sm text-slate-500">Valor actual, modificado y variación absoluta y porcentual.</p></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-4 py-3">Indicador</th><th className="px-4 py-3">Base</th><th className="px-4 py-3">Modificado</th><th className="px-4 py-3">Diferencia</th><th className="px-4 py-3">Variación</th></tr></thead><tbody className="divide-y divide-slate-100">{comparisons.map(([label, base, modified, unit]) => { const difference = modified - base; const percentage = base === 0 ? 0 : (difference / Math.abs(base)) * 100; return <tr key={label}><td className="px-4 py-4 font-bold text-slate-800">{label}</td><td className="px-4 py-4 text-sm text-slate-600">{formatValue(base, unit)}</td><td className="px-4 py-4 text-sm font-bold text-slate-800">{formatValue(modified, unit)}</td><td className={`px-4 py-4 text-sm font-bold ${difference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatSigned(difference, unit)}</td><td className={`px-4 py-4 text-sm font-bold ${percentage >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%</td></tr> })}</tbody></table></div></div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cyan-700" aria-hidden="true" /><div><p className="font-bold text-cyan-950">Fórmulas auditables</p><p className="mt-1 text-sm leading-6 text-cyan-800">NOPAT = EBIT × (1 − tasa); ROIC = NOPAT / capital invertido; EVA = NOPAT − (WACC × capital invertido).</p></div></div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7"><div><h2 className="text-xl font-bold text-slate-950">Historial multiperiodo</h2><p className="mt-1 text-sm text-slate-500">Escenarios guardados para comparar periodos y conservar trazabilidad.</p></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-4 py-3">Periodo</th><th className="px-4 py-3">Escenario</th><th className="px-4 py-3">NOPAT</th><th className="px-4 py-3">ROIC</th><th className="px-4 py-3">EVA</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{workspaceInput.simulations.toReversed().map((run) => <tr key={run.id}><td className="px-4 py-4 font-bold text-slate-800">{run.period}</td><td className="px-4 py-4 text-sm text-slate-600">{SCENARIOS.find((item) => item.id === run.scenario)?.label}</td><td className="px-4 py-4 text-sm text-slate-600">S/ {formatNumber(run.outputs.nopat)}</td><td className="px-4 py-4 text-sm text-slate-600">{formatNumber(run.outputs.roic)}%</td><td className="px-4 py-4 text-sm font-bold text-slate-800">S/ {formatNumber(run.outputs.eva)}</td><td className="px-4 py-4 text-right"><button aria-label={`Eliminar simulación ${run.period} ${run.scenario}`} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => void deleteSimulation(run.id)} type="button"><Trash2 className="size-4" aria-hidden="true" /></button></td></tr>)}</tbody></table>{workspaceInput.simulations.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">Aún no hay escenarios guardados.</p> : null}</div></div>
        </section>
      </div> : null}
    </div>
  )
}

function findLatestBase(workspace: ControlWorkspaceInput) { let latest = null as ControlWorkspaceInput['simulations'][number] | null; for (const run of workspace.simulations) if (run.scenario === 'BASE' && (!latest || run.createdAt > latest.createdAt)) latest = run; return latest }
function NumberInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: number }) { return <label className="text-xs font-bold text-slate-600">{label}<input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} step="any" type="number" value={value} /></label> }
function ResultCard({ accent, label, unit, value }: { accent?: boolean; label: string; unit: string; value: number }) { return <div className={`rounded-2xl p-5 ${accent ? 'bg-navy-900 text-white' : 'border border-slate-200 bg-white'}`}><p className={`text-xs font-bold uppercase tracking-[0.12em] ${accent ? 'text-cyan-300' : 'text-slate-400'}`}>{label}</p><p className="mt-2 text-2xl font-bold">{unit === 'S/' ? 'S/ ' : ''}{formatNumber(value)}{unit === '%' ? '%' : ''}</p></div> }
function formatNumber(value: number) { return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(value) }
function formatValue(value: number, unit: string) { return unit === 'S/' ? `S/ ${formatNumber(value)}` : `${formatNumber(value)}${unit}` }
function formatSigned(value: number, unit: string) { const sign = value >= 0 ? '+' : ''; return unit === 'S/' ? `${sign}S/ ${formatNumber(value)}` : `${sign}${formatNumber(value)}${unit}` }
