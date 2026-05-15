import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { saveLocalProfile, defaultProfile } from '@/api/contact'

export default function Register() {
  const navigate = useNavigate()

  // Odoo res.partner fields
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [company, setCompany] = useState('')

  // Auth only
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim())          { setError('กรุณาระบุชื่อ-นามสกุล'); return }
    if (password.length < 6)   { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (password !== confirm)  { setError('รหัสผ่านไม่ตรงกัน'); return }

    // Save auth session
    localStorage.setItem(
      'flowpdpa_reg_' + email,
      JSON.stringify({ name: name.trim(), password }),
    )
    localStorage.setItem(
      'flowpdpa_auth',
      JSON.stringify({ email, name: name.trim(), plan: 'Free', company: company.trim(), phone: phone.trim() }),
    )

    // Create initial Odoo-aligned contact profile
    saveLocalProfile(email, {
      ...defaultProfile(),
      name:         name.trim(),
      email,
      phone:        phone.trim(),
      company_name: company.trim(),
    })

    navigate('/dashboard')
  }

  const inputCls   = "w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
  const onFocus    = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--green)')
  const onBlur     = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')

  const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-1.5"
  const labelStyle = { color: '#64748b' }

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

              {/* ── Contact Info (res.partner) ── */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
                  ข้อมูลติดต่อ
                </p>

                {/* Name */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    ชื่อ-นามสกุล <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="text" required placeholder="ชื่อ นามสกุล"
                    value={name} onChange={e => { setName(e.target.value); setError('') }}
                    className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    อีเมล <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="email" required placeholder="email@company.com"
                    value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                    className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                {/* Phone + Company */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={labelStyle}>โทรศัพท์</label>
                    <input
                      type="tel" placeholder="08x-xxx-xxxx"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>บริษัท / องค์กร</label>
                    <input
                      type="text" placeholder="ชื่อบริษัท..."
                      value={company} onChange={e => setCompany(e.target.value)}
                      className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                </div>
              </div>

              {/* ── Security ── */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
                  ความปลอดภัย
                </p>

                <div>
                  <label className={labelCls} style={labelStyle}>
                    รหัสผ่าน <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="password" required placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                    className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                <div>
                  <label className={labelCls} style={labelStyle}>
                    ยืนยันรหัสผ่าน <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="password" required placeholder="••••••••"
                    value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
                    className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
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
                className="btn-green w-full py-3 text-sm mt-2"
                style={{ borderRadius: '8px' }}
              >
                สร้างบัญชี
              </button>

              <p className="text-xs text-center" style={{ color: '#334155' }}>
                การสมัครสมาชิกถือว่าคุณยอมรับ{' '}
                <Link to="/terms" className="underline" style={{ color: '#475569' }}>เงื่อนไขการใช้งาน</Link>
                {' '}และ{' '}
                <Link to="/privacy-policy" className="underline" style={{ color: '#475569' }}>นโยบายความเป็นส่วนตัว</Link>
              </p>
            </form>

            <div className="flex items-center gap-3 my-6">
              <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <span className="text-xs" style={{ color: '#334155' }}>มีบัญชีแล้ว?</span>
              <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </div>

            <Link
              to="/login"
              className="block w-full py-3 text-sm font-semibold text-center rounded-lg transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              เข้าสู่ระบบ
            </Link>
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
