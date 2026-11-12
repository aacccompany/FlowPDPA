import {
  Cctv,
  ClipboardCheck,
  Files,
  Handshake,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

const policyIconMap: Record<string, LucideIcon> = {
  privacy: ShieldCheck,
  hr: Users,
  cctv: Cctv,
  recruitment: ClipboardCheck,
  vendor: Handshake,
  dpa: Files,
}

export function PolicyTypeIcon({ type, className = 'w-5 h-5' }: { type: string; className?: string }) {
  const Icon = policyIconMap[type] ?? Files
  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />
}
