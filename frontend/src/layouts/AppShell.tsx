import { Bell, Menu, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { NavigationItem } from '../App'
import { Sidebar } from '../components/Sidebar'

interface AppShellProps {
  activeItem: NavigationItem
  children: ReactNode
  onNavigate: (item: NavigationItem) => void
}

export function AppShell({ activeItem, children, onNavigate }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <Sidebar activeItem={activeItem} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={onNavigate} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
          <button aria-label="Abrir menú" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden" onClick={() => setIsSidebarOpen(true)} type="button">
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Panel ejecutivo</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-700">Gestión y Control Estratégico IA</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button aria-label="Buscar" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800" type="button"><Search className="size-[18px]" aria-hidden="true" /></button>
            <button aria-label="Notificaciones" className="relative grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800" type="button">
              <Bell className="size-[18px]" aria-hidden="true" /><span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-cyan-brand ring-2 ring-white" />
            </button>
            <div className="ml-1 flex items-center gap-3 border-l border-slate-200 pl-3">
              <span className="grid size-10 place-items-center rounded-xl bg-navy-900 text-xs font-bold text-white">ML</span>
              <div className="hidden md:block"><p className="text-sm font-bold text-slate-800">Equipo estratégico</p><p className="text-xs text-slate-400">Administrador</p></div>
            </div>
          </div>
        </header>
        <main className="px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
