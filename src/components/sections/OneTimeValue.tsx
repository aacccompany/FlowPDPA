const benefits = [
  { title: 'โฮสติ้งฟรีตลอดชีพ', desc: 'นโยบายของคุณถูกโฮสด์บนเซิร์ฟเวอร์ของเรา พร้อมลิงก์สาธารณะแชร์ได้ทันที' },
  { title: 'HTML Code สำหรับเว็บไซต์', desc: 'นำโค้ดไปวางบนเว็บไซต์ได้เลย รองรับทุกแพลตฟอร์ม' },
  { title: 'Dashboard จัดการนโยบาย', desc: 'ดูและแก้ไขทุก Policy ของคุณได้ในหน้าเดียว' },
  { title: 'ได้รับทั้งภาษาไทยและอังกฤษ', desc: 'นโยบายพร้อมในสองภาษา เหมาะกับทุกกลุ่มลูกค้า' },
  { title: 'ดาวน์โหลดไฟล์ PDF, Word, TXT', desc: 'รับไฟล์เอกสารพร้อมใช้ในทุกรูปแบบที่ต้องการ' },
  { title: 'เพิ่มเนื้อหาพิเศษได้ (Premium)', desc: 'เพิ่มเงื่อนไขเฉพาะสำหรับธุรกิจของคุณ *เฉพาะแพ็กเกจ Premium' },
]

export default function OneTimeValue() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 text-sm mb-2">สิ่งที่คุณได้รับทั้งหมด</p>
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
          ชำระครั้งเดียว คุ้มค่าระยะยาว
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            {benefits.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="text-2xl font-bold leading-none mt-0.5" style={{ color: 'var(--green)' }}>✓</span>
                <div>
                  <p className="font-bold text-gray-900 text-base">{title}</p>
                  {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4 flex-wrap">
              <a href="/create/policy" className="btn-green px-8 py-3 text-base">
                สร้าง Policy เลย!
              </a>
              <a href="#faq" className="btn-outline-green px-8 py-3 text-base">
                คำถามที่พบบ่อย
              </a>
            </div>
          </div>

          <div>
            <div className="border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">ลิงก์นโยบายสาธารณะของคุณ</p>
                  <div className="flex gap-2">
                    <a href="#" style={{ color: 'var(--green)' }} className="text-xs font-bold">ภาษาไทย</a>
                    <span className="text-xs text-gray-300">|</span>
                    <a href="#" className="text-xs text-gray-500">English</a>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-4">
                  <span className="text-xs text-gray-500 flex-1 truncate">https://flowpdpa.th/policies/your-company...</span>
                  <button className="text-xs font-bold text-white px-3 py-1 rounded shrink-0" style={{ backgroundColor: 'var(--blue)' }}>
                    คัดลอก
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
