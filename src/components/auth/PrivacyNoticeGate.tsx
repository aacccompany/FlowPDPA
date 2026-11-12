import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'

interface PrivacyNoticeGateProps {
  children: React.ReactNode
}

export default function PrivacyNoticeGate({ children }: PrivacyNoticeGateProps) {
  const navigate = useNavigate()
  const { auth, logout, updateUser } = useAuth()
  const [version, setVersion] = useState(auth?.privacyNoticeVersion ?? '')
  const [checking, setChecking] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.auth.privacyNotice.status().then(response => {
      if (!active) return
      if (response.success && response.data) {
        setVersion(response.data.currentVersion)
        if (response.data.accepted) {
          updateUser({
            privacyNoticeAccepted: true,
            privacyNoticeVersion: response.data.acceptedVersion,
            privacyNoticeAcceptedAt: response.data.acceptedAt,
          })
        }
      } else {
        setError(response.error?.message || 'ไม่สามารถตรวจสอบสถานะ Privacy Notice ได้')
      }
      setChecking(false)
    })
    return () => { active = false }
  }, [updateUser])

  if (auth?.privacyNoticeAccepted) return children

  const decline = () => {
    logout()
    navigate('/login', { replace: true, state: { privacyNoticeDeclined: true } })
  }

  const accept = async () => {
    if (!version || accepting) return
    setAccepting(true)
    setError('')
    const response = await api.auth.privacyNotice.accept(version)
    if (response.success && response.data) {
      updateUser({
        privacyNoticeAccepted: true,
        privacyNoticeVersion: response.data.acceptedVersion,
        privacyNoticeAcceptedAt: response.data.acceptedAt,
      })
    } else {
      setError(response.error?.message || 'บันทึกการรับทราบไม่สำเร็จ กรุณาลองใหม่')
      if (response.error?.code === 'PRIVACY_NOTICE_VERSION_CHANGED') {
        const latest = await api.auth.privacyNotice.status()
        if (latest.success && latest.data) setVersion(latest.data.currentVersion)
      }
    }
    setAccepting(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-notice-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="border-b border-slate-100 bg-emerald-50 px-6 py-5 sm:px-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Privacy Notice</p>
          <h1 id="privacy-notice-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
            กรุณาอ่านและรับทราบก่อนใช้งาน FlowPDPA
          </h1>
        </header>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5 text-sm leading-7 text-slate-600 sm:px-8">
          <p className="mb-4">
            FlowPDPA เก็บและใช้ข้อมูลบัญชีของคุณเพื่อยืนยันตัวตน ให้บริการแพลตฟอร์ม
            ดูแลความปลอดภัย ติดต่อเกี่ยวกับบริการ และปฏิบัติตามกฎหมายที่เกี่ยวข้อง
          </p>
          <ul className="mb-5 list-disc space-y-2 pl-5">
            <li>ข้อมูลบัญชีและข้อมูลติดต่อ เช่น ชื่อ อีเมล เบอร์โทรศัพท์ และข้อมูลองค์กร</li>
            <li>ข้อมูลการใช้งาน ระบบรักษาความปลอดภัย IP address และบันทึกกิจกรรม</li>
            <li>ข้อมูลจะถูกเก็บเท่าที่จำเป็น และอาจเปิดเผยแก่ผู้ให้บริการที่จำเป็นต่อการให้บริการ</li>
            <li>คุณสามารถใช้สิทธิเกี่ยวกับข้อมูลส่วนบุคคลได้ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล</li>
          </ul>
          <Link
            to="/privacy-notice"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
          >
            อ่าน Privacy Notice ฉบับเต็ม <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {version ? <p className="mt-3 text-xs text-slate-400">เวอร์ชัน {version}</p> : null}

          <div className="mt-5 flex gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            เมื่อกดยอมรับ ระบบจะส่งอีเมลยืนยันไปยัง {auth?.email}
          </div>
          {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={decline}
            disabled={accepting}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            ไม่ยอมรับและออกจากระบบ
          </button>
          <button
            type="button"
            onClick={() => void accept()}
            disabled={checking || accepting || !version}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking || accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {checking ? 'กำลังตรวจสอบ...' : accepting ? 'กำลังบันทึก...' : 'ยอมรับและเข้าใช้งาน'}
          </button>
        </footer>
      </section>
    </div>
  )
}
