import { BarChart3, Building2, ClipboardList, Flag, Sparkles, Target } from 'lucide-react'
import type { NavigationItem } from '../App'
import { StatCard } from '../components/StatCard'
import { StorageBadge } from '../components/StorageBadge'
import type { StorageMode } from '../storage/StorageProvider'

interface HomePageProps { selectedSection: NavigationItem; storageMode: StorageMode }

const stats = [
  { label: 'Organizaciones', icon: Building2, description: 'Entidades registradas', accent: 'bg-cyan-brand' },
  { label: 'Planes activos', icon: ClipboardList, description: 'Planes en ejecución', accent: 'bg-blue-500' },
  { label: 'Objetivos', icon: Target, description: 'Objetivos estratégicos', accent: 'bg-violet-500' },
  { label: 'KPI', icon: BarChart3, description: 'Indicadores monitoreados', accent: 'bg-amber-400' },
  { label: 'Iniciativas', icon: Flag, description: 'Iniciativas estratégicas', accent: 'bg-emerald-500' },
] as const

export function HomePage({ selectedSection, storageMode }: HomePageProps) {
  const isFutureSection = selectedSection !== 'Inicio'

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700"><span className="h-px w-7 bg-cyan-brand" />Vista general</div>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">GESTIÓN Y CONTROL ESTRATÉGICO IA</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">Planeamiento Estratégico y Balanced Scorecard asistidos por Inteligencia Artificial</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StorageBadge mode={storageMode} />
          <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm"><span className="size-2 rounded-full bg-slate-400" />IA: No configurada</div>
        </div>
      </div>

      {isFutureSection ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-soft px-4 py-3 text-sm text-cyan-900" role="status">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />
          <p><span className="font-bold">{selectedSection}</span> está planificada para una fase posterior. Inicio es la única vista funcional en esta entrega.</p>
        </div>
      ) : null}

      <section aria-labelledby="summary-title" className="mt-9">
        <div className="flex items-center justify-between">
          <div><h2 id="summary-title" className="text-lg font-bold text-slate-900">Resumen estratégico</h2><p className="mt-1 text-sm text-slate-400">Indicadores principales del espacio de trabajo</p></div>
          <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-400 ring-1 ring-slate-200">Sin datos aún</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => <StatCard {...stat} key={stat.label} value={0} />)}
        </div>
      </section>

      <section className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="relative min-h-72 overflow-hidden rounded-3xl bg-navy-900 p-7 text-white shadow-[0_18px_50px_rgba(7,20,38,0.18)] sm:p-9">
          <div className="absolute -right-20 -top-28 size-80 rounded-full border-[54px] border-cyan-brand/10" />
          <div className="relative max-w-xl">
            <span className="inline-flex rounded-full bg-cyan-brand/15 px-3 py-1.5 text-xs font-bold text-cyan-300 ring-1 ring-cyan-brand/20">FASE 1 · BASE LOCAL</span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Tu espacio estratégico ya recuerda tus preferencias.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">La navegación y la configuración visual se guardan localmente en este dispositivo, sin enviar información a servicios externos.</p>
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Estado del sistema</p>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Base operativa</h2>
          <div className="mt-6 space-y-5">
            {[
              ['Interfaz principal', 'Disponible'],
              ['Modelos iniciales', 'Preparados'],
              ['Persistencia local', 'Disponible'],
            ].map(([label, status]) => (
              <div className="flex items-center justify-between gap-4" key={label}>
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
