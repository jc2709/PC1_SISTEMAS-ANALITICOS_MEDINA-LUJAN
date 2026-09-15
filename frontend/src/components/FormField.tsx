import type { ChangeEventHandler } from 'react'

interface FormFieldProps {
  error?: string
  hint?: string
  label: string
  maxLength?: number
  name: string
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  placeholder?: string
  required?: boolean
  rows?: number
  type?: 'text' | 'number'
  value: string | number
}

export function FormField({ error, hint, label, maxLength, name, onChange, placeholder, required, rows, type = 'text', value }: FormFieldProps) {
  const className = `mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:ring-4 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-100'}`
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined

  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}{required ? <span className="ml-1 text-red-500">*</span> : null}
      {rows ? (
        <textarea aria-describedby={describedBy} aria-invalid={Boolean(error)} className={className} maxLength={maxLength} name={name} onChange={onChange} placeholder={placeholder} rows={rows} value={value} />
      ) : (
        <input aria-describedby={describedBy} aria-invalid={Boolean(error)} className={className} maxLength={maxLength} name={name} onChange={onChange} placeholder={placeholder} type={type} value={value} />
      )}
      {error ? <span className="mt-1.5 block text-xs font-medium text-red-600" id={`${name}-error`}>{error}</span> : null}
      {!error && hint ? <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-400" id={`${name}-hint`}>{hint}</span> : null}
    </label>
  )
}
