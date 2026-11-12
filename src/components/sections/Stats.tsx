import { useInView } from '@/hooks/useInView'

const metrics = [
  { value: '3,500+', label: 'Policies Created' },
  { value: '500+', label: 'Business Clients' },
  { value: '< 5 min', label: 'To Build a Policy' },
  { value: 'ISO 29110', label: 'Certified' },
]

export default function Stats() {
  const { ref, inView } = useInView()

  return (
    <section style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div ref={ref} className={`grid grid-cols-2 md:grid-cols-4 stagger-grid ${inView ? 'in-view' : ''}`}>
          {metrics.map(({ value, label }, i) => (
            <div key={label} className="text-center px-6 py-4"
              style={i > 0 ? { borderLeft: '1px solid #e5e7eb' } : {}}>
              <div className="text-2xl font-black mb-1" style={{ color: 'var(--green)' }}>{value}</div>
              <div className="text-xs font-medium" style={{ color: '#9ca3af' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
