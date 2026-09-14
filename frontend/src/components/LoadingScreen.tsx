import { ChartNoAxesCombined } from 'lucide-react'

export function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-navy-950 px-6 text-center text-white">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-brand text-navy-950 shadow-[0_12px_34px_rgba(35,200,200,0.3)]">
          <ChartNoAxesCombined className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-lg font-bold tracking-wide">Gestión Estratégica IA</h1>
        <p className="mt-2 text-sm text-slate-400">Preparando tu espacio local…</p>
      </div>
    </main>
  )
}
