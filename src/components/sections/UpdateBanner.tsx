export default function UpdateBanner() {
  return (
    <div className="bg-green-600 py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3">
        <span className="text-white text-xs font-semibold uppercase tracking-wider">New</span>
        <span className="w-1 h-1 rounded-full bg-white/50" />
        <p className="text-white text-sm">
          ตอนนี้คุณสามารถแก้ไขนโยบายเดิมได้ทุกส่วน พร้อมรองรับการเพิ่มเงื่อนไขพิเศษสำหรับธุรกิจของคุณ
        </p>
        <a href="/create/policy" className="text-white text-xs font-semibold underline underline-offset-2 whitespace-nowrap">
          Learn more →
        </a>
      </div>
    </div>
  )
}
