import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { isValidEmail } from '@/utils/validation'
import './Register.css'
import './Login.css'

type Step = 'email' | 'reset' | 'done'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault()
    setError('')
    if (!isValidEmail(email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    setStep('reset')
    setSendingCode(true)
    setCooldown(60)
    const response = await api.auth.passwordReset.request({ email: normalizedEmail })
    setSendingCode(false)
    if (!response.success) {
      setCooldown(0)
      setError(response.error?.message || 'ไม่สามารถส่งรหัสได้ กรุณาลองใหม่')
      return
    }

    setEmail(normalizedEmail)
    setCooldown(response.data?.canResendIn ?? 60)
  }

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(otp)) {
      setError('กรุณากรอกรหัส 6 หลักจากอีเมล')
      return
    }
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setResetting(true)
    const response = await api.auth.passwordReset.confirm({ email, otp, newPassword: password })
    setResetting(false)
    if (!response.success) {
      setError(response.error?.message || 'รหัสไม่ถูกต้องหรือหมดอายุแล้ว')
      return
    }
    setStep('done')
  }

  return (
    <div className="register-shell min-h-screen flex flex-col">
      <header className="register-topbar px-6 flex items-center justify-between w-full">
        <Link to="/" className="flex items-center gap-3">
          <span className="register-brand-mark">FP</span>
          <span className="font-bold text-base text-gray-900">FlowPDPA</span>
        </Link>
        <Link to="/support" className="text-xs font-medium text-gray-500 hover:text-gray-900">ต้องการความช่วยเหลือ?</Link>
      </header>

      <main className="register-main">
        <div className="login-layout">
          <section className="register-card login-card">
            <div className="register-icon flex items-center justify-center mb-6">
              {step === 'done'
                ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--green)' }} />
                : <KeyRound className="w-5 h-5" style={{ color: 'var(--green)' }} />}
            </div>

            {step === 'email' && (
              <>
                <h1 className="text-2xl font-bold mb-1">ลืมรหัสผ่าน</h1>
                <p className="text-sm mb-8">กรอกอีเมลที่ใช้สมัคร ระบบจะส่งรหัสสำหรับตั้งรหัสผ่านใหม่</p>
                <form onSubmit={requestCode} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">อีเมล</label>
                    <input type="email" required autoFocus autoComplete="email" value={email}
                      onChange={event => { setEmail(event.target.value.trimStart()); setError('') }}
                      placeholder="email@company.com" className="w-full px-4 py-3 text-sm" />
                  </div>
                  {error && <ErrorMessage message={error} />}
                  <SubmitButton loading={sendingCode} label="ส่งรหัสรีเซ็ต" loadingLabel="กำลังส่งรหัส..." />
                </form>
              </>
            )}

            {step === 'reset' && (
              <>
                <h1 className="text-2xl font-bold mb-1">ตั้งรหัสผ่านใหม่</h1>
                <p className="text-sm mb-8">กรอกรหัส 6 หลักที่ส่งไปยัง <strong>{email}</strong></p>
                {sendingCode && (
                  <div className="register-status flex items-center gap-2 px-4 py-3 mb-5 text-xs" role="status">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>กำลังส่งรหัสไปยังอีเมลของคุณ...</span>
                  </div>
                )}
                <form onSubmit={confirmReset} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">รหัสยืนยัน</label>
                    <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
                      onChange={event => { setOtp(event.target.value.replace(/\D/g, '')); setError('') }}
                      placeholder="000000" className="w-full px-4 py-3 text-sm" />
                  </div>
                  <PasswordField label="รหัสผ่านใหม่" value={password} show={showPassword} onToggle={() => setShowPassword(value => !value)} onChange={setPassword} />
                  <PasswordField label="ยืนยันรหัสผ่านใหม่" value={confirmPassword} show={showPassword} onToggle={() => setShowPassword(value => !value)} onChange={setConfirmPassword} />
                  {error && <ErrorMessage message={error} />}
                  <SubmitButton loading={resetting || sendingCode} label="เปลี่ยนรหัสผ่าน" loadingLabel={sendingCode ? 'กำลังส่งรหัส...' : 'กำลังบันทึก...'} />
                  <button type="button" disabled={sendingCode || resetting || cooldown > 0} onClick={() => requestCode()}
                    className="register-login-link w-full py-3 text-sm font-semibold disabled:opacity-50">
                    {sendingCode ? 'กำลังส่งรหัส...' : cooldown > 0 ? `ส่งรหัสใหม่ได้ใน ${cooldown} วินาที` : 'ส่งรหัสใหม่'}
                  </button>
                </form>
              </>
            )}

            {step === 'done' && (
              <>
                <h1 className="text-2xl font-bold mb-1">เปลี่ยนรหัสผ่านแล้ว</h1>
                <p className="text-sm mb-8">ใช้รหัสผ่านใหม่เพื่อเข้าสู่ระบบได้ทันที</p>
                <button type="button" onClick={() => navigate('/login', { replace: true })} className="btn-green w-full py-3 text-sm">เข้าสู่ระบบ</button>
              </>
            )}

            {step !== 'done' && (
              <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm font-medium text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" /> กลับไปเข้าสู่ระบบ
              </Link>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="register-error flex items-start gap-2 text-xs px-4 py-3 rounded border" role="alert"><AlertCircle className="w-4 h-4 shrink-0" /><span>{message}</span></div>
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return <button type="submit" disabled={loading} className="btn-green w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60">{loading && <Loader2 className="w-4 h-4 animate-spin" />}{loading ? loadingLabel : label}</button>
}

function PasswordField({ label, value, show, onToggle, onChange }: { label: string; value: string; show: boolean; onToggle: () => void; onChange: (value: string) => void }) {
  return <div><label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label><div className="relative"><input type={show ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={value} onChange={event => onChange(event.target.value)} className="w-full px-4 py-3 pr-11 text-sm" /><button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700" aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
}
