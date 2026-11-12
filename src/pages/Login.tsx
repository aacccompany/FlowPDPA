import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { api } from '@/services/api'
import { normalizeRole, roleHome, storage, type UserRole } from '@/utils/storage'
import { isValidEmail } from '@/utils/validation'
import { friendlyError } from '@/utils/friendlyError'
import './Register.css'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { from?: string; privacyNoticeDeclined?: boolean; switchAccount?: boolean } | null
  const from = locationState?.from ?? '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(
    locationState?.privacyNoticeDeclined
      ? 'คุณออกจากระบบเนื่องจากยังไม่ได้ยอมรับ Privacy Notice'
      : '',
  )
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const oauthExchangeStarted = useRef(false)

  const oauthCode = new URLSearchParams(location.search).get('oauth_code')
  const oauthError = new URLSearchParams(location.search).get('oauth_error')

  useEffect(() => {
    if (locationState?.switchAccount) {
      storage.auth.clear()
      navigate('/login', { replace: true })
      return
    }
    if (oauthCode) return
    const auth = storage.auth.get()
    if (auth?.token) navigate(roleHome(auth.role), { replace: true })
  }, [locationState?.switchAccount, navigate, oauthCode])

  const destinationFor = useCallback((role: UserRole) => {
    const canReturnToRequestedPage = (
      (role === 'admin' && from.startsWith('/admin'))
      || (role === 'legal' && from.startsWith('/legal'))
      || (role === 'merchant' && (from === '/dashboard' || from.startsWith('/create/')))
    )
    if (canReturnToRequestedPage) return from
    return roleHome(role)
  }, [from])

  const completeLogin = useCallback((data: {
    token?: string
    access_token?: string
    refresh_token?: string
    expires_in?: number
    user?: { id?: string; email?: string; name?: string; role?: string; plan?: string; company?: string; phone?: string; email_verified?: boolean; privacy_notice_accepted?: boolean; privacy_notice_version?: string | null; privacy_notice_accepted_at?: string | null }
    email?: string
    name?: string
    role?: string
    plan?: string
  }, fallbackEmail = '') => {
    const user = data.user ?? data
    const token = data.token ?? data.access_token
    if (!token) throw new Error('MISSING_ACCESS_TOKEN')
    const role = normalizeRole(user.role)
    storage.auth.set({
      id: data.user?.id,
      email: user.email ?? fallbackEmail,
      name: user.name ?? '',
      plan: user.plan ?? 'Free',
      role,
      token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      company: data.user?.company,
      phone: data.user?.phone,
      emailVerified: data.user?.email_verified ?? true,
      privacyNoticeAccepted: data.user?.privacy_notice_accepted ?? false,
      privacyNoticeVersion: data.user?.privacy_notice_version,
      privacyNoticeAcceptedAt: data.user?.privacy_notice_accepted_at,
    })
    navigate(destinationFor(role), { replace: true })
  }, [destinationFor, navigate])

  useEffect(() => {
    if (oauthError) {
      setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      navigate('/login', { replace: true, state: locationState })
      return
    }
    if (!oauthCode || oauthExchangeStarted.current) return
    oauthExchangeStarted.current = true
    window.history.replaceState({}, '', '/login')
    setGoogleLoading(true)
    void api.auth.googleOAuth.exchange(oauthCode).then(response => {
      if (!response.success || !response.data) {
        setError(response.error?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ')
        return
      }
      completeLogin(response.data)
    }).catch(requestError => {
      console.error('Google login exchange error:', requestError)
      setError('เชื่อมต่อ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }).finally(() => {
      setGoogleLoading(false)
    })
  }, [completeLogin, locationState, navigate, oauthCode, oauthError])

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
        setError(response.error?.status === 401 || response.error?.code === 'INVALID_CREDENTIALS' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' : friendlyError(response.error, 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่านแล้วลองใหม่'))
        return
      }

      const data = response.data as {
        token?: string
        access_token?: string
        refresh_token?: string
        expires_in?: number
        user?: { id?: string; email?: string; name?: string; role?: string; plan?: string; company?: string; phone?: string; email_verified?: boolean; privacy_notice_accepted?: boolean; privacy_notice_version?: string | null; privacy_notice_accepted_at?: string | null }
        email?: string
        name?: string
        role?: string
        plan?: string
      }
      completeLogin(data, normalizedEmail)
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
              <span className="text-xs text-gray-500">หรือ</span>
              <span className="register-divider flex-1 h-px" />
            </div>

            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={() => {
                setGoogleLoading(true)
                window.location.assign(api.auth.googleOAuth.startUrl(from))
              }}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
                  <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.35l-3.24-2.55c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.63A10 10 0 0 0 12 22Z" />
                  <path fill="#FBBC05" d="M6.4 13.94A6 6 0 0 1 6.08 12c0-.67.12-1.32.32-1.94V7.43H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.57l3.35-2.63Z" />
                  <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.43l3.35 2.63c.79-2.36 3-4.12 5.6-4.12Z" />
                </svg>
              )}
              {googleLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google'}
            </button>

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
