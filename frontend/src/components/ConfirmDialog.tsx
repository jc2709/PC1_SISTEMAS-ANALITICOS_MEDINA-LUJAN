import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  confirmLabel?: string
  description: string
  isBusy?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export function ConfirmDialog({ confirmLabel = 'Eliminar', description, isBusy = false, isOpen, onCancel, onConfirm, title }: ConfirmDialogProps) {
  return (
    <Modal description="Esta acción requiere confirmación." isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="p-6 sm:p-8">
        <div className="flex gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-6">{description}</p>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50" disabled={isBusy} onClick={onCancel} type="button">Cancelar</button>
          <button className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60" disabled={isBusy} onClick={onConfirm} type="button">{isBusy ? 'Eliminando…' : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  )
}
