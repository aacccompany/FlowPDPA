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

  return (
    <header className="site-nav-wrap">
      <div className="site-nav-bar">
        <Link
          to="/"
          className="site-nav-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="site-nav-mark" aria-hidden="true">
            <img src="/favicon.svg" alt="" />
          </span>
          <span className="site-nav-name">
            Flow<span>PDPA</span>
          </span>
        </Link>

        <nav className="site-nav-links" aria-label="เมนูหลัก">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="site-nav-pill"
              data-active={pathname === link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-nav-actions">
          <Link to={isLoggedIn ? '/dashboard' : '/login'} className="site-nav-pill site-nav-login">
            {isLoggedIn ? 'Dashboard' : 'เข้าสู่ระบบ'}
          </Link>
          <Link to="/get-started" className="site-nav-cta">
            เริ่มต้นใช้งาน
          </Link>
          <button
            className="site-nav-toggle"
            aria-expanded={open}
            aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="site-nav-sheet" aria-label="เมนูหลัก">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="site-nav-pill"
              data-active={pathname === link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={isLoggedIn ? '/dashboard' : '/login'}
            className="site-nav-pill"
            onClick={() => setOpen(false)}
          >
            {isLoggedIn ? 'Dashboard' : 'เข้าสู่ระบบ'}
          </Link>
          <Link to="/get-started" className="site-nav-cta site-nav-cta-block" onClick={() => setOpen(false)}>
            เริ่มต้นใช้งาน
          </Link>
        </nav>
      )}
    </header>
  )
}
