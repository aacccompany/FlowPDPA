import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Why Us', href: '/why-us' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Support', href: '/support' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  const isHome = pathname === '/'
  const dark = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: dark ? 'transparent' : 'white',
        borderBottom: dark ? 'none' : '1px solid #e5e7eb',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.1)' : 'none',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Top accent bar — only when not dark transparent */}
      {!dark && (
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, var(--green) 0%, var(--blue) 100%)' }} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: '60px' }}>
          <Link to="/" className="flex items-center gap-0.5 shrink-0">
            <span className={`font-black text-xl tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Flow</span>
            <span className="font-black text-xl tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium whitespace-nowrap transition-colors"
                style={{ color: dark ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
                onMouseEnter={e => (e.currentTarget.style.color = dark ? 'white' : '#111827')}
                onMouseLeave={e => (e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.7)' : '#6b7280')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center text-sm font-semibold px-4 py-2 transition-all"
              style={{
                color: dark ? 'rgba(255,255,255,0.7)' : '#374151',
                border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #d1d5db',
                borderRadius: '6px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = dark ? 'white' : '#111827'
                e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.5)' : '#9ca3af'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.7)' : '#374151'
                e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.2)' : '#d1d5db'
              }}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/create/policy"
              className="hidden sm:inline-flex items-center text-sm font-bold text-white px-5 py-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--green)', borderRadius: '6px' }}
            >
              Get Started
            </Link>
            <button
              className="lg:hidden p-2 transition-colors"
              style={{ color: dark ? 'rgba(255,255,255,0.8)' : '#6b7280' }}
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-gray-600 px-2 py-2.5 rounded hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 mt-1 border-t border-gray-100 flex flex-col gap-2">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-700 py-2.5 w-full text-center block border border-gray-200 rounded"
              style={{ borderRadius: '6px' }}
              onClick={() => setOpen(false)}
            >
              เข้าสู่ระบบ
            </Link>
            <Link to="/create/policy" className="btn-green text-sm py-2.5 w-full text-center block" style={{ borderRadius: '6px' }} onClick={() => setOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
