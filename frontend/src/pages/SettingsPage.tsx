import { CheckCircle2, Database, PanelLeftClose, Server, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { StorageBadge } from '../components/StorageBadge'
import type { StorageMode } from '../storage/StorageProvider'

interface SettingsPageProps {
  compactSidebar: boolean
  aiApiBaseUrl: string
  onAiApiBaseUrlChange: (url: string) => Promise<void>
  onCompactSidebarChange: (compact: boolean) => Promise<void>
  storageMode: StorageMode
}

export function SettingsPage({ aiApiBaseUrl, compactSidebar, onAiApiBaseUrlChange, onCompactSidebarChange, storageMode }: SettingsPageProps) {
  const [apiUrl, setApiUrl] = useState(() => aiApiBaseUrl)
  const [saved, setSaved] = useState(false)

  const handleSaveApiUrl = async () => {
    await onAiApiBaseUrlChange(apiUrl)
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Preferencias locales</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">Configuración</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Personaliza el espacio de trabajo. Los cambios se guardan únicamente en este dispositivo.</p>
        </div>
        <StorageBadge mode={storageMode} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-8" aria-labelledby="appearance-title">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-soft text-cyan-700"><PanelLeftClose className="size-5" aria-hidden="true" /></span>
            <div>
              <h2 id="appearance-title" className="font-bold text-slate-900">Apariencia de navegación</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Reduce la barra lateral en pantallas grandes para disponer de más espacio.</p>
            </div>
          </div>
          <div className="mt-7 flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div><p className="text-sm font-bold text-slate-800">Navegación compacta</p><p className="mt-1 text-xs text-slate-500">En móvil siempre se muestra el menú completo.</p></div>
            <button aria-checked={compactSidebar} aria-label="Navegación compacta" className={`relative h-7 w-12 shrink-0 rounded-full transition ${compactSidebar ? 'bg-cyan-brand' : 'bg-slate-300'}`} onClick={() => void onCompactSidebarChange(!compactSidebar)} role="switch" type="button">
              <span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${compactSidebar ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-8" aria-labelledby="ai-backend-title">
          <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-soft text-cyan-700"><Server className="size-5" aria-hidden="true" /></span><div><h2 className="font-bold text-slate-900" id="ai-backend-title">Backend seguro de IA</h2><p className="mt-1 text-sm leading-6 text-slate-500">Dirección pública del proyecto Vercel, sin rutas adicionales.</p></div></div>
          <label className="mt-6 block text-sm font-bold text-slate-700">URL del backend<input className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-cyan-brand focus:ring-4 focus:ring-cyan-brand/10" onChange={(event) => { setApiUrl(event.target.value); setSaved(false) }} placeholder="https://mi-proyecto.vercel.app" type="url" value={apiUrl} /></label>
          <div className="mt-4 flex flex-wrap items-center gap-3"><button className="rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white" onClick={() => void handleSaveApiUrl()} type="button">Guardar URL</button>{saved ? <span className="flex items-center gap-2 text-xs font-bold text-emerald-700" role="status"><CheckCircle2 className="size-4" aria-hidden="true" />Configuración guardada</span> : null}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">No escribas aquí la clave de Gemini. La variable <code className="rounded bg-slate-100 px-1.5 py-0.5">GEMINI_API_KEY</code> se configura únicamente en Vercel.</p>
        </section>
        </div>

        <aside className="rounded-3xl bg-navy-900 p-6 text-white sm:p-8">
          <Database className="size-6 text-cyan-brand" aria-hidden="true" />
          <h2 className="mt-5 text-lg font-bold">Privacidad local</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">La configuración y bitácora permanecen en esta computadora. Solo los datos que selecciones para un análisis se envían al backend.</p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-cyan-200"><ShieldCheck className="size-4" aria-hidden="true" />La clave Gemini permanece en el servidor</div>
        </aside>
      </div>
    </div>
  )
}
