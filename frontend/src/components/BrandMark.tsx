import { ChartNoAxesCombined } from 'lucide-react'

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-brand text-navy-950 shadow-[0_8px_24px_rgba(35,200,200,0.24)]">
        <ChartNoAxesCombined aria-hidden="true" className="size-5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold tracking-[0.08em] text-white">GESTIÓN ESTRATÉGICA</p>
        <p className="text-xs font-semibold tracking-[0.32em] text-cyan-brand">INTELIGENCIA IA</p>
      </div>
    </div>
  )
}
