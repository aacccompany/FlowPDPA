import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

const DEMO_EMAIL = 'demo@flowpdpa.co.th'
const DEMO_PASSWORD = 'demo1234'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem('flowpdpa_auth', JSON.stringify({ email, name: 'Demo User', plan: 'Premium' }))
      navigate('/dashboard')
    } else {
      const raw = localStorage.getItem('flowpdpa_reg_' + email)
      if (raw) {
        try {
          const reg = JSON.parse(raw)
          if (reg.password === password) {
            localStorage.setItem('flowpdpa_auth', JSON.stringify({ email, name: reg.name, plan: 'Free' }))
            navigate('/dashboard')
            return
          }
        } catch { /* ignore */ }
      }
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--navy)' }}
    >
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-0.5">
          <span className="font-black text-xl tracking-tight text-white">Flow</span>
          <span className="font-black text-xl tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
        </Link>
        <Link
          to="/support"
          className="text-xs font-medium transition-colors"
          style={{ color: '#475569' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          ต้องการความช่วยเหลือ?
        </Link>
      </div>

      {/* Center card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}
            >
              <ShieldCheck className="w-6 h-6" style={{ color: 'var(--green)' }} />
            </div>

            <h1 className="text-2xl font-black text-white mb-1">เข้าสู่ระบบ</h1>
            <p className="text-sm mb-8" style={{ color: '#64748b' }}>
              ยินดีต้อนรับกลับมา จัดการ Policy ของคุณได้เลย
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                  อีเมล
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@company.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                    รหัสผ่าน
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs transition-colors"
                    style={{ color: 'var(--green)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="text-xs px-4 py-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn-green w-full py-3 text-sm mt-2"
                style={{ borderRadius: '8px' }}
              >
                เข้าสู่ระบบ
              </button>
            </form>

            {/* Demo credentials hint */}
            <div
              className="mt-5 px-4 py-3 rounded-lg text-xs space-y-0.5"
              style={{ backgroundColor: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.15)' }}
            >
              <p className="font-semibold" style={{ color: 'var(--green)' }}>Demo Account</p>
              <p style={{ color: '#475569' }}>Email: <span className="text-white">demo@flowpdpa.co.th</span></p>
              <p style={{ color: '#475569' }}>Password: <span className="text-white">demo1234</span></p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <span className="text-xs" style={{ color: '#334155' }}>หรือ</span>
              <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm" style={{ color: '#475569' }}>
              ยังไม่มีบัญชี?{' '}
              <Link
                to="/register"
                className="font-semibold transition-colors"
                style={{ color: 'var(--green)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                สมัครสมาชิก
              </Link>
            </p>

            {/* Admin link */}
            <p className="text-center mt-3">
              <Link
                to="/admin"
                className="text-xs transition-colors"
                style={{ color: '#334155' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
              >
                Admin Login →
              </Link>
            </p>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-5 mt-8">
            <Link
              to="/terms"
              className="text-xs transition-colors"
              style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >
              เงื่อนไขการใช้งาน
            </Link>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#1e293b' }} />
            <Link
              to="/privacy-policy"
              className="text-xs transition-colors"
              style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
