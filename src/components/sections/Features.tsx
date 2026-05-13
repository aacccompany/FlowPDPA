const features = [
  {
    number: '01',
    title: 'Auto-updated Hosted Policy',
    description: 'Your policy lives on our servers. When Thai law changes, we update it automatically — you do nothing.',
  },
  {
    number: '02',
    title: 'DPO-Certified Legal Drafting',
    description: 'Every policy is written by legal professionals trained as Data Protection Officers under PDPA.',
  },
  {
    number: '03',
    title: 'One-line HTML Embed',
    description: 'A single script tag is all you need. Works with WordPress, Shopify, Webflow, or any custom site.',
  },
  {
    number: '04',
    title: 'Multi-site Dashboard',
    description: 'Manage policies across all your websites from one central account. No duplication, no confusion.',
  },
  {
    number: '05',
    title: 'Business-specific Customization',
    description: 'Answer a few plain-language questions. We generate a policy matched to your exact business type.',
  },
  {
    number: '06',
    title: 'International Coverage',
    description: 'Premium plans extend compliance to GDPR (Europe) and CCPA (California) — one platform, global reach.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-16 gap-y-12">
          {/* Left heading column */}
          <div className="lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4">
              Platform Features
            </p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Built for Thai businesses who take compliance seriously.
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Not a template generator. FlowPDPA is a compliance platform designed around the specifics of Thailand's PDPA legislation.
            </p>
          </div>

          {/* Right features grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-10">
            {features.map(({ number, title, description }) => (
              <div key={number} className="border-t-2 border-emerald-600 pt-5">
                <span className="text-xs font-bold text-emerald-600 tracking-widest">{number}</span>
                <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
