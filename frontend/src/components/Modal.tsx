import { X } from 'lucide-react'
import { useEffect, useId, type ReactNode } from 'react'

interface ModalProps {
  children: ReactNode
  description?: string
  isOpen: boolean
  onClose: () => void
  title: string
  width?: 'medium' | 'large'
}

export function Modal({ children, description, isOpen, onClose, title, width = 'medium' }: ModalProps) {
  const titleId = useId()
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy-950/65 p-4 backdrop-blur-sm" role="dialog">
      <div className={`my-6 w-full overflow-hidden rounded-3xl bg-white shadow-2xl ${width === 'large' ? 'max-w-5xl' : 'max-w-xl'}`}>
        <div className="flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950" id={titleId}>{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button aria-label="Cerrar" className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={onClose} type="button">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
