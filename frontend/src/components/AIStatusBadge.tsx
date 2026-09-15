import { Bot, CircleAlert, LoaderCircle, WifiOff } from 'lucide-react'
import type { AIAvailability } from '../services/aiService'

const presentation: Record<AIAvailability, { label: string; className: string; dot: string }> = {
  NOT_CONFIGURED: { label: 'IA: No configurada', className: 'border-slate-200 bg-white text-slate-500', dot: 'bg-slate-400' },
  CHECKING: { label: 'IA: Verificando', className: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  CONNECTED: { label: 'IA: Conectada', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  OFFLINE: { label: 'IA: Sin conexión', className: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  PROCESSING: { label: 'IA: Procesando', className: 'border-cyan-200 bg-cyan-soft text-cyan-800', dot: 'bg-cyan-brand' },
  ERROR: { label: 'IA: Error', className: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
}

export function AIStatusBadge({ compact = false, status }: { compact?: boolean; status: AIAvailability }) {
  const item = presentation[status]
  const Icon = status === 'PROCESSING' || status === 'CHECKING' ? LoaderCircle : status === 'OFFLINE' ? WifiOff : status === 'ERROR' ? CircleAlert : Bot
  return (
    <div className={`flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold ${item.className}`} title={item.label}>
      <Icon className={`size-3.5 ${status === 'PROCESSING' || status === 'CHECKING' ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span className={compact ? 'sr-only' : ''}>{item.label}</span>
      <span className={`size-1.5 rounded-full ${item.dot}`} aria-hidden="true" />
    </div>
  )
}
