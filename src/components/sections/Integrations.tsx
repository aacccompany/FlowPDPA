const platforms = [
  'WordPress', 'Shopify', 'WooCommerce', 'Wix', 'Webflow', 'LINE OA', 'Facebook Pixel', 'Google Analytics',
]

export default function Integrations() {
  return (
    <section className="bg-white py-10 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-6">
          รองรับทุกแพลตฟอร์มที่คุณใช้งาน
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {platforms.map((p) => (
            <div
              key={p}
              className="text-sm font-bold text-gray-300 hover:text-gray-500 transition-colors tracking-wide cursor-default"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
