import { useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import aaccLogo from '../../logo/AACC logo 3 2-01 (3).png'
import universityLogo from '../../logo/messageImage_1791339136580.jpg'
import digitalValleyLogo from '../../logo/New Logo KKDV (1).png'
import lawFacultyLogo from '../../logo/ตรานิติ_มข.png'

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
).replace(/\/$/, '')

const TOP_LEVEL_HEADING = /^\d{1,2}\.\s+/
const SUB_HEADING = /^\d+\.\d+\s+/
const TABLE_OF_CONTENTS_ENTRY = /^\d{1,2}\.\s+.*\t\d+$/

export default function PrivacyNotice() {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadPrivacyNotice = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/privacy-notice/content`, {
          signal: controller.signal,
          headers: { Accept: 'text/plain' },
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        setContent(await response.text())
      } catch (requestError) {
        if (controller.signal.aborted) return
        console.error('Unable to load Privacy Notice', requestError)
        setError('ไม่สามารถโหลดนโยบายความเป็นส่วนตัวได้ กรุณาลองใหม่อีกครั้ง')
      }
    }

    void loadPrivacyNotice()
    return () => controller.abort()
  }, [])

  const lines = useMemo(
    () => content.replace(/\r\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean),
    [content],
  )

  return (
    <div style={{ paddingTop: '61px' }}>
      <div className="py-16 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center gap-x-7 gap-y-5" aria-label="หน่วยงานที่เกี่ยวข้อง">
            <img src={aaccLogo} alt="AA & CC" className="h-10 w-auto max-w-[150px] object-contain" />
            <img src={universityLogo} alt="มหาวิทยาลัยขอนแก่น" className="h-10 w-auto max-w-[170px] object-contain" />
            <img src={digitalValleyLogo} alt="Khon Kaen Digital Valley" className="h-11 w-auto max-w-[180px] object-contain" />
            <img src={lawFacultyLogo} alt="คณะนิติศาสตร์ มหาวิทยาลัยขอนแก่น" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-gray-500 text-sm">แพลตฟอร์ม Flow PDPA</p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-600 leading-8">
          {!content && !error && <p className="text-gray-400">กำลังโหลดนโยบายความเป็นส่วนตัว...</p>}
          {error && <p className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-700">{error}</p>}

          {lines.map((line, index) => {
            if (index < 2) return null
            if (line === 'สารบัญ') {
              return <h2 key={index} className="mt-0 mb-5 text-2xl font-bold text-gray-900">สารบัญ</h2>
            }
            if (TABLE_OF_CONTENTS_ENTRY.test(line)) {
              const [label, page] = line.split('\t')
              return (
                <div key={index} className="flex gap-4 border-b border-dotted border-gray-200 py-1.5 text-sm">
                  <span className="grow">{label}</span>
                  <span className="text-gray-400">{page}</span>
                </div>
              )
            }
            if (TOP_LEVEL_HEADING.test(line)) {
              return <h2 key={index} className="mt-12 mb-4 text-xl font-bold text-gray-900">{line}</h2>
            }
            if (SUB_HEADING.test(line)) {
              return <p key={index} className="mt-5 font-semibold text-gray-800">{line}</p>
            }
            if (line.startsWith('ตั้งอยู่ที่')) {
              return (
                <aside
                  key={index}
                  className="mt-12 flex items-start gap-4 border-l-4 border-emerald-600 bg-emerald-50/70 px-5 py-5"
                  aria-label="ที่อยู่บริษัท"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">ที่อยู่บริษัท</p>
                    <address className="mt-1 not-italic leading-7 text-gray-800">{line}</address>
                  </div>
                </aside>
              )
            }
            return <p key={index} className="mt-3">{line}</p>
          })}
        </article>
      </div>
    </div>
  )
}
