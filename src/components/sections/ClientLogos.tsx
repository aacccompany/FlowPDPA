const logos = ['TechFlow Co.', 'BrandMark', 'RetailHub', 'MedPlus', 'EduSmart', 'FinTrack', 'ShopOnline']

export default function ClientLogos() {
  return (
    <section className="py-12" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest mb-7" style={{ color: '#9ca3af' }}>
          Trusted by 3,500+ businesses across Thailand
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((logo) => (
            <div key={logo} className="text-sm font-bold tracking-wider transition-colors cursor-default"
              style={{ color: '#d1d5db' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
              onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
