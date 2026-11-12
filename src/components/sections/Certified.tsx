export default function Certified() {
  return (
    <section className="py-14" style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--green)' }}>
              Certification
            </p>
            <h2 className="text-xl font-black" style={{ color: '#111827' }}>ได้รับการรับรองมาตรฐานสากล</h2>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 px-6 py-4"
              style={{ border: '1px solid #c8ded6', backgroundColor: '#f0faf5', borderRadius: '8px' }}>
              <div>
                <div className="text-xs font-semibold" style={{ color: '#6b7280' }}>ISO/IEC</div>
                <div className="text-2xl font-black" style={{ color: 'var(--green)' }}>29110</div>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: '#c8ded6' }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: '#374151' }}>Software Life Cycle</div>
                <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--green)' }}>Certified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
