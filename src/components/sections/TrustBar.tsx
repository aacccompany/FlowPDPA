const brands = ['Cotto', 'TOG Group', 'Pioneer', 'Apai', 'Zortout', 'SCB', 'TrueMove', 'AIS', 'KBANK']

export default function TrustBar() {
  return (
    <section className="bg-white border-t border-b border-gray-200 py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap shrink-0">
            Trusted by
          </span>
          <div className="w-px h-6 bg-gray-200 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {brands.map((brand) => (
              <span
                key={brand}
                className="text-sm font-semibold text-gray-300 hover:text-gray-500 transition-colors cursor-default tracking-wide"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
