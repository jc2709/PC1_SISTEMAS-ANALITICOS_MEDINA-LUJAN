import { ArrowUpRight, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  description: string
  accent: string
}

export function StatCard({ icon: Icon, label, value, description, accent }: StatCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200/70"><Icon className="size-5" aria-hidden="true" /></span>
        <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-cyan-600" aria-hidden="true" />
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <h2 className="mt-1 text-sm font-bold text-slate-700">{label}</h2>
      <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
    </article>
  )
}
