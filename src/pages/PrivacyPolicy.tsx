export default function PrivacyPolicy() {
  return (
    <div style={{ paddingTop: '61px' }}>
      {/* Header */}
      <div className="py-16 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
            <span className="block w-8 h-px bg-gray-300" />
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-gray-400 text-sm">มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2567 | อัปเดตล่าสุด: 1 มีนาคม 2568</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. ข้อมูลเกี่ยวกับเรา</h2>
              <p>
                บริษัท ฟลว์พีดีพีเอ จำกัด ("FlowPDPA", "เรา", "บริษัท") ตั้งอยู่ที่ 99/9 อาคารขอนแก่น บิซิเนส เซ็นเตอร์ ชั้น 5
                ถนนศรีจันทร์ ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000 เราเป็นผู้ควบคุมข้อมูลส่วนบุคคล
                (Data Controller) ของข้อมูลที่เก็บรวบรวมผ่านเว็บไซต์ flowpdpa.co.th
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. ข้อมูลที่เราเก็บรวบรวม</h2>
              <p className="mb-3">เราเก็บรวบรวมข้อมูลดังต่อไปนี้:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-gray-800">ข้อมูลที่คุณให้โดยตรง:</strong> ชื่อ อีเมล เบอร์โทรศัพท์ ชื่อบริษัท และข้อมูลธุรกิจที่ใช้สร้างนโยบาย</li>
                <li><strong className="text-gray-800">ข้อมูลการใช้งาน:</strong> หน้าที่เข้าชม เวลาที่ใช้งาน ประเภทอุปกรณ์ และ IP Address</li>
                <li><strong className="text-gray-800">ข้อมูลการชำระเงิน:</strong> เราไม่เก็บข้อมูลบัตรเครดิตโดยตรง การชำระเงินผ่านผู้ให้บริการที่ได้รับการรับรอง PCI DSS</li>
                <li><strong className="text-gray-800">คุกกี้และข้อมูลเทคนิค:</strong> ดูรายละเอียดเพิ่มเติมในหัวข้อ "การใช้คุกกี้"</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. วัตถุประสงค์ในการใช้ข้อมูล</h2>
              <p className="mb-3">เราใช้ข้อมูลของคุณเพื่อ:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>ให้บริการสร้างและจัดการนโยบายความเป็นส่วนตัวของคุณ</li>
                <li>ส่งอีเมลแจ้งการอัปเดตนโยบายหรือการเปลี่ยนแปลงกฎหมาย</li>
                <li>ปรับปรุงคุณภาพบริการและประสบการณ์การใช้งาน</li>
                <li>ป้องกันการทุจริตและรักษาความปลอดภัยของระบบ</li>
                <li>ปฏิบัติตามข้อกำหนดทางกฎหมายที่เกี่ยวข้อง</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. ฐานทางกฎหมายในการประมวลผล</h2>
              <p>เราประมวลผลข้อมูลของคุณบนฐานทางกฎหมายดังนี้:</p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li><strong className="text-gray-800">การปฏิบัติตามสัญญา:</strong> สำหรับการให้บริการหลังจากที่คุณสมัครใช้งาน</li>
                <li><strong className="text-gray-800">ความยินยอม:</strong> สำหรับการส่งอีเมลการตลาดและการใช้คุกกี้ที่ไม่จำเป็น</li>
                <li><strong className="text-gray-800">ประโยชน์โดยชอบด้วยกฎหมาย:</strong> สำหรับการวิเคราะห์และพัฒนาบริการ</li>
                <li><strong className="text-gray-800">ข้อกำหนดทางกฎหมาย:</strong> สำหรับการปฏิบัติตามกฎหมายภาษีและการเงิน</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. การเปิดเผยข้อมูลต่อบุคคลที่สาม</h2>
              <p className="mb-3">เราไม่ขายข้อมูลส่วนบุคคลของคุณ เราอาจแบ่งปันข้อมูลกับ:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-gray-800">ผู้ให้บริการระบบ:</strong> เช่น Cloud hosting, ระบบชำระเงิน, ระบบส่งอีเมล ภายใต้สัญญาประมวลผลข้อมูล</li>
                <li><strong className="text-gray-800">หน่วยงานราชการ:</strong> เมื่อมีข้อกำหนดทางกฎหมายหรือคำสั่งศาล</li>
                <li><strong className="text-gray-800">ผู้สืบทอดกิจการ:</strong> ในกรณีที่มีการควบรวมหรือโอนกิจการ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. การใช้คุกกี้</h2>
              <p className="mb-3">เราใช้คุกกี้ประเภทต่างๆ ดังนี้:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-gray-800">คุกกี้จำเป็น (Strictly Necessary):</strong> สำหรับการทำงานพื้นฐานของเว็บไซต์ ไม่สามารถปิดได้</li>
                <li><strong className="text-gray-800">คุกกี้วิเคราะห์ (Analytics):</strong> Google Analytics เพื่อวิเคราะห์การเข้าชม (ต้องได้รับความยินยอม)</li>
                <li><strong className="text-gray-800">คุกกี้การตลาด (Marketing):</strong> Facebook Pixel เพื่อโฆษณาที่ตรงเป้าหมาย (ต้องได้รับความยินยอม)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. สิทธิของเจ้าของข้อมูล</h2>
              <p className="mb-3">คุณมีสิทธิดังต่อไปนี้ภายใต้ พ.ร.บ. PDPA:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>สิทธิในการเข้าถึงและรับสำเนาข้อมูล</li>
                <li>สิทธิในการแก้ไขข้อมูลให้ถูกต้อง</li>
                <li>สิทธิในการลบหรือทำลายข้อมูล</li>
                <li>สิทธิในการโอนย้ายข้อมูล (Data Portability)</li>
                <li>สิทธิในการคัดค้านการประมวลผล</li>
                <li>สิทธิในการถอนความยินยอมได้ทุกเมื่อ</li>
              </ul>
              <p className="mt-3">ติดต่อใช้สิทธิได้ที่ <a href="mailto:privacy@flowpdpa.co.th" className="font-semibold underline" style={{ color: 'var(--green)' }}>privacy@flowpdpa.co.th</a></p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. ระยะเวลาการเก็บรักษาข้อมูล</h2>
              <p>
                เราเก็บข้อมูลส่วนบุคคลตราบเท่าที่จำเป็นสำหรับวัตถุประสงค์ที่ระบุไว้ หรือตามที่กฎหมายกำหนด
                โดยทั่วไปข้อมูลบัญชีจะถูกเก็บตลอดระยะเวลาที่คุณใช้บริการบวก 3 ปีหลังจากยกเลิกบัญชี
                เพื่อปฏิบัติตามกฎหมายบัญชีและภาษี
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. ความปลอดภัยของข้อมูล</h2>
              <p>
                เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม รวมถึงการเข้ารหัส SSL/TLS การจำกัดสิทธิ์การเข้าถึง
                และการสำรองข้อมูลอย่างสม่ำเสมอ อย่างไรก็ตาม ไม่มีระบบใดที่ปลอดภัย 100% หากพบเหตุละเมิดข้อมูล
                เราจะแจ้งให้คุณทราบภายใน 72 ชั่วโมงตามที่กฎหมายกำหนด
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. การเปลี่ยนแปลงนโยบาย</h2>
              <p>
                เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงสำคัญจะแจ้งผ่านอีเมลหรือหน้าเว็บไซต์
                การที่คุณใช้บริการต่อหลังจากวันที่มีผลบังคับใช้ถือว่าคุณยอมรับนโยบายที่ปรับปรุงแล้ว
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">11. ติดต่อเรา</h2>
              <p className="mb-2">หากมีคำถามเกี่ยวกับนโยบายนี้ ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO) ได้ที่:</p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-sm space-y-1">
                <p className="font-semibold text-gray-900">บริษัท ฟลว์พีดีพีเอ จำกัด</p>
                <p>99/9 อาคารขอนแก่น บิซิเนส เซ็นเตอร์ ชั้น 5 ถนนศรีจันทร์ ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000</p>
                <p>โทร: 043-123-456</p>
                <p>อีเมล: <a href="mailto:privacy@flowpdpa.co.th" className="font-semibold" style={{ color: 'var(--green)' }}>privacy@flowpdpa.co.th</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
