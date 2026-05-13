export default function Terms() {
  return (
    <div style={{ paddingTop: '61px' }}>
      {/* Header */}
      <div className="py-16 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
            <span className="block w-8 h-px bg-gray-300" />
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">เงื่อนไขการใช้งาน</h1>
          <p className="text-gray-400 text-sm">มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2567 | อัปเดตล่าสุด: 1 มีนาคม 2568</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. การยอมรับข้อกำหนด</h2>
              <p>
                การเข้าใช้งานหรือลงทะเบียนกับ FlowPDPA ถือว่าคุณยอมรับเงื่อนไขการใช้งานฉบับนี้และ
                <a href="/privacy-policy" className="font-semibold mx-1 underline" style={{ color: 'var(--green)' }}>นโยบายความเป็นส่วนตัว</a>
                ของเรา หากคุณไม่ยอมรับเงื่อนไขใดๆ กรุณาหยุดใช้งานบริการ
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. การให้บริการ</h2>
              <p className="mb-3">
                FlowPDPA ให้บริการแพลตฟอร์มสำหรับสร้างและจัดการนโยบายคุ้มครองข้อมูลส่วนบุคคล ("บริการ")
                ภายใต้เงื่อนไขดังต่อไปนี้:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>บริการมีให้บนพื้นฐาน "As Is" และ "As Available"</li>
                <li>เราสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือยกเลิกบริการโดยแจ้งล่วงหน้า 30 วัน</li>
                <li>การเข้าถึงบริการอาจถูกจำกัดชั่วคราวเพื่อการบำรุงรักษาระบบ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. บัญชีผู้ใช้</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>คุณต้องมีอายุอย่างน้อย 18 ปีหรือได้รับความยินยอมจากผู้ปกครองเพื่อใช้บริการ</li>
                <li>คุณรับผิดชอบในการรักษาความปลอดภัยของรหัสผ่านบัญชีของคุณ</li>
                <li>ห้ามแบ่งปันบัญชีหรือให้ผู้อื่นใช้บัญชีของคุณ</li>
                <li>แต่ละแผนบริการรองรับจำนวนเว็บไซต์ตามที่ระบุไว้</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. ค่าบริการและการชำระเงิน</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>ราคาทั้งหมดเป็นสกุลเงินบาทไทย (THB) และรวมภาษีมูลค่าเพิ่ม (VAT) 7% แล้ว</li>
                <li>แผน Premium ชำระครั้งเดียวและไม่มีค่าต่ออายุ</li>
                <li>เราไม่คืนเงินสำหรับบริการที่ใช้ไปแล้ว เว้นแต่กรณีที่ระบุในนโยบายคืนเงิน</li>
                <li>หากชำระเงินไม่สำเร็จ เราอาจระงับการเข้าถึงบัญชีจนกว่าจะชำระครบ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. สิทธิ์ในทรัพย์สินทางปัญญา</h2>
              <p className="mb-3">
                ซอฟต์แวร์ รูปแบบ และเนื้อหาของ FlowPDPA เป็นทรัพย์สินของบริษัท ได้รับความคุ้มครองตามกฎหมาย
                ทรัพย์สินทางปัญญา สำหรับนโยบายที่สร้างผ่านแพลตฟอร์ม:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>คุณเป็นเจ้าของเนื้อหานโยบายที่สร้างสำหรับธุรกิจของคุณ</li>
                <li>คุณให้สิทธิ์ FlowPDPA ใช้ข้อมูลธุรกิจของคุณเพื่อสร้างและอัปเดตนโยบาย</li>
                <li>ห้ามนำเทมเพลตหรือระบบของ FlowPDPA ไปสร้างบริการแข่งขัน</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. ข้อห้ามในการใช้งาน</h2>
              <p className="mb-3">คุณตกลงจะไม่:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือฉ้อโกง</li>
                <li>พยายามเจาะระบบหรือทดสอบความปลอดภัยโดยไม่ได้รับอนุญาต</li>
                <li>คัดลอกหรือแก้ไขซอฟต์แวร์ของเราโดยไม่ได้รับอนุญาต</li>
                <li>ใช้ระบบอัตโนมัติในการเข้าถึงบริการในลักษณะที่กระทบต่อระบบ</li>
                <li>สร้างนโยบายสำหรับธุรกิจที่มีวัตถุประสงค์ผิดกฎหมาย</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. การรับประกันและความรับผิด</h2>
              <p className="mb-3">
                FlowPDPA จัดทำนโยบายที่ถูกต้องตามกฎหมาย PDPA ปัจจุบัน อย่างไรก็ตาม:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>เราไม่รับประกันว่านโยบายจะตรงกับความต้องการเฉพาะเจาะจงของธุรกิจคุณทุกประการ</li>
                <li>เราไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้นโยบายในบริบทที่ไม่ตรงกับข้อมูลที่คุณให้ไว้</li>
                <li>ความรับผิดสูงสุดของ FlowPDPA จำกัดเท่ากับจำนวนเงินที่คุณชำระในช่วง 12 เดือนที่ผ่านมา</li>
                <li>เราไม่รับผิดชอบต่อความเสียหายทางอ้อม ความสูญเสียผลกำไร หรือความเสียหายพิเศษ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. การยกเลิกบัญชี</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>คุณสามารถยกเลิกบัญชีได้ตลอดเวลาผ่านหน้า Settings หรือติดต่อทีมงาน</li>
                <li>เราสงวนสิทธิ์ระงับหรือยกเลิกบัญชีที่ละเมิดเงื่อนไขโดยไม่ต้องแจ้งล่วงหน้า</li>
                <li>ข้อมูลของคุณจะถูกเก็บรักษาตามระยะเวลาที่ระบุในนโยบายความเป็นส่วนตัว</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. กฎหมายที่บังคับใช้</h2>
              <p>
                เงื่อนไขนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทใดๆ ที่เกิดขึ้นจะอยู่ในอำนาจศาลไทย
                โดยคู่สัญญาตกลงให้ใช้ศาลจังหวัดขอนแก่นเป็นศาลที่มีเขตอำนาจพิจารณา
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. ติดต่อเรา</h2>
              <p className="mb-2">หากมีคำถามเกี่ยวกับเงื่อนไขนี้ ติดต่อเราได้ที่:</p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-sm space-y-1">
                <p className="font-semibold text-gray-900">บริษัท ฟลว์พีดีพีเอ จำกัด</p>
                <p>99/9 อาคารขอนแก่น บิซิเนส เซ็นเตอร์ ชั้น 5 ถนนศรีจันทร์ ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000</p>
                <p>โทร: 043-123-456</p>
                <p>อีเมล: <a href="mailto:contact@flowpdpa.co.th" className="font-semibold" style={{ color: 'var(--green)' }}>contact@flowpdpa.co.th</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
