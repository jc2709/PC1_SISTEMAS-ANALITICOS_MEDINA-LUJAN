import { Building2, CheckCircle2, Edit3, Eye, MapPin, Package, Plus, Target, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { OrganizationFormModal } from '../components/OrganizationFormModal'
import { OrganizationDetailsModal } from '../components/OrganizationDetailsModal'
import { StorageBadge } from '../components/StorageBadge'
import type { StorageMode } from '../storage/StorageProvider'
import type { Organization, OrganizationInput, StrategicPlan } from '../types/models'

interface OrganizationsPageProps {
  isLoading: boolean
  mode: StorageMode
  onDelete: (id: Organization['id']) => Promise<void>
  onSave: (input: OrganizationInput, existing?: Organization) => Promise<Organization>
  organizations: Organization[]
  plans: StrategicPlan[]
  warning: string | null
}

export function OrganizationsPage({ isLoading, mode, onDelete, onSave, organizations, plans, warning }: OrganizationsPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
  const [viewingOrganization, setViewingOrganization] = useState<Organization | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)

  const openCreateForm = () => {
    setEditingOrganization(undefined)
    setOperationError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (organization: Organization) => {
    setEditingOrganization(organization)
    setOperationError(null)
    setIsFormOpen(true)
  }

  const handleSave = async (input: OrganizationInput) => {
    const organization = await onSave(input, editingOrganization)
    setIsFormOpen(false)
    setNotice(editingOrganization ? `Se actualizaron los datos de ${organization.name}` : `Se creó ${organization.name}`)
    setOperationError(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setNotice(`Se eliminó ${deleteTarget.name} y sus planes vinculados`)
      setOperationError(null)
      setDeleteTarget(null)
    } catch {
      setOperationError('No se pudo eliminar la organización. Inténtalo nuevamente.')
    } finally {
      setIsDeleting(false)
    }
  }

  const associatedPlanCount = deleteTarget ? plans.filter((plan) => plan.organizationId === deleteTarget.id).length : 0

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Directorio estratégico</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Organizaciones</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Administra varias organizaciones y conserva su contexto estratégico de forma local.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StorageBadge mode={mode} />
          <button className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-navy-950 disabled:cursor-wait disabled:opacity-50" disabled={isLoading} onClick={openCreateForm} type="button"><Plus className="size-4" aria-hidden="true" />Nueva organización</button>
        </div>
      </div>

      {warning ? <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">{warning}</p> : null}
      {notice ? <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status"><CheckCircle2 className="size-4" aria-hidden="true" />{notice}</div> : null}
      {operationError ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{operationError}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Organizaciones" value={organizations.length} />
        <SummaryCard label="Planes vinculados" value={plans.length} />
        <SummaryCard label="Sectores representados" value={new Set(organizations.map((organization) => organization.sector.toLocaleLowerCase())).size} />
      </div>

      <section className="mt-7" aria-label="Listado de organizaciones">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500">Cargando organizaciones…</div>
        ) : organizations.length === 0 ? (
          <EmptyState actionLabel="Crear primera organización" description="Registra una organización para comenzar a crear sus planes estratégicos." icon={Building2} onAction={openCreateForm} title="Aún no hay organizaciones" />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {organizations.map((organization) => {
              const organizationPlans = plans.filter((plan) => plan.organizationId === organization.id)
              return (
                <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-7" key={organization.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan-soft text-cyan-700"><Building2 className="size-5" aria-hidden="true" /></span>
                      <div className="min-w-0"><h2 className="truncate text-lg font-bold text-slate-950">{organization.name}</h2><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">{organization.sector}</p></div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button aria-label={`Ver detalles de ${organization.name}`} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-cyan-soft hover:text-cyan-700" onClick={() => setViewingOrganization(organization)} type="button"><Eye className="size-4" aria-hidden="true" /></button>
                      <button aria-label={`Editar ${organization.name}`} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => openEditForm(organization)} type="button"><Edit3 className="size-4" aria-hidden="true" /></button>
                      <button aria-label={`Eliminar ${organization.name}`} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteTarget(organization)} type="button"><Trash2 className="size-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                  <p className="mt-5 min-h-12 text-sm leading-6 text-slate-500">{organization.description || 'Sin descripción registrada.'}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Detail icon={Package} label="Oferta" value={organization.productsOrServices.slice(0, 3).join(', ') || 'Sin datos'} />
                    <Detail icon={Users} label="Clientes" value={organization.customerSegments.slice(0, 3).join(', ') || 'Sin datos'} />
                    <Detail icon={MapPin} label="Mercados" value={organization.markets.slice(0, 3).join(', ') || 'Sin datos'} />
                    <Detail icon={Target} label="Planes" value={`${organizationPlans.length} registrado${organizationPlans.length === 1 ? '' : 's'}`} />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                    {organization.principles.length > 0 ? organization.principles.slice(0, 4).map((principle) => <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600" key={principle}>{principle}</span>) : <span className="text-xs text-slate-400">Sin principios registrados</span>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {isFormOpen ? <OrganizationFormModal onClose={() => setIsFormOpen(false)} onSave={handleSave} organization={editingOrganization} /> : null}
      {viewingOrganization ? <OrganizationDetailsModal onClose={() => setViewingOrganization(null)} organization={viewingOrganization} plans={plans.filter((plan) => plan.organizationId === viewingOrganization.id)} /> : null}
      <ConfirmDialog description={`Se eliminará ${deleteTarget?.name ?? 'la organización'}${associatedPlanCount > 0 ? ` junto con ${associatedPlanCount} plan${associatedPlanCount === 1 ? '' : 'es'} vinculado${associatedPlanCount === 1 ? '' : 's'}` : ''}. Esta acción no se puede deshacer.`} isBusy={isDeleting} isOpen={Boolean(deleteTarget)} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} title="Eliminar organización" />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>
}

function Detail({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3.5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><Icon className="size-3.5" aria-hidden="true" />{label}</div><p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-slate-700">{value}</p></div>
}
