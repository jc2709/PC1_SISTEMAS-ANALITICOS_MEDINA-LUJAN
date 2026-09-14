import { BarChart3, Bot, Building2, Gauge, LayoutDashboard, Settings, SlidersHorizontal, Target, X, type LucideIcon } from 'lucide-react'
import type { NavigationItem } from '../App'
import { BrandMark } from './BrandMark'

interface SidebarProps {
  activeItem: NavigationItem
  compact: boolean
  isOpen: boolean
  onClose: () => void
  onNavigate: (item: NavigationItem) => void
}

const navigation: Array<{ label: NavigationItem; icon: LucideIcon }> = [
  { label: 'Inicio', icon: LayoutDashboard },
  { label: 'Organización', icon: Building2 },
  { label: 'Planeamiento', icon: Target },
  { label: 'Balanced Scorecard', icon: BarChart3 },
  { label: 'Simulación', icon: SlidersHorizontal },
  { label: 'Dashboard', icon: Gauge },
  { label: 'IA', icon: Bot },
  { label: 'Configuración', icon: Settings },
]

export function Sidebar({ activeItem, compact, isOpen, onClose, onNavigate }: SidebarProps) {
  const handleNavigate = (item: NavigationItem) => {
    onNavigate(item)
    onClose()
  }

  return (
    <>
      <button aria-label="Cerrar menú" className={`fixed inset-0 z-30 bg-navy-950/55 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} type="button" />
      <aside aria-label="Navegación principal" className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-950 px-5 py-6 text-white shadow-2xl transition-[transform,width] duration-300 lg:translate-x-0 ${compact ? 'lg:w-20 lg:px-3' : 'lg:w-72'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <BrandMark compact={compact} />
          <button aria-label="Cerrar menú" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose} type="button"><X className="size-5" aria-hidden="true" /></button>
        </div>
        <div className={`mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 ${compact ? 'lg:sr-only' : ''}`}>Espacio de trabajo</div>
        <nav className="mt-3 flex flex-1 flex-col gap-1.5">
          {navigation.map(({ label, icon: Icon }) => {
            const isActive = label === activeItem
            return (
              <button aria-label={label} aria-current={isActive ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${compact ? 'lg:justify-center' : ''} ${isActive ? 'bg-cyan-brand text-navy-950 shadow-[0_10px_28px_rgba(35,200,200,0.18)]' : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'}`} key={label} onClick={() => handleNavigate(label)} title={compact ? label : undefined} type="button">
                <Icon className="size-[18px]" aria-hidden="true" strokeWidth={isActive ? 2.4 : 2} />
                <span className={compact ? 'lg:sr-only' : ''}>{label}</span>
                {label !== 'Inicio' ? <span className={`ml-auto size-1.5 rounded-full ${compact ? 'lg:hidden' : ''} ${isActive ? 'bg-navy-950/35' : 'bg-slate-700'}`} /> : null}
              </button>
            )
          })}
        </nav>
        <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 ${compact ? 'lg:p-3' : ''}`} title={compact ? 'IA: No configurada' : undefined}>
          <div className={`flex items-center gap-2 text-xs font-semibold text-slate-300 ${compact ? 'lg:justify-center' : ''}`}><span className="size-2 shrink-0 rounded-full bg-slate-500" /><span className={compact ? 'lg:sr-only' : ''}>IA: No configurada</span></div>
          <p className={`mt-2 text-xs leading-5 text-slate-500 ${compact ? 'lg:sr-only' : ''}`}>La integración segura se habilitará en una fase posterior.</p>
        </div>
      </aside>
    </>
  )
}
