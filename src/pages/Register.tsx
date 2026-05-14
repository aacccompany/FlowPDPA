import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('กรุณาระบุชื่อ-นามสกุล'); return }
    if (password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (password !== confirm) { setError('รหัสผ่านไม่ตรงกัน'); return }
    localStorage.setItem('flowpdpa_reg_' + email, JSON.stringify({ name: name.trim(), password }))
    localStorage.setItem('flowpdpa_auth', JSON.stringify({ email, name: name.trim(), plan: 'Free' }))
    navigate('/dashboard')
  }

  const inputClass = "w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }

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
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}
            >
              <UserPlus className="w-6 h-6" style={{ color: 'var(--green)' }} />
            </div>

            <h1 className="text-2xl font-black text-white mb-1">สมัครสมาชิก</h1>
            <p className="text-sm mb-8" style={{ color: '#64748b' }}>
              สร้างบัญชีเพื่อเริ่มสร้างนโยบาย PDPA ของคุณ
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อ นามสกุล"
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

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
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  required
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
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
                className="btn-green w-full py-3 text-sm mt-2"
                style={{ borderRadius: '8px' }}
              >
                สร้างบัญชี
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <span className="text-xs" style={{ color: '#334155' }}>หรือ</span>
              <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </div>

            <p className="text-center text-sm" style={{ color: '#475569' }}>
              มีบัญชีแล้ว?{' '}
              <Link
                to="/login"
                className="font-semibold transition-colors"
                style={{ color: 'var(--green)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>

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
