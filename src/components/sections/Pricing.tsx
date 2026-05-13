import { Check, Minus } from 'lucide-react'

const rows = [
  { label: 'PDPA Compliance', free: true, premium: true },
  { label: 'Hosted Policy Page', free: true, premium: true },
  { label: 'HTML Embed Code', free: true, premium: true },
  { label: 'Automatic Legal Updates', free: false, premium: true },
  { label: 'GDPR & CCPA Coverage', free: false, premium: true },
  { label: 'Commercial Use License', free: false, premium: true },
  { label: 'Third-party Data Handling', free: false, premium: true },
  { label: 'Sensitive Data Coverage', free: false, premium: true },
  { label: 'Priority Legal Support', free: false, premium: true },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-16 gap-y-10">
          {/* Left heading */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4">
              Pricing
            </p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
              Simple, honest pricing.
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Start free with full PDPA basics. Upgrade to Premium for complete multi-regulation coverage and legal support.
            </p>
            <div className="mt-8 p-5 border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Premium</p>
              <p className="text-3xl font-bold text-gray-900">฿2,500 <span className="text-sm font-normal text-gray-400">/ year</span></p>
              <p className="text-xs text-gray-500 mt-2">Less than ฿210/month for full legal coverage.</p>
              <a
                href="#contact"
                className="mt-5 block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-3 text-sm transition-colors"
              >
                Start Premium
              </a>
            </div>
          </div>

          {/* Right comparison table */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200">
              <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50">
                <div className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Feature</div>
                <div className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-widest text-center border-l border-gray-200">Free</div>
                <div className="px-6 py-4 text-xs font-semibold text-emerald-700 uppercase tracking-widest text-center border-l border-gray-200">Premium</div>
              </div>
              {rows.map(({ label, free, premium }, i) => (
                <div
                  key={label}
                  className={`grid grid-cols-3 ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="px-6 py-3.5 text-sm text-gray-700">{label}</div>
                  <div className="px-6 py-3.5 flex items-center justify-center border-l border-gray-100">
                    {free
                      ? <Check className="w-4 h-4 text-emerald-600" />
                      : <Minus className="w-4 h-4 text-gray-300" />}
                  </div>
                  <div className="px-6 py-3.5 flex items-center justify-center border-l border-gray-100">
                    {premium
                      ? <Check className="w-4 h-4 text-emerald-600" />
                      : <Minus className="w-4 h-4 text-gray-300" />}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 border-t border-gray-200 bg-gray-50">
                <div className="px-6 py-4 text-xs text-gray-500">Get started</div>
                <div className="px-6 py-4 flex justify-center border-l border-gray-200">
                  <a href="#contact" className="text-xs font-semibold text-gray-700 hover:text-emerald-600 transition-colors underline underline-offset-2">
                    Free forever
                  </a>
                </div>
                <div className="px-6 py-4 flex justify-center border-l border-gray-200">
                  <a href="#contact" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors underline underline-offset-2">
                    ฿2,500 / yr
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
