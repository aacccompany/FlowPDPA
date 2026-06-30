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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const check = () => setIsLoggedIn(!!localStorage.getItem('flowpdpa_auth'))
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('flowpdpa_auth'))
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: scrolled ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
        boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: '68px' }}>

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/favicon.svg" alt="FlowPDPA" className="w-8 h-8" />
            <span className="font-extrabold text-lg" style={{ color: '#111827', letterSpacing: '-0.01em' }}>
              Flow<span style={{ color: 'var(--green)' }}>PDPA</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden lg:flex items-center" style={{ gap: '2px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap transition-colors"
                style={{ color: '#4b5563' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.backgroundColor = '#f9fafb' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link
              to={isLoggedIn ? '/dashboard' : '/login'}
              className="hidden sm:inline-flex items-center text-sm font-medium px-4 py-2 rounded-md transition-colors"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.backgroundColor = '#f9fafb' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {isLoggedIn ? 'Dashboard' : 'เข้าสู่ระบบ'}
            </Link>
            <Link
              to="/get-started"
              className="hidden sm:inline-flex items-center text-sm font-bold text-white px-5 py-2 ml-1 transition-all"
              style={{ backgroundColor: 'var(--green)', borderRadius: '6px' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--green-dark)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--green)')}
            >
              เริ่มต้นใช้งาน
            </Link>
            <button
              className="lg:hidden p-2 ml-1 rounded-md transition-colors"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6' }}>
          <div className="px-4 py-3 flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium px-3 py-2.5 rounded-md transition-colors"
                style={{ color: '#374151' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop: '1px solid #f3f4f6' }}>
            <Link
              to={isLoggedIn ? '/dashboard' : '/login'}
              className="text-sm font-semibold py-2.5 w-full text-center block rounded-md transition-colors mt-3"
              style={{ color: '#374151', border: '1px solid #e5e7eb' }}
              onClick={() => setOpen(false)}
            >
              {isLoggedIn ? 'Dashboard' : 'เข้าสู่ระบบ'}
            </Link>
            <Link
              to="/get-started"
              className="btn-green text-sm py-2.5 w-full text-center block"
              style={{ borderRadius: '6px' }}
              onClick={() => setOpen(false)}
            >
              เริ่มต้นใช้งาน
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
