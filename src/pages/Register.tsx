import { useCallback, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Clock3, UserPlus, Mail, RefreshCw, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { normalizeRole, roleHome, storage } from '@/utils/storage'
import { isValidEmail, isValidThaiPhone, sanitizeThaiPhone } from '@/utils/validation'
import './Register.css'

interface InitiateData {
  name: string
  email: string
  password: string
  confirm: string
  phone: string
  company: string
}

const formatCooldown = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const verificationState = location.state as { verificationEmail?: string; otpSent?: boolean; requestOtp?: boolean } | null
  const automaticResendStarted = useRef(false)

  // Step management
  const [step, setStep] = useState<'form' | 'verify' | 'success'>(verificationState?.verificationEmail ? 'verify' : 'form')
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
  const [email, setEmail] = useState(verificationState?.verificationEmail ?? '')
  const [initiating, setInitiating] = useState(false)
  const [otpReady, setOtpReady] = useState(Boolean(verificationState?.otpSent))
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiryCountdown, setExpiryCountdown] = useState(300) // 5 minutes

  const startResendCooldown = useCallback((seconds: number) => {
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
  }, [])

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) { setError('กรุณาระบุชื่อ-นามสกุล'); return }
    if (!isValidEmail(formData.email)) { setError('กรุณากรอกอีเมลให้ถูกต้อง'); return }
    if (formData.phone && !isValidThaiPhone(formData.phone)) { setError('กรุณากรอกเบอร์โทรศัพท์ไทยให้ถูกต้อง'); return }
    if (formData.password.length < 8) { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return }
    if (formData.password !== formData.confirm) { setError('รหัสผ่านไม่ตรงกัน'); return }

    const normalizedEmail = formData.email.trim().toLowerCase()
    setEmail(normalizedEmail)
    setOtpReady(false)
    setInitiating(true)
    setStep('verify')
    try {
      const response = await api.auth.register.initiate({
        name: formData.name.trim(),
        email: normalizedEmail,
        password: formData.password,
        phone: formData.phone,
        company: formData.company,
      })
      if (!response.success) {
        setError(response.error?.message || 'ไม่สามารถสมัครสมาชิกได้')
        return
      }

      setOtpReady(true)
      setExpiryCountdown(300)
      startResendCooldown(60)

      const data = response.data
      const token = data?.token ?? data?.access_token
      if (token && data?.user) {
        const role = normalizeRole(data.user.role)
        storage.auth.set({
          id: data.user.id,
          email: data.user.email ?? normalizedEmail,
          name: data.user.name ?? formData.name.trim(),
          plan: data.user.plan ?? 'Free',
          role,
          token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
          company: formData.company,
          phone: formData.phone,
          emailVerified: false,
        })
        navigate(roleHome(role), { replace: true })
      }

    } catch (err) {
      console.error('Registration error:', err)
      setError('ส่งรหัสไม่สำเร็จ กรุณากลับไปตรวจสอบข้อมูลแล้วลองใหม่')
    } finally {
      setInitiating(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otpReady || initiating) return

    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setError('กรุณากรอกรหัสยืนยัน 6 หลัก')
      return
    }

    setLoading(true)
    try {
      const response = await api.auth.register.verify({ email, otp: otpValue })
      if (!response.success || !response.data) {
        setError(response.error?.message || 'รหัสยืนยันไม่ถูกต้อง')
        return
      }

      const data = response.data as {
        token?: string
        access_token?: string
        refresh_token?: string
        expires_in?: number
        user?: { id?: string; email?: string; name?: string; role?: string; plan?: string }
      }
      const token = data.token ?? data.access_token
      if (!token) {
        setError('Verification response did not include an access token')
        return
      }

      const role = normalizeRole(data.user?.role)
      storage.auth.set({
        id: data.user?.id,
        email: data.user?.email ?? email,
        name: data.user?.name ?? formData.name.trim(),
        plan: data.user?.plan ?? 'Free',
        role,
        token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
        company: formData.company,
        phone: formData.phone,
        emailVerified: true,
      })
      setStep('success')
      setTimeout(() => navigate(roleHome(role), { replace: true }), 2000)

    } catch (err) {
      console.error('OTP verification error:', err)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = useCallback(async () => {
    setResendLoading(true)
    setError('')
    try {
      const response = await api.auth.register.resendOtp({ email })
      if (!response.success) {
        const details = response.error?.details && typeof response.error.details === 'object'
          ? response.error.details as Record<string, unknown>
          : {}
        if (response.error?.code === 'RESEND_COOLDOWN') {
          const seconds = typeof details.canResendIn === 'number' ? details.canResendIn : 60
          setOtpReady(true)
          startResendCooldown(seconds)
          setError('รหัสยืนยันเดิมยังใช้งานได้ กรุณาตรวจสอบอีเมลของคุณ')
          return
        }
        if (response.error?.code === 'MAX_RESEND_EXCEEDED') {
          const seconds = typeof details.retryAfter === 'number' ? details.retryAfter : 900
          setOtpReady(true)
          startResendCooldown(seconds)
          setError(`ขอรหัสใหม่ครบ 3 ครั้งแล้ว รหัสล่าสุดยังใช้ได้ 5 นาที หรือขอใหม่ได้ใน ${Math.ceil(seconds / 60)} นาที`)
          return
        }
        if (response.error?.code === 'DAILY_OTP_LIMIT_EXCEEDED') {
          const seconds = typeof details.retryAfter === 'number' ? details.retryAfter : 86400
          setOtpReady(true)
          startResendCooldown(seconds)
          setError(`ส่งรหัสครบ 10 ครั้งใน 24 ชั่วโมงแล้ว ขอใหม่ได้ใน ${Math.ceil(seconds / 3600)} ชั่วโมง`)
          return
        }
        setError(response.error?.message || 'ไม่สามารถส่งรหัสยืนยันใหม่ได้')
        return
      }
      setExpiryCountdown(300)
      setOtpReady(true)
      startResendCooldown(60)

    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setResendLoading(false)
    }
  }, [email, startResendCooldown])

  useEffect(() => {
    if (!verificationState?.requestOtp || !email || automaticResendStarted.current) return
    automaticResendStarted.current = true
    setInitiating(true)
    void handleResend().finally(() => setInitiating(false))
  }, [email, handleResend, verificationState?.requestOtp])

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
    if (step === 'verify' && otpReady && expiryCountdown > 0) {
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
  }, [step, otpReady, expiryCountdown])

  useEffect(() => {
    if (step === 'verify' && otpReady) {
      document.getElementById('otp-0')?.focus()
    }
  }, [step, otpReady])

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-1.5"
  const labelStyle = { color: '#64748b' }

  return (
    <div className="register-shell min-h-screen flex flex-col">

      {/* Top bar */}
      <div className="register-topbar px-6 flex items-center justify-between w-full">
        <Link to="/" className="flex items-center gap-3">
          <span className="register-brand-mark">FP</span>
          <span className="font-bold text-base text-gray-900">FlowPDPA</span>
        </Link>
        <Link
          to="/support"
          className="text-xs font-medium transition-colors"
          style={{ color: '#667085' }}
        >
          ต้องการความช่วยเหลือ?
        </Link>
      </div>

      {/* Main Card */}
      <div className="register-main">
        <div className="register-layout">
          <div className="register-panel">

          {step === 'form' ? (
            <>
              <div className="register-card rounded-2xl p-8 sm:p-10" style={{
                backgroundColor: '#0f1f38',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
              }}>
                {/* Icon */}
                <div className="register-icon w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
                  <UserPlus className="w-6 h-6" style={{ color: 'var(--green)' }} />
                </div>

                <h1 className="text-2xl font-black text-white mb-1">สมัครสมาชิก</h1>
                <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                  กรอกข้อมูลและรับรหัสยืนยันทางอีเมล
                </p>

                <form onSubmit={handleInitiate} className="space-y-4">

              {/* ── Contact Info (res.partner) ── */}
              <div
                className="register-section rounded-xl p-4 space-y-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="register-section-title text-xs font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
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
                    value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value.trimStart()}); setError('') }}
                    autoComplete="email"
                    aria-invalid={Boolean(formData.email) && !isValidEmail(formData.email)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  {formData.email && !isValidEmail(formData.email) && (
                    <p className="text-xs text-red-400 mt-1.5">กรอกอีเมล เช่น name@company.com</p>
                  )}
                </div>

                {/* Phone + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={labelStyle}>โทรศัพท์ไทย</label>
                    <input
                      type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="0812345678"
                      value={formData.phone} onChange={e => { setFormData({...formData, phone: sanitizeThaiPhone(e.target.value)}); setError('') }}
                      aria-invalid={Boolean(formData.phone) && !isValidThaiPhone(formData.phone)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                    {formData.phone && !isValidThaiPhone(formData.phone) && (
                      <p className="text-xs text-red-400 mt-1.5">เบอร์มือถือไทย 10 หลัก หรือสำนักงาน 9 หลัก</p>
                    )}
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
                className="register-section rounded-xl p-4 space-y-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="register-section-title text-xs font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
                  ความปลอดภัย
                </p>

                <div>
                  <label className={labelCls} style={labelStyle}>
                    รหัสผ่าน <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="password" required placeholder="อย่างน้อย 8 ตัวอักษร"
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
                  className="register-error text-xs px-4 py-3 rounded"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={initiating}
                className="btn-green w-full py-3 text-sm mt-2 flex items-center justify-center gap-2"
                style={{
                  borderRadius: '8px',
                  opacity: initiating ? 0.7 : 1
                }}
              >
                {initiating ? (
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
              <span className="register-divider flex-1 h-px" />
              <span className="text-xs text-gray-500">มีบัญชีแล้ว?</span>
              <span className="register-divider flex-1 h-px" />
            </div>

            <Link
              to="/login"
              className="register-login-link block w-full py-3 text-sm font-semibold text-center rounded transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              เข้าสู่ระบบ
            </Link>
          </div>

          <div className="register-legal flex items-center justify-center gap-5 mt-6">
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
            <div className="register-card rounded-2xl p-8 sm:p-10" style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}>
              {/* Icon */}
              <div className="register-icon w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
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
                            disabled={!otpReady || initiating}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e as React.KeyboardEvent<HTMLInputElement>)}
                            className="register-otp text-center tracking-wider transition-colors focus:outline-none disabled:cursor-wait disabled:opacity-60"
                            style={{
                              backgroundColor: digit ? '#edf5f2' : '#fff',
                              color: '#172033',
                              borderColor: digit ? 'var(--green)' : '#d0d5dd',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">กรอกรหัสตัวเลข 6 หลักจากอีเมล</p>
                  </div>

                  {initiating ? (
                    <div className="register-status flex items-start gap-3 py-3 px-4">
                      <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
                      <div>
                        <p className="text-sm font-semibold">กำลังส่งรหัสยืนยัน</p>
                        <p className="text-xs mt-0.5 opacity-75">อยู่หน้านี้ได้เลย ช่องกรอกรหัสจะเปิดเมื่อพร้อมใช้งาน</p>
                      </div>
                    </div>
                  ) : otpReady && expiryCountdown > 0 ? (
                    <div className="register-status flex items-center justify-center gap-2 py-3 px-4">
                      <Clock3 className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm font-medium">
                        หมดอายุใน {formatTime(expiryCountdown)}
                      </span>
                    </div>
                  ) : otpReady ? (
                    <div className="register-error flex items-center justify-center gap-2 py-3 px-4 rounded border">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm font-medium">
                        รหัสหมดอายุแล้ว
                      </span>
                    </div>
                  ) : null}

                  {/* Error Message */}
                  {error && (
                    <div className="register-error text-xs px-4 py-3 rounded text-center" style={{
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
                      disabled={initiating || !otpReady || loading || otp.join('').length !== 6 || expiryCountdown === 0}
                      className="flex-1 btn-green py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg"
                      style={{
                        opacity: (initiating || !otpReady || loading || otp.join('').length !== 6 || expiryCountdown === 0) ? 0.5 : 1,
                        boxShadow: 'none'
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
                      disabled={initiating || !otpReady || resendLoading || resendCooldown > 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all"
                      style={{
                        border: '1px solid #d0d5dd',
                        color: resendCooldown > 0 ? '#98a2b3' : '#475467',
                        opacity: (initiating || !otpReady || resendLoading || resendCooldown > 0) ? 0.5 : 1,
                        cursor: (initiating || !otpReady || resendLoading || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                        backgroundColor: '#fff'
                      }}
                    >
                      <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? formatCooldown(resendCooldown) : 'ส่งใหม่'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      disabled={initiating}
                      onClick={() => setStep('form')}
                      className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-wait"
                      style={{ color: '#64748b' }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> กลับไปกรอกข้อมูล
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="register-card rounded-2xl p-8 sm:p-10 text-center" style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: 'var(--green)' }} />
              </div>

              <h1 className="text-2xl font-black text-white mb-2">ยืนยันอีเมลสำเร็จ</h1>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                บัญชีของคุณถูกสร้างแล้ว กำลังนำทางคุณไปสู่ Dashboard...
              </p>

              <div className="w-12 h-12 rounded-full border-4 border-gray-500 mx-auto mb-4 border-t-transparent animate-spin" style={{ borderTopColor: 'var(--green)' }}></div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
