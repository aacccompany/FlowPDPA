import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, UserPlus, LogIn } from 'lucide-react'
import { storage } from '@/utils/storage'

const DEMO_EMAIL = 'demo@flowpdpa.co.th'
const DEMO_PASSWORD = 'demo1234'

export default function GetStarted() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'choose' | 'login'>('choose')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, go straight to create
  useEffect(() => {
    const auth = storage.auth.get()
    if (auth && auth.token) {
      navigate('/create/policy', { replace: true })
    }
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        storage.auth.set({ email, name: 'Demo User', plan: 'Premium', token: 'demo-token' })
        navigate('/create/policy')
        return
      }

      const reg = localStorage.getItem(`flowpdpa_reg_${email}`)
      if (reg) {
        try {
          const data = JSON.parse(reg)
          if (data.password === password) {
            storage.auth.set({ email, name: data.name, plan: 'Free', token: 'local-token' })
            navigate('/create/policy')
            return
          }
        } catch { /* invalid JSON */ }
      }

      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--green)')
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--navy)' }}>

      {/* Background grid */}
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

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}
          >
            {mode === 'choose' ? (
              <>
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}
                >
                  <ShieldCheck className="w-6 h-6" style={{ color: 'var(--green)' }} />
                </div>

                <h1 className="text-2xl font-black text-white mb-1">เริ่มสร้าง Policy</h1>
                <p className="text-sm mb-8" style={{ color: '#64748b' }}>
                  สร้างนโยบาย PDPA ที่ถูกต้องตามกฎหมายในไม่กี่นาที
                </p>

                {/* Choices */}
                <div className="space-y-3">
                  <button
                    onClick={() => setMode('login')}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: 'rgba(5,150,105,0.08)',
                      border: '1px solid rgba(5,150,105,0.25)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(5,150,105,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(5,150,105,0.25)')}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}
                    >
                      <LogIn className="w-5 h-5" style={{ color: 'var(--green)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">มีบัญชีอยู่แล้ว</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>เข้าสู่ระบบเพื่อสร้าง Policy</p>
                    </div>
                  </button>

                  <Link
                    to="/register"
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <UserPlus className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">ยังไม่มีบัญชี</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>สมัครสมาชิกฟรี ใช้เวลาไม่ถึง 1 นาที</p>
                    </div>
                  </Link>
                </div>

                {/* Demo hint */}
                <div
                  className="mt-6 px-4 py-3 rounded-lg text-xs space-y-0.5"
                  style={{ backgroundColor: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.15)' }}
                >
                  <p className="font-semibold" style={{ color: 'var(--green)' }}>ทดลองใช้งาน (Demo)</p>
                  <p style={{ color: '#475569' }}>Email: <span className="text-white">demo@flowpdpa.co.th</span></p>
                  <p style={{ color: '#475569' }}>Password: <span className="text-white">demo1234</span></p>
                </div>
              </>
            ) : (
              <>
                {/* Back button */}
                <button
                  onClick={() => { setMode('choose'); setError('') }}
                  className="flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                  ← กลับ
                </button>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}
                >
                  <LogIn className="w-6 h-6" style={{ color: 'var(--green)' }} />
                </div>

                <h1 className="text-2xl font-black text-white mb-1">เข้าสู่ระบบ</h1>
                <p className="text-sm mb-8" style={{ color: '#64748b' }}>
                  เข้าสู่ระบบเพื่อเริ่มสร้าง Policy ของคุณ
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      อีเมล
                    </label>
                    <input
                      type="email" required placeholder="email@company.com"
                      value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                      className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      รหัสผ่าน
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                        value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                        className={inputCls} style={{ ...inputStyle, paddingRight: '44px' }}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      className="text-xs px-4 py-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-green w-full py-3 text-sm mt-2 flex items-center justify-center gap-2"
                    style={{ borderRadius: '8px', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'เข้าสู่ระบบและสร้าง Policy'
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-between mt-4">
                  <Link
                    to="/forgot-password"
                    className="text-xs transition-colors"
                    style={{ color: 'var(--green)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs transition-colors"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                  >
                    สมัครสมาชิก →
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-5 mt-8">
            <Link to="/terms" className="text-xs transition-colors" style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}>
              เงื่อนไขการใช้งาน
            </Link>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#1e293b' }} />
            <Link to="/privacy-policy" className="text-xs transition-colors" style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}>
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
