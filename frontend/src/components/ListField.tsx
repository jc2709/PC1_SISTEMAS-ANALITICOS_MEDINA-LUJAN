import { Plus, X } from 'lucide-react'

interface ListFieldProps {
  hint?: string
  label: string
  name: string
  onChange: (value: string[]) => void
  placeholder?: string
  value: string[]
}

export function ListField({ hint, label, name, onChange, placeholder, value }: ListFieldProps) {
  const values = value.length > 0 ? value : ['']
  const hintId = hint ? `${name}-hint` : undefined

  const updateItem = (index: number, item: string) => {
    const next = [...values]
    next[index] = item
    onChange(next)
  }

  const removeItem = (index: number) => {
    onChange(values.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <fieldset>
      <legend className="text-sm font-bold text-slate-700">{label}</legend>
      <div className="mt-2 space-y-2">
        {values.map((item, index) => (
          <div className="flex gap-2" key={`${name}-${index}`}>
            <input
              aria-describedby={hintId}
              aria-label={`${label} ${index + 1}`}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              name={`${name}-${index}`}
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder={placeholder}
              value={item}
            />
            <button aria-label={`Eliminar ${label.toLocaleLowerCase('es')} ${index + 1}`} className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => removeItem(index)} type="button"><X className="size-4" aria-hidden="true" /></button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {hint ? <span className="text-xs font-normal leading-5 text-slate-400" id={hintId}>{hint}</span> : <span />}
        <button className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-900" onClick={() => onChange([...values, ''])} type="button"><Plus className="size-3.5" aria-hidden="true" />Agregar</button>
      </div>
    </fieldset>
  )
}
