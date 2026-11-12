import { useEffect, useRef } from 'react'
import { AlertTriangle, CircleHelp, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'destructive'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, onCancel, open])

  if (!open) return null

  const Icon = tone === 'destructive' ? AlertTriangle : CircleHelp
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !loading) onCancel() }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
      <div className="flex items-start gap-4 p-5">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded ${tone === 'destructive' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">{title}</h2><p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-gray-600">{description}</p></div>
        <button type="button" onClick={onCancel} disabled={loading} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"><X className="h-4 w-4" /></button>
      </div>
      <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="h-9 rounded border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">{cancelLabel}</button>
        <button type="button" onClick={onConfirm} disabled={loading} className={`h-9 rounded px-4 text-sm font-semibold text-white disabled:opacity-60 ${tone === 'destructive' ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'}`}>{loading ? 'Please wait...' : confirmLabel}</button>
      </footer>
    </section>
  </div>
}
