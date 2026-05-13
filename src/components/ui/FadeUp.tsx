import { useInView } from '@/hooks/useInView'

interface Props {
  children: React.ReactNode
  delay?: number
  className?: string
}

export default function FadeUp({ children, delay = 0, className = '' }: Props) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`fade-up ${inView ? 'in-view' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
