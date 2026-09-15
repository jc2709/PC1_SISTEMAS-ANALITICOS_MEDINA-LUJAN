import { useState, type FormEvent } from 'react'
import type { StrategicAnalysisContent } from '../types/models'
import { FormField } from './FormField'
import { Modal } from './Modal'

interface AIProposalEditorProps {
  content: StrategicAnalysisContent
  onClose: () => void
  onSave: (content: StrategicAnalysisContent) => Promise<void>
}

export function AIProposalEditor({ content, onClose, onSave }: AIProposalEditorProps) {
  const [form, setForm] = useState(() => ({
    executiveSummary: content.executiveSummary,
    strengths: content.strengths.join('\n'),
    risks: content.risks.join('\n'),
    priorities: content.priorities.join('\n'),
  }))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const strengths = parseLines(form.strengths)
    const risks = parseLines(form.risks)
    const priorities = parseLines(form.priorities)
    if (!form.executiveSummary.trim() || strengths.length === 0 || risks.length === 0 || priorities.length === 0) {
      setError('Completa el resumen y conserva al menos un elemento en cada lista.')
      return
    }
    setIsSaving(true)
    try {
      await onSave({ ...content, executiveSummary: form.executiveSummary.trim(), strengths, risks, priorities })
      onClose()
    } catch {
      setError('No se pudo guardar la edición. Inténtalo nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Editar propuesta de IA" width="large">
      <form className="space-y-5 p-6 sm:p-8" onSubmit={(event) => void handleSubmit(event)}>
        <FormField label="Resumen ejecutivo" name="executiveSummary" onChange={(event) => setForm((current) => ({ ...current, executiveSummary: event.target.value }))} required rows={5} value={form.executiveSummary} />
        <div className="grid gap-4 md:grid-cols-3">
          <ListEditor label="Fortalezas" onChange={(strengths) => setForm((current) => ({ ...current, strengths }))} value={form.strengths} />
          <ListEditor label="Riesgos" onChange={(risks) => setForm((current) => ({ ...current, risks }))} value={form.risks} />
          <ListEditor label="Prioridades" onChange={(priorities) => setForm((current) => ({ ...current, priorities }))} value={form.priorities} />
        </div>
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={onClose} type="button">Cancelar</button>
          <button className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" disabled={isSaving} type="submit">{isSaving ? 'Guardando…' : 'Guardar edición'}</button>
        </div>
      </form>
    </Modal>
  )
}

function ListEditor({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <FormField hint="Un elemento por línea" label={label} name={label.toLocaleLowerCase()} onChange={(event) => onChange(event.target.value)} required rows={6} value={value} />
  )
}

function parseLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}
