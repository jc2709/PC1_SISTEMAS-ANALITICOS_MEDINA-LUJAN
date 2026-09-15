import { useState, type FormEvent } from 'react'
import { validatePlan, type ValidationErrors } from '../services/workspaceService'
import type { Organization, StrategicPlan, StrategicPlanInput, StrategicPlanStatus } from '../types/models'
import { FormField } from './FormField'
import { Modal } from './Modal'

interface PlanFormModalProps {
  onClose: () => void
  onSave: (input: StrategicPlanInput) => Promise<void>
  organizations: Organization[]
  plan?: StrategicPlan
  preferredOrganizationId?: string
}

export function PlanFormModal({ onClose, onSave, organizations, plan, preferredOrganizationId }: PlanFormModalProps) {
  const currentYear = new Date().getFullYear()
  const [form, setForm] = useState<StrategicPlanInput>(() => plan ? planToInput(plan) : {
    organizationId: preferredOrganizationId ?? organizations[0]?.id ?? '',
    name: '',
    startYear: currentYear + 1,
    endYear: currentYear + 3,
    status: 'DRAFT',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validatePlan(form)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(form)
    } catch {
      setSaveError('No se pudo guardar el plan. Inténtalo nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal description="Define el periodo y estado inicial del plan vinculado a una organización." isOpen onClose={onClose} title={plan ? 'Editar plan estratégico' : 'Nuevo plan estratégico'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-5 p-6 sm:p-8">
          <label className="block text-sm font-bold text-slate-700">
            Organización<span className="ml-1 text-red-500">*</span>
            <select aria-invalid={Boolean(errors.organizationId)} className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none focus:ring-4 ${errors.organizationId ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-100'}`} onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))} value={form.organizationId}>
              <option value="">Selecciona una organización</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
            {errors.organizationId ? <span className="mt-1.5 block text-xs text-red-600">{errors.organizationId}</span> : null}
          </label>
          <FormField error={errors.name} label="Nombre del plan" maxLength={120} name="name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Plan Estratégico 2027–2029" required value={form.name} />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField error={errors.startYear} label="Año inicial" name="startYear" onChange={(event) => setForm((current) => ({ ...current, startYear: Number(event.target.value) }))} required type="number" value={form.startYear} />
            <FormField error={errors.endYear} label="Año final" name="endYear" onChange={(event) => setForm((current) => ({ ...current, endYear: Number(event.target.value) }))} required type="number" value={form.endYear} />
          </div>
          <label className="block text-sm font-bold text-slate-700">
            Estado
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StrategicPlanStatus }))} value={form.status}>
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">Activo</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </label>
          {saveError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{saveError}</p> : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-5 sm:px-8">
          <button className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50" disabled={isSaving} onClick={onClose} type="button">Cancelar</button>
          <button className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-950 disabled:cursor-wait disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}</button>
        </div>
      </form>
    </Modal>
  )
}

function planToInput(plan: StrategicPlan): StrategicPlanInput {
  return {
    organizationId: plan.organizationId,
    name: plan.name,
    startYear: plan.startYear,
    endYear: plan.endYear,
    status: plan.status,
  }
}
