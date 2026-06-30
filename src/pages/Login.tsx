import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { api } from '@/services/api'
import { normalizeRole, roleHome, storage, type UserRole } from '@/utils/storage'
import { isValidEmail } from '@/utils/validation'
import './Register.css'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const auth = storage.auth.get()
    if (auth?.token) navigate(roleHome(auth.role), { replace: true })
  }, [navigate])

  const destinationFor = (role: UserRole) => {
    const canReturnToRequestedPage = (
      (role === 'admin' && from.startsWith('/admin'))
      || (role === 'legal' && from.startsWith('/legal'))
      || (role === 'merchant' && (from === '/dashboard' || from.startsWith('/create/')))
    )
    if (canReturnToRequestedPage) return from
    return roleHome(role)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!isValidEmail(email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    setLoading(true)

    try {
      const response = await api.auth.login({ email: normalizedEmail, password })
      if (!response.success || !response.data) {
        setError(response.error?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
        return
      }

      const data = response.data as {
        token?: string
        access_token?: string
        refresh_token?: string
        expires_in?: number
        user?: { id?: string; email?: string; name?: string; role?: string; plan?: string; company?: string; phone?: string; email_verified?: boolean }
        email?: string
        name?: string
        role?: string
        plan?: string
      }
      const user = data.user ?? data
      const token = data.token ?? data.access_token
      if (!token) {
        setError('ระบบไม่ได้รับ access token จากเซิร์ฟเวอร์')
        return
      }

      const role = normalizeRole(user.role)
      storage.auth.set({
        id: data.user?.id,
        email: user.email ?? normalizedEmail,
        name: user.name ?? '',
        plan: user.plan ?? 'Free',
        role,
        token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
        company: data.user?.company,
        phone: data.user?.phone,
        emailVerified: data.user?.email_verified ?? true,
      })
      navigate(destinationFor(role), { replace: true })
    } catch (requestError) {
      console.error('Login error:', requestError)
      setError('เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-shell min-h-screen flex flex-col">
      <header className="register-topbar flex items-center justify-between w-full">
        <Link to="/" className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/favicon.svg" alt="FlowPDPA" className="w-8 h-8" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="font-extrabold text-base" style={{ color: '#ffffff' }}>Flow<span style={{ color: '#4ade80' }}>PDPA</span></span>
        </Link>
        <Link to="/support" className="text-xs font-medium transition-colors" style={{ color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          ต้องการความช่วยเหลือ?
        </Link>
      </header>

      <main className="register-main">
        <div className="login-layout">
          <section className="register-card login-card">
            <div className="register-icon flex items-center justify-center mb-6">
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--green)' }} aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-bold mb-1">เข้าสู่ระบบ</h1>
            <p className="text-sm mb-8">เข้าสู่พื้นที่จัดการนโยบายและงานตรวจสอบของคุณ</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">อีเมล</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="email@company.com"
                  value={email}
                  aria-invalid={Boolean(email) && !isValidEmail(email)}
                  onChange={event => { setEmail(event.target.value.trimStart()); setError('') }}
                  className="w-full px-4 py-3 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">รหัสผ่าน</label>
                  <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: 'var(--green)' }}>
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="รหัสผ่านของคุณ"
                    value={password}
                    onChange={event => { setPassword(event.target.value); setError('') }}
                    className="w-full px-4 py-3 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="register-error flex items-start gap-2 text-xs px-4 py-3 rounded border" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-green w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <span className="register-divider flex-1 h-px" />
              <span className="text-xs text-gray-500">ยังไม่มีบัญชี?</span>
              <span className="register-divider flex-1 h-px" />
            </div>

            <Link to="/register" className="register-login-link block w-full py-3 text-sm font-semibold text-center">
              สมัครสมาชิก
            </Link>
          </section>

          <footer className="register-legal flex items-center justify-center gap-5 mt-6">
            <Link to="/terms" className="text-xs">เงื่อนไขการใช้งาน</Link>
            <span className="w-1 h-1 rounded-full" />
            <Link to="/privacy-policy" className="text-xs">นโยบายความเป็นส่วนตัว</Link>
          </footer>
        </div>
      </main>
    </div>
  )
}
