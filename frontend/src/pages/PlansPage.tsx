import { CalendarRange, CheckCircle2, ClipboardList, Edit3, FilePenLine, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { PlanFormModal } from '../components/PlanFormModal'
import { StorageBadge } from '../components/StorageBadge'
import type { StorageMode } from '../storage/StorageProvider'
import type { Organization, StrategicPlan, StrategicPlanInput, StrategicPlanStatus } from '../types/models'

interface PlansPageProps {
  isLoading: boolean
  mode: StorageMode
  onDelete: (id: StrategicPlan['id']) => Promise<void>
  onOpenPlanning: (plan: StrategicPlan) => void
  onRequestOrganization: () => void
  onSave: (input: StrategicPlanInput, existing?: StrategicPlan) => Promise<StrategicPlan>
  organizations: Organization[]
  plans: StrategicPlan[]
  warning: string | null
}

const STATUS_LABELS: Record<StrategicPlanStatus, string> = { DRAFT: 'Borrador', ACTIVE: 'Activo', ARCHIVED: 'Archivado' }
const STATUS_STYLES: Record<StrategicPlanStatus, string> = { DRAFT: 'bg-amber-50 text-amber-700', ACTIVE: 'bg-emerald-50 text-emerald-700', ARCHIVED: 'bg-slate-100 text-slate-600' }

export function PlansPage({ isLoading, mode, onDelete, onOpenPlanning, onRequestOrganization, onSave, organizations, plans, warning }: PlansPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<StrategicPlan | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<StrategicPlan | null>(null)
  const [organizationFilter, setOrganizationFilter] = useState('ALL')
  const [isDeleting, setIsDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const organizationMap = useMemo(() => new Map(organizations.map((organization) => [organization.id, organization.name])), [organizations])
  const visiblePlans = organizationFilter === 'ALL' ? plans : plans.filter((plan) => plan.organizationId === organizationFilter)

  const openCreateForm = () => {
    setEditingPlan(undefined)
    setOperationError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (plan: StrategicPlan) => {
    setEditingPlan(plan)
    setOperationError(null)
    setIsFormOpen(true)
  }

  const handleSave = async (input: StrategicPlanInput) => {
    const plan = await onSave(input, editingPlan)
    setIsFormOpen(false)
    setNotice(editingPlan ? `Se actualizó ${plan.name}` : `Se creó ${plan.name}`)
    setOperationError(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setNotice(`Se eliminó ${deleteTarget.name}`)
      setOperationError(null)
      setDeleteTarget(null)
    } catch {
      setOperationError('No se pudo eliminar el plan. Inténtalo nuevamente.')
    } finally {
      setIsDeleting(false)
    }
  }

  const activePlans = plans.filter((plan) => plan.status === 'ACTIVE').length

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Portafolio de planes</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Planes estratégicos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Crea periodos de planeamiento independientes para cada organización.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StorageBadge mode={mode} />
          <button className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-navy-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={organizations.length === 0} onClick={openCreateForm} type="button"><Plus className="size-4" aria-hidden="true" />Nuevo plan</button>
        </div>
      </div>

      {warning ? <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">{warning}</p> : null}
      {notice ? <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status"><CheckCircle2 className="size-4" aria-hidden="true" />{notice}</div> : null}
      {operationError ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{operationError}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Planes totales" value={plans.length} />
        <SummaryCard label="Planes activos" value={activePlans} />
        <SummaryCard label="Organizaciones con plan" value={new Set(plans.map((plan) => plan.organizationId)).size} />
      </div>

      {organizations.length > 0 ? (
        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-bold text-slate-800">Filtrar por organización</p><p className="mt-1 text-xs text-slate-400">Muestra el portafolio de una entidad específica.</p></div>
          <select aria-label="Filtrar planes por organización" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" onChange={(event) => setOrganizationFilter(event.target.value)} value={organizationFilter}>
            <option value="ALL">Todas las organizaciones</option>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </div>
      ) : null}

      <section className="mt-7" aria-label="Listado de planes estratégicos">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500">Cargando planes…</div>
        ) : organizations.length === 0 ? (
          <EmptyState actionLabel="Registrar organización" description="Antes de crear un plan necesitas registrar la organización a la que pertenecerá." icon={ClipboardList} onAction={onRequestOrganization} title="Primero crea una organización" />
        ) : visiblePlans.length === 0 ? (
          <EmptyState actionLabel="Crear plan estratégico" description={organizationFilter === 'ALL' ? 'Define el primer periodo de planeamiento para una organización.' : 'La organización seleccionada todavía no tiene planes.'} icon={CalendarRange} onAction={openCreateForm} title="No hay planes para mostrar" />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-6 py-4">Plan</th><th className="px-6 py-4">Organización</th><th className="px-6 py-4">Periodo</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePlans.map((plan) => (
                    <tr className="transition hover:bg-slate-50/70" key={plan.id}>
                      <td className="px-6 py-5"><p className="font-bold text-slate-900">{plan.name}</p><p className="mt-1 text-xs text-slate-400">Actualizado {formatDate(plan.updatedAt)}</p></td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">{organizationMap.get(plan.organizationId) ?? 'Organización no disponible'}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-700">{plan.startYear}–{plan.endYear}</td>
                      <td className="px-6 py-5"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLES[plan.status]}`}>{STATUS_LABELS[plan.status]}</span></td>
                      <td className="px-6 py-5"><div className="flex justify-end gap-1"><button aria-label={`Abrir planeamiento de ${plan.name}`} className="inline-flex items-center gap-2 rounded-xl bg-cyan-soft px-3 py-2 text-xs font-bold text-cyan-800 hover:bg-cyan-100" onClick={() => onOpenPlanning(plan)} type="button"><FilePenLine className="size-4" aria-hidden="true" />Formular</button><button aria-label={`Editar ${plan.name}`} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => openEditForm(plan)} type="button"><Edit3 className="size-4" aria-hidden="true" /></button><button aria-label={`Eliminar ${plan.name}`} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteTarget(plan)} type="button"><Trash2 className="size-4" aria-hidden="true" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {isFormOpen ? <PlanFormModal onClose={() => setIsFormOpen(false)} onSave={handleSave} organizations={organizations} plan={editingPlan} preferredOrganizationId={organizationFilter === 'ALL' ? undefined : organizationFilter} /> : null}
      <ConfirmDialog description={`Se eliminará ${deleteTarget?.name ?? 'el plan'} de forma permanente. La organización vinculada no será eliminada.`} isBusy={isDeleting} isOpen={Boolean(deleteTarget)} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} title="Eliminar plan estratégico" />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}
