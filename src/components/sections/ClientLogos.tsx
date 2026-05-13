const logos = ['TechFlow Co.', 'BrandMark', 'RetailHub', 'MedPlus', 'EduSmart', 'FinTrack', 'ShopOnline']

export default function ClientLogos() {
  return (
    <section className="py-12" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] mb-6" style={{ color: '#94a3b8' }}>
          Trusted by 3,500+ businesses across Thailand
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-sm font-black tracking-wider transition-colors"
              style={{ color: '#cbd5e1' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
