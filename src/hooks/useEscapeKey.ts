import { useEffect } from 'react'

/** Lets keyboard users dismiss a modal with Escape. Does nothing while `active` is false. */
export function useEscapeKey(onEscape: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [active, onEscape])
}
