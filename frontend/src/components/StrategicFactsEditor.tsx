import { Plus, Trash2 } from 'lucide-react'
import type { StrategicFact, StrategicImpact } from '../types/models'

interface StrategicFactsEditorProps {
  facts: StrategicFact[]
  onAdd: () => void
  onChange: (id: string, changes: Partial<StrategicFact>) => void
  onRemove: (id: string) => void
}

const fieldClassName = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'

export function StrategicFactsEditor({ facts, onAdd, onChange, onRemove }: StrategicFactsEditorProps) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Hechos estratégicos críticos</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Registra evidencia, incertidumbre y la decisión que exige cada hecho.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:border-cyan-300 hover:text-cyan-700" onClick={onAdd} type="button">
          <Plus className="size-4" aria-hidden="true" />Agregar hecho
        </button>
      </div>

      {facts.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">Aún no hay hechos críticos. Puedes agregarlos manualmente o incorporar un diagnóstico de IA aprobado.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {facts.map((fact, index) => (
            <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4" key={fact.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">Hecho {index + 1}</p>
                <button aria-label={`Eliminar hecho ${index + 1}`} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => onRemove(fact.id)} type="button"><Trash2 className="size-4" aria-hidden="true" /></button>
              </div>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <TextArea label="Hecho" onChange={(value) => onChange(fact.id, { fact: value })} value={fact.fact} />
                <TextArea label="Evidencia disponible" onChange={(value) => onChange(fact.id, { evidence: value })} value={fact.evidence} />
                <TextArea label="Explicación e impacto" onChange={(value) => onChange(fact.id, { explanation: value })} value={fact.explanation} />
                <TextArea label="Incertidumbre pendiente" onChange={(value) => onChange(fact.id, { uncertainty: value })} value={fact.uncertainty} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-bold text-slate-700">Impacto
                  <select className={fieldClassName} onChange={(event) => onChange(fact.id, { impact: event.target.value as StrategicImpact })} value={fact.impact}>
                    <option value="LOW">Bajo</option><option value="MEDIUM">Medio</option><option value="HIGH">Alto</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">Confianza ({Math.round(fact.confidence * 100)} %)
                  <input aria-label={`Confianza del hecho ${index + 1}`} className="mt-4 w-full accent-cyan-600" max="1" min="0" onChange={(event) => onChange(fact.id, { confidence: Number(event.target.value) })} step="0.05" type="range" value={fact.confidence} />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2 xl:col-span-1">Fuente
                  <input className={fieldClassName} onChange={(event) => onChange(fact.id, { source: event.target.value })} placeholder="Documento, entrevista o sistema" value={fact.source} />
                </label>
                <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-bold text-slate-700">
                  <input checked={fact.decisionRequired} className="size-4 accent-cyan-600" onChange={(event) => onChange(fact.id, { decisionRequired: event.target.checked })} type="checkbox" />Requiere decisión
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function TextArea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <label className="text-sm font-bold text-slate-700">{label}<textarea className={fieldClassName} onChange={(event) => onChange(event.target.value)} rows={3} value={value} /></label>
}
