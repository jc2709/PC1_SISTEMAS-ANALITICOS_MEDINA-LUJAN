import { Download, FileChartColumn, FileSpreadsheet, FileText, Presentation, Upload, XCircle } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { PlanContextSelector } from '../components/PlanContextSelector'
import { applyImportPreview, downloadImportTemplate, exportPlanExcel, exportPlanPdf, exportPlanPowerPoint, parseImportWorkbook, type ImportPreview } from '../services/reportService'
import type { ControlWorkspace, ControlWorkspaceInput, Organization, StrategicPlan, StrategicPlanning } from '../types/models'

interface ReportsPageProps {
  controlWorkspaces: ControlWorkspace[]
  onSave: (input: ControlWorkspaceInput, existing?: ControlWorkspace) => Promise<ControlWorkspace>
  organizations: Organization[]
  plans: StrategicPlan[]
  strategicPlannings: StrategicPlanning[]
}

export function ReportsPage({ controlWorkspaces, onSave, organizations, plans, strategicPlannings }: ReportsPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [fileName, setFileName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const effectivePlanId = plans.some((plan) => plan.id === selectedPlanId) ? selectedPlanId : plans[0]?.id ?? ''
  const plan = plans.find((item) => item.id === effectivePlanId)
  const organization = organizations.find((item) => item.id === plan?.organizationId)
  const planning = strategicPlannings.find((item) => item.planId === effectivePlanId)
  const workspace = controlWorkspaces.find((item) => item.planId === effectivePlanId)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !workspace) return
    setNotice(null); setError(null); setPreview(null); setFileName(file.name)
    try { setPreview(await parseImportWorkbook(await file.arrayBuffer(), workspace)) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo leer el archivo Excel.') }
    finally { event.target.value = '' }
  }

  const handleApply = async () => {
    if (!workspace || !preview) return
    try {
      await onSave(applyImportPreview(workspace, preview), workspace)
      setNotice(`Importación aplicada: ${preview.kpiUpdates.length} KPI y ${preview.initiativeUpdates.length} iniciativas actualizados.`)
      setPreview(null); setFileName(''); setError(null)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo guardar la importación.') }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Fase 11 · Interoperabilidad</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Excel, PowerPoint y reportes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Actualiza resultados mediante una plantilla validada y genera entregables ejecutivos sin enviar datos a servicios externos.</p></div><div className="w-full xl:w-auto"><PlanContextSelector onChange={(value) => { setSelectedPlanId(value); setPreview(null); setFileName('') }} organizations={organizations} plans={plans} selectedPlanId={effectivePlanId} /></div></div>
      {notice ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{notice}</p> : null}
      {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}
      {workspace && plan && organization ? <>
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ExportCard description="Descarga la plantilla con KPI e iniciativas actuales." icon={Download} label="Plantilla Excel" onClick={() => downloadImportTemplate(workspace, plan)} />
          <ExportCard description="Libro completo con objetivos, KPI, iniciativas y simulaciones." icon={FileSpreadsheet} label="Exportar Excel" onClick={() => exportPlanExcel(organization, plan, planning, workspace)} />
          <ExportCard description="Presentación ejecutiva editable con cinco diapositivas." icon={Presentation} label="Exportar PowerPoint" onClick={() => exportPlanPowerPoint(organization, plan, workspace)} />
          <ExportCard description="Informe PDF listo para compartir o imprimir." icon={FileText} label="Generar PDF" onClick={() => void exportPlanPdf(organization, plan, workspace)} />
        </section>
        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Importación controlada</p><h2 className="mt-2 text-xl font-bold text-slate-950">Actualizar KPI e iniciativas desde Excel</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Primero descarga la plantilla. El archivo se analiza localmente y muestra errores por hoja, fila, columna y campo antes de habilitar el guardado.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white" onClick={() => inputRef.current?.click()} type="button"><Upload className="size-4" aria-hidden="true" />Seleccionar Excel</button><input accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => void handleFile(event)} ref={inputRef} type="file" /></div>
          {preview ? <div className="mt-6"><div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-slate-800">{fileName}</p><p className="mt-1 text-xs text-slate-500">{preview.processedRows} filas · {preview.kpiUpdates.length} KPI · {preview.initiativeUpdates.length} iniciativas · {preview.errors.length} errores</p></div><button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45" disabled={preview.errors.length > 0} onClick={() => void handleApply()} type="button">Aplicar importación</button></div>{preview.errors.length > 0 ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-red-50 text-xs font-bold uppercase tracking-[0.1em] text-red-700"><tr><th className="px-4 py-3">Hoja</th><th className="px-4 py-3">Fila</th><th className="px-4 py-3">Columna</th><th className="px-4 py-3">Campo</th><th className="px-4 py-3">Motivo</th></tr></thead><tbody className="divide-y divide-slate-100">{preview.errors.map((item, index) => <tr key={`${item.sheet}-${item.row}-${item.column}-${index}`}><td className="px-4 py-3 text-sm font-bold text-slate-700">{item.sheet}</td><td className="px-4 py-3 text-sm text-slate-600">{item.row}</td><td className="px-4 py-3 text-sm text-slate-600">{item.column}</td><td className="px-4 py-3 text-sm text-slate-600">{item.field}</td><td className="px-4 py-3 text-sm text-red-700">{item.reason}</td></tr>)}</tbody></table></div> : <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><FileChartColumn className="size-5" aria-hidden="true" />Validación superada. Revisa el resumen y aplica los cambios.</div>}</div> : <div className="mt-6 flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 text-center"><div><XCircle className="mx-auto size-7 text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-slate-500">Ningún archivo pendiente de validación.</p></div></div>}
        </section>
      </> : <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><FileSpreadsheet className="mx-auto size-8 text-slate-300" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-800">Sin datos exportables</h2><p className="mt-2 text-sm text-slate-500">Crea un plan y su Balanced Scorecard para activar los reportes.</p></div>}
    </div>
  )
}

function ExportCard({ description, icon: Icon, label, onClick }: { description: string; icon: typeof Download; label: string; onClick: () => void }) { return <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5"><span className="grid size-11 place-items-center rounded-xl bg-cyan-soft text-cyan-700"><Icon className="size-5" aria-hidden="true" /></span><h2 className="mt-4 font-bold text-slate-900">{label}</h2><p className="mt-2 flex-1 text-xs leading-5 text-slate-500">{description}</p><button className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-cyan-300 hover:text-cyan-800" onClick={onClick} type="button">{label}</button></article> }
