export default function UpdateBanner() {
  return (
    <div style={{ backgroundColor: '#f0faf5', borderBottom: '1px solid #c8ded6' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-3 flex-wrap">
        <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: 'var(--green)', color: '#ffffff', borderRadius: '4px' }}>New</span>
        <p className="text-sm" style={{ color: '#374151' }}>
          ตอนนี้คุณสามารถแก้ไขนโยบายเดิมได้ทุกส่วน พร้อมรองรับการเพิ่มเงื่อนไขพิเศษสำหรับธุรกิจของคุณ
        </p>
        <a href="/get-started" className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--green)' }}>
          Learn more →
        </a>
      </div>
    </div>
  )
}
