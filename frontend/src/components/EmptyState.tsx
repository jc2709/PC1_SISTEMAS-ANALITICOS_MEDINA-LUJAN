import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  actionLabel: string
  description: string
  icon: LucideIcon
  onAction: () => void
  title: string
}

export function EmptyState({ actionLabel, description, icon: Icon, onAction, title }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-soft text-cyan-700"><Icon className="size-6" aria-hidden="true" /></span>
      <h2 className="mt-5 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      <button className="mt-6 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-950" onClick={onAction} type="button">{actionLabel}</button>
    </div>
  )
}
