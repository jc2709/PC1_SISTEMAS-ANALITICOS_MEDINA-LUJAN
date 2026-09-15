import { useState, type ChangeEvent, type FormEvent } from 'react'
import { formatList, parseList, validateOrganization, type ValidationErrors } from '../services/workspaceService'
import type { Organization, OrganizationInput } from '../types/models'
import { FormField } from './FormField'
import { Modal } from './Modal'

interface OrganizationFormModalProps {
  onClose: () => void
  onSave: (input: OrganizationInput) => Promise<void>
  organization?: Organization
}

interface OrganizationFormState {
  name: string
  sector: string
  description: string
  productsOrServices: string
  customerSegments: string
  markets: string
  competitors: string
  currentMission: string
  currentVision: string
  principles: string
  financialInformation: string
  operationalInformation: string
}

const EMPTY_FORM: OrganizationFormState = {
  name: '',
  sector: '',
  description: '',
  productsOrServices: '',
  customerSegments: '',
  markets: '',
  competitors: '',
  currentMission: '',
  currentVision: '',
  principles: '',
  financialInformation: '',
  operationalInformation: '',
}

export function OrganizationFormModal({ onClose, onSave, organization }: OrganizationFormModalProps) {
  const [form, setForm] = useState<OrganizationFormState>(() => organization ? organizationToForm(organization) : EMPTY_FORM)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const input = formToInput(form)
    const nextErrors = validateOrganization(input)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(input)
    } catch {
      setSaveError('No se pudo guardar la organización. Inténtalo nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal description="Registra el contexto necesario para construir sus planes estratégicos." isOpen onClose={onClose} title={organization ? 'Editar organización' : 'Nueva organización'} width="large">
      <form onSubmit={handleSubmit}>
        <div className="max-h-[68vh] space-y-8 overflow-y-auto px-6 py-6 sm:px-8">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">Identificación</h3>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <FormField error={errors.name} label="Nombre" maxLength={120} name="name" onChange={handleChange} placeholder="Ej. AndesPack S.A.C." required value={form.name} />
              <FormField error={errors.sector} label="Sector" maxLength={100} name="sector" onChange={handleChange} placeholder="Ej. Industria manufacturera" required value={form.sector} />
              <div className="md:col-span-2"><FormField error={errors.description} label="Descripción" maxLength={1200} name="description" onChange={handleChange} placeholder="Actividad, tamaño y contexto principal" rows={3} value={form.description} /></div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">Mercado y oferta</h3>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <FormField hint="Separa los elementos con comas o saltos de línea." label="Productos o servicios" name="productsOrServices" onChange={handleChange} placeholder="Empaques industriales" rows={3} value={form.productsOrServices} />
              <FormField hint="Separa los elementos con comas o saltos de línea." label="Segmentos de clientes" name="customerSegments" onChange={handleChange} placeholder="Empresas exportadoras" rows={3} value={form.customerSegments} />
              <FormField label="Mercados" name="markets" onChange={handleChange} placeholder="Perú, región andina" rows={3} value={form.markets} />
              <FormField label="Competidores" name="competitors" onChange={handleChange} placeholder="Competidor A, Competidor B" rows={3} value={form.competitors} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">Identidad estratégica</h3>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <FormField label="Misión actual" name="currentMission" onChange={handleChange} rows={4} value={form.currentMission} />
              <FormField label="Visión actual" name="currentVision" onChange={handleChange} rows={4} value={form.currentVision} />
              <div className="md:col-span-2"><FormField hint="Separa los principios con comas o saltos de línea." label="Principios" name="principles" onChange={handleChange} rows={3} value={form.principles} /></div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">Información base</h3>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <FormField label="Información financiera" name="financialInformation" onChange={handleChange} placeholder="Ventas, márgenes, capital y otros datos disponibles" rows={4} value={form.financialInformation} />
              <FormField label="Información operativa" name="operationalInformation" onChange={handleChange} placeholder="Procesos, capacidad, calidad y otros datos disponibles" rows={4} value={form.operationalInformation} />
            </div>
          </section>
          {saveError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{saveError}</p> : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-5 sm:px-8">
          <button className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50" disabled={isSaving} onClick={onClose} type="button">Cancelar</button>
          <button className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-950 disabled:cursor-wait disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Guardando…' : organization ? 'Guardar cambios' : 'Crear organización'}</button>
        </div>
      </form>
    </Modal>
  )
}

function formToInput(form: OrganizationFormState): OrganizationInput {
  return {
    name: form.name,
    sector: form.sector,
    description: form.description,
    productsOrServices: parseList(form.productsOrServices),
    customerSegments: parseList(form.customerSegments),
    markets: parseList(form.markets),
    competitors: parseList(form.competitors),
    currentMission: form.currentMission,
    currentVision: form.currentVision,
    principles: parseList(form.principles),
    financialInformation: form.financialInformation,
    operationalInformation: form.operationalInformation,
  }
}

function organizationToForm(organization: Organization): OrganizationFormState {
  return {
    name: organization.name,
    sector: organization.sector,
    description: organization.description,
    productsOrServices: formatList(organization.productsOrServices),
    customerSegments: formatList(organization.customerSegments),
    markets: formatList(organization.markets),
    competitors: formatList(organization.competitors),
    currentMission: organization.currentMission,
    currentVision: organization.currentVision,
    principles: formatList(organization.principles),
    financialInformation: organization.financialInformation,
    operationalInformation: organization.operationalInformation,
  }
}
