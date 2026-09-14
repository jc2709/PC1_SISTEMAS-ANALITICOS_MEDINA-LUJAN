import { Database, HardDrive } from 'lucide-react'
import type { StorageMode } from '../storage/StorageProvider'

interface StorageBadgeProps { mode: StorageMode }

export function StorageBadge({ mode }: StorageBadgeProps) {
  const isPersistent = mode === 'indexed-db'
  const Icon = isPersistent ? Database : HardDrive

  return (
    <div className={`flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm ${isPersistent ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {isPersistent ? 'Datos locales: Listos' : 'Datos locales: Temporales'}
    </div>
  )
}
