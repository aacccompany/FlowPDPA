import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'

const categories = [
  {
    label: 'ทั่วไป',
    items: [
      {
        q: 'FlowPDPA คืออะไร และแตกต่างจากบริการอื่นอย่างไร',
        a: 'FlowPDPA คือแพลตฟอร์มสร้างนโยบายคุ้มครองข้อมูลส่วนบุคคลสำหรับธุรกิจไทย ความแตกต่างคือเราไม่ใช้เทมเพลตกลางๆ แต่สร้างนโยบายจากข้อมูลจริงของธุรกิจคุณ และดูแลให้ถูกต้องตามกฎหมายล่าสุดตลอดเวลา',
      },
      {
        q: 'ธุรกิจประเภทไหนต้องมี Privacy Policy',
        a: 'ทุกธุรกิจที่เก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล เช่น ชื่อ อีเมล เบอร์โทร หรือข้อมูลการสั่งซื้อ ไม่ว่าจะเป็นร้านค้าออนไลน์ บริษัท สตาร์ทอัป หรือฟรีแลนซ์ ล้วนต้องมีนโยบายฉบับนี้',
      },
      {
        q: 'ฉันต้องมีความรู้ด้านกฎหมายก่อนใช้งานหรือไม่',
        a: 'ไม่จำเป็น FlowPDPA ออกแบบมาให้ทุกคนใช้งานได้ง่าย คุณเพียงตอบคำถามเกี่ยวกับธุรกิจของคุณ ระบบจะสร้างนโยบายที่ถูกต้องตามกฎหมายให้โดยอัตโนมัติ',
      },
      {
        q: 'ถ้าฉันมีหลายเว็บไซต์ ต้องสร้างนโยบายแยกกันหรือไม่',
        a: 'แผน Free และ Premium รองรับ 1 เว็บไซต์ต่อนโยบาย หากคุณมีหลายเว็บไซต์ สามารถติดต่อเรื่องแผน Enterprise ซึ่งรองรับหลายโดเมนในราคาพิเศษ',
      },
    ],
  },
  {
    label: 'ราคาและการชำระเงิน',
    items: [
      {
        q: 'ต้องชำระค่าบริการซ้ำทุกปีหรือไม่',
        a: 'ไม่ต้อง สำหรับ Privacy Policy แบบ Premium ชำระเพียงครั้งเดียว 2,500 บาท (รวม VAT) แล้วรับนโยบายและการอัปเดตตลอดชีพ ไม่มีค่ารายปีหรือค่าต่ออายุซ่อนเร้น',
      },
      {
        q: 'แผนฟรีมีข้อจำกัดอะไรบ้าง',
        a: 'แผนฟรีรองรับ Privacy Policy ภาษาไทยสำหรับ 1 เว็บไซต์ พร้อมลิงก์สาธารณะแชร์ได้ แต่ไม่รวมภาษาอังกฤษ การดาวน์โหลดไฟล์ HTML Code สำหรับฝังเว็บ หรือการคุ้มครองตาม GDPR/CCPA',
      },
      {
        q: 'รับชำระด้วยช่องทางใดบ้าง',
        a: 'รับชำระผ่านบัตรเครดิต/เดบิต (Visa, Mastercard) และ QR PromptPay ออกใบกำกับภาษีได้สำหรับแผน Enterprise',
      },
      {
        q: 'มีนโยบายคืนเงินหรือไม่',
        a: 'หากนโยบายที่ได้รับไม่ตรงกับข้อมูลที่คุณกรอก หรือมีข้อผิดพลาดจากระบบ เราจะแก้ไขให้ฟรีหรือคืนเงินเต็มจำนวนภายใน 30 วัน',
      },
    ],
  },
  {
    label: 'การใช้งานและการติดตั้ง',
    items: [
      {
        q: 'หลังสร้างเสร็จ ฉันจะนำนโยบายไปใช้ได้อย่างไร',
        a: 'คุณจะได้รับลิงก์สาธารณะสำหรับแชร์ HTML Code สำหรับฝังในเว็บไซต์ และไฟล์ดาวน์โหลด (PDF, Word, TXT) ทั้งภาษาไทยและอังกฤษ นำไปใช้ได้ทันทีโดยไม่ต้องติดตั้งซอฟต์แวร์เพิ่มเติม',
      },
      {
        q: 'รองรับแพลตฟอร์มอะไรบ้าง',
        a: 'รองรับทุกแพลตฟอร์ม ทั้ง WordPress, Shopify, WooCommerce, Wix, Webflow และเว็บไซต์ที่สร้างเอง คุณเพียงวาง HTML Code ในหน้าที่ต้องการหรือแชร์ลิงก์ตรงๆ ก็ได้',
      },
      {
        q: 'ฉันสามารถแก้ไขนโยบายหลังจากสร้างแล้วได้หรือไม่',
        a: 'ได้ คุณสามารถเข้ามาแก้ไขข้อมูลธุรกิจและอัปเดตนโยบายได้ตลอดเวลาผ่าน dashboard สำหรับแผน Premium ระบบจะบันทึกประวัติเวอร์ชันทุกครั้งที่มีการแก้ไข',
      },
    ],
  },
  {
    label: 'กฎหมายและการคุ้มครอง',
    items: [
      {
        q: 'ถ้ากฎหมาย PDPA มีการเปลี่ยนแปลง นโยบายของฉันจะถูกอัปเดตหรือเปล่า',
        a: 'ใช่ นโยบายของลูกค้า Premium จะถูกอัปเดตโดยทีมผู้เชี่ยวชาญของ FlowPDPA ทุกครั้งที่มีการเปลี่ยนแปลงกฎหมาย คุณจะได้รับแจ้งทางอีเมลทุกครั้งที่มีการอัปเดต',
      },
      {
        q: 'นโยบายที่สร้างจาก FlowPDPA ใช้ได้กับต่างประเทศด้วยหรือไม่',
        a: 'แผน Premium ครอบคลุม GDPR (สหภาพยุโรป) และ CCPA (แคลิฟอร์เนีย) ด้วย เหมาะสำหรับธุรกิจที่มีลูกค้าทั้งในและต่างประเทศ',
      },
      {
        q: 'มีการรับรองว่านโยบายถูกต้องตามกฎหมายหรือไม่',
        a: 'นโยบายทุกฉบับถูกตรวจสอบโดยทีมนักกฎหมายที่เชี่ยวชาญด้าน PDPA และได้รับการรับรองมาตรฐาน ISO 29110 เราไม่ใช่เพียงระบบอัตโนมัติ แต่มีผู้เชี่ยวชาญอยู่เบื้องหลัง',
      },
    ],
  },
]

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null)

  const toggle = (key: string) => setOpenKey(openKey === key ? null : key)

  return (
    <div style={{ paddingTop: '61px' }}>
      {/* Header */}
      <div className="py-16 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
            <span className="block w-8 h-px bg-gray-300" />
            FAQ
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5">คำถามที่พบบ่อย</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            ไม่พบคำตอบที่ต้องการ?{' '}
            <Link to="/#contact" className="font-semibold underline" style={{ color: 'var(--green)' }}>
              ติดต่อทีมงาน
            </Link>{' '}
            ได้เลย เราตอบภายใน 1 วันทำการ
          </p>
        </div>
      </div>

      {/* FAQ list by category */}
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {categories.map((cat) => (
            <div key={cat.label}>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 mb-5 flex items-center gap-3">
                <span className="block w-6 h-px bg-gray-200" />
                {cat.label}
              </h2>
              <div className="space-y-2">
                {cat.items.map((item, i) => {
                  const key = `${cat.label}-${i}`
                  const isOpen = openKey === key
                  return (
                    <div
                      key={key}
                      className="bg-white border border-gray-100 overflow-hidden"
                      style={{ borderRadius: '10px' }}
                    >
                      <button
                        className="w-full flex items-start justify-between px-6 py-5 text-left gap-4"
                        onClick={() => toggle(key)}
                      >
                        <span className="text-sm font-semibold text-gray-800 leading-snug">{item.q}</span>
                        <span className="shrink-0 mt-0.5" style={{ color: isOpen ? 'var(--green)' : '#9ca3af' }}>
                          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="py-14 border-t border-gray-100" style={{ backgroundColor: 'var(--blue-dark)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">ยังมีคำถามอื่นอีกไหม?</h2>
          <p className="text-blue-200 text-sm mb-6">ทีมผู้เชี่ยวชาญของเราพร้อมช่วยเหลือคุณตลอดเวลาทำการ</p>
          <Link to="/#contact" className="btn-green px-10 py-3 text-sm inline-block" style={{ borderRadius: '8px' }}>
            ติดต่อเรา
          </Link>
        </div>
      </div>
    </div>
  )
}
