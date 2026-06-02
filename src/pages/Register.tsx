import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, RefreshCw, CheckCircle, Loader2 } from 'lucide-react'
import { defaultProfile } from '@/api/contact'
import { storage } from '@/utils/storage'

interface InitiateData {
  name: string
  email: string
  password: string
  confirm: string
  phone?: string
  company?: string
}

export default function Register() {
  const navigate = useNavigate()

  // Step management
  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState<InitiateData>({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    company: ''
  })

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiryCountdown, setExpiryCountdown] = useState(300) // 5 minutes

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) { setError('กรุณาระบุชื่อ-นามสกุล'); return }
    if (formData.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (formData.password !== formData.confirm) { setError('รหัสผ่านไม่ตรงกัน'); return }

    setLoading(true)
    try {
      // Simulate successful registration initiation
      setEmail(formData.email)
      setStep('verify')
      setExpiryCountdown(300) // 5 minutes
      startResendCooldown(60) // 1 minute cooldown

      // Store registration data for verification
      storage.registration.set(formData.email, {
        name: formData.name.trim(),
        password: formData.password
      })

    } catch (err) {
      console.error('Registration error:', err)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setError('กรุณากรอกรหัสยืนยัน 6 หลัก')
      return
    }

    setLoading(true)
    try {
      // Simulate successful verification
      const regData = storage.registration.get(email)
      if (regData && otpValue === '123456') { // Demo OTP
        // Auto-login
        storage.auth.set({
          email,
          name: regData.name,
          plan: 'Free',
          token: 'verified-token',
          company: formData.company,
          phone: formData.phone
        })

        // Create initial profile
        storage.profile.set(email, {
          ...defaultProfile(),
          name: regData.name,
          email,
          phone: formData.phone || '',
          company_name: formData.company || ''
        })

        // Show success briefly before redirecting
        setStep('success')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } else {
        setError('รหัสยืนยันไม่ถูกต้อง')
      }

    } catch (err) {
      console.error('OTP verification error:', err)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    try {
      // Simulate successful resend
      setExpiryCountdown(300) // 5 minutes
      startResendCooldown(60) // 1 minute
      setError('') // Clear any previous errors

    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setResendLoading(false)
    }
  }

  const startResendCooldown = (seconds: number) => {
    setResendCooldown(seconds)
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        setTimeout(() => {
          const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
          nextInput?.focus()
        }, 10)
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      e.preventDefault()
      setTimeout(() => {
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement
        prevInput?.focus()
      }, 10)
    }
  }

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (step === 'verify' && expiryCountdown > 0) {
      const timer = setInterval(() => {
        setExpiryCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, expiryCountdown])

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

      {/* Main Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {step === 'form' ? (
            <>
              <div className="rounded-2xl p-8 sm:p-10" style={{
                backgroundColor: '#0f1f38',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
              }}>
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
                  <UserPlus className="w-6 h-6" style={{ color: 'var(--green)' }} />
                </div>

                <h1 className="text-2xl font-black text-white mb-1">สมัครสมาชิก</h1>
                <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                  กรอกข้อมูลและรับรหัสยืนยันทางอีเมล
                </p>

                <form onSubmit={handleInitiate} className="space-y-4">

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
                    value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); setError('') }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    อีเมล <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="email" required placeholder="email@company.com"
                    value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value}); setError('') }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                {/* Phone + Company */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={labelStyle}>โทรศัพท์</label>
                    <input
                      type="tel" placeholder="08x-xxx-xxxx"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>บริษัท / องค์กร</label>
                    <input
                      type="text" placeholder="ชื่อบริษัท..."
                      value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
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
                    value={formData.password} onChange={e => { setFormData({...formData, password: e.target.value}); setError('') }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                <div>
                  <label className={labelCls} style={labelStyle}>
                    ยืนยันรหัสผ่าน <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="password" required placeholder="••••••••"
                    value={formData.confirm} onChange={e => { setFormData({...formData, confirm: e.target.value}); setError('') }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
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
                disabled={loading}
                className="btn-green w-full py-3 text-sm mt-2 flex items-center justify-center gap-2"
                style={{
                  borderRadius: '8px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    ส่งรหัสยืนยัน
                  </>
                )}
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
            </>
          ) : step === 'verify' ? (
            <div className="rounded-2xl p-8 sm:p-10" style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}>
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
                <Mail className="w-6 h-6" style={{ color: 'var(--green)' }} />
              </div>

              <h1 className="text-2xl font-black text-white mb-1">ยืนยันอีเมล</h1>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                กรอกรหัสยืนยัน 6 หลักที่ส่งไปยัง {email}
              </p>

              {/* OTP Input */}
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="flex justify-center gap-3 mb-6">
                      {otp.map((digit, index) => (
                        <div
                          key={index}
                          className="relative"
                        >
                          <input
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e as React.KeyboardEvent<HTMLInputElement>)}
                            className="w-14 h-16 text-center text-3xl font-bold tracking-wider rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                              backgroundColor: digit ? 'rgba(5,150,105,0.1)' : 'rgba(255,255,255,0.05)',
                              color: 'white',
                              borderColor: digit ? 'var(--green)' : 'rgba(255,255,255,0.2)',
                              boxShadow: digit ? '0 0 0 3px rgba(5,150,105,0.2)' : 'none'
                            }}
                            autoFocus={index === 0}
                          />
                          {index === 0 && !digit && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                              <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>1</span>
                            </div>
                          )}
                          {index === 2 && !digit && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                              <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>2</span>
                            </div>
                          )}
                          {index === 4 && !digit && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                              <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>3</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-1 text-xs">
                      <span style={{ color: '#9ca3af' }}>จำนวนเลข</span>
                      <span className="mx-2" style={{ color: '#475569' }}>•</span>
                      <span style={{ color: '#9ca3af' }}>เวลาที่เหลือ</span>
                    </div>
                  </div>

                  {/* Timer */}
                  {expiryCountdown > 0 ? (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <svg className="w-4 h-4 animate-pulse" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                        หมดอายุใน {formatTime(expiryCountdown)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <svg className="w-4 h-4" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: '#ef4444' }}>
                        รหัสหมดอายุแล้ว
                      </span>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="text-xs px-4 py-3 rounded-lg text-center" style={{
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.2)'
                    }}>
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading || otp.join('').length !== 6 || expiryCountdown === 0}
                      className="flex-1 btn-green py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg"
                      style={{
                        opacity: (loading || otp.join('').length !== 6 || expiryCountdown === 0) ? 0.5 : 1,
                        boxShadow: (loading || otp.join('').length !== 6 || expiryCountdown === 0) ? 'none' : '0 4px 12px rgba(5,150,105,0.3)'
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          กำลังยืนยัน...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          ยืนยัน
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading || resendCooldown > 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: resendCooldown > 0 ? '#64748b' : '#94a3b8',
                        opacity: (resendLoading || resendCooldown > 0) ? 0.5 : 1,
                        cursor: (resendLoading || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                        backgroundColor: resendLoading || resendCooldown > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? `${resendCooldown}s` : 'ส่งใหม่'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="text-xs underline transition-colors hover:opacity-80"
                      style={{ color: '#64748b' }}
                    >
                      ← กลับไปกรอกข้อมูล
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl p-8 sm:p-10 text-center" style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: 'var(--green)' }} />
              </div>

              <h1 className="text-2xl font-black text-white mb-2">ยืนยนอีเมลสำเร็จ! 🎉</h1>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                บัญชีของคุณถูกสร้างแล้ว กำลังนำทางคุณไปสู่ Dashboard...
              </p>

              <div className="w-12 h-12 rounded-full border-4 border-gray-500 mx-auto mb-4 border-t-transparent animate-spin" style={{ borderTopColor: 'var(--green)' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
