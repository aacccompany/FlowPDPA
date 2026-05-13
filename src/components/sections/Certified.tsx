export default function Certified() {
  return (
    <section className="py-16 bg-white" style={{ borderTop: '1px solid #e2e8f0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p
              className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] mb-3"
              style={{ color: 'var(--green)' }}
            >
              <span className="block w-8 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.4 }} />
              Certification
            </p>
            <h2 className="text-xl font-black text-gray-900">ได้รับการรับรองมาตรฐานสากล</h2>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div
              className="flex items-center gap-3 px-6 py-4 rounded-xl"
              style={{ border: '2px solid var(--blue)', backgroundColor: '#eff6ff' }}
            >
              <div>
                <div className="text-xs font-bold tracking-wider" style={{ color: '#93c5fd' }}>ISO/IEC</div>
                <div className="text-2xl font-black" style={{ color: 'var(--blue)' }}>29110</div>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: '#bfdbfe' }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: '#3b82f6' }}>Software Life Cycle</div>
                <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--blue)' }}>Certified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
