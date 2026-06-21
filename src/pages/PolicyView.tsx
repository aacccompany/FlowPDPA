import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function PolicyView() {
  const { slug } = useParams<{ slug: string }>()
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')

  useEffect(() => {
    if (slug && apiBaseUrl) {
      window.location.replace(`${apiBaseUrl}/policies/public/${encodeURIComponent(slug)}`)
    }
  }, [apiBaseUrl, slug])

  if (!slug || !apiBaseUrl) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
          <h1 className="mb-2 text-lg font-semibold text-gray-900">Policy unavailable</h1>
          <p className="mb-5 text-sm text-gray-500">The public policy URL is not configured.</p>
          <Link to="/" className="text-sm font-semibold text-emerald-700">Back to FlowPDPA</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
        Loading policy...
      </div>
    </main>
  )
}
