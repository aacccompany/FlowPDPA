import { Link } from 'react-router-dom'
import { ArrowLeft, FileX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4" style={{ paddingTop: '61px' }}>
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--green-light)' }}>
            <FileX className="w-10 h-10" style={{ color: 'var(--green)' }} />
          </div>
        </div>
        <div className="text-7xl font-black text-gray-100 leading-none mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          หน้านี้อาจถูกย้าย ลบออก หรือ URL ที่คุณพิมพ์ไม่ถูกต้อง
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-green px-8 py-3 inline-flex items-center justify-center gap-2" style={{ borderRadius: '8px' }}>
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าแรก
          </Link>
          <Link to="/faq" className="btn-outline-green px-8 py-3 inline-flex items-center justify-center" style={{ borderRadius: '8px' }}>
            ดู FAQ
          </Link>
        </div>
      </div>
    </div>
  )
}
