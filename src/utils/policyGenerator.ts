const esc = (s: string = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export interface PolicyInput {
  policyType: string | null
  websiteName: string
  websiteUrl: string
  businessType: string
  contactEmail: string
  contactPhone: string
  address: string
  dataTypes: string[]
  purposes: string[]
  thirdParties: string[]
  language: string
  dpoEmail: string
  retentionPeriod: string
}

const dataTypeLabels: Record<string, string> = {
  name:      'ชื่อ-นามสกุล',
  email:     'อีเมล',
  phone:     'เบอร์โทรศัพท์',
  address:   'ที่อยู่',
  payment:   'ข้อมูลการชำระเงิน (บัตรเครดิต / การโอนเงิน)',
  idcard:    'เลขบัตรประชาชน / หนังสือเดินทาง',
  dob:       'วันเดือนปีเกิด / อายุ',
  location:  'ข้อมูลตำแหน่งที่ตั้ง (GPS)',
  behavior:  'พฤติกรรมการใช้งานเว็บไซต์',
  ip:        'IP Address / ข้อมูลอุปกรณ์',
  health:    'ข้อมูลสุขภาพ',
  religion:  'ศาสนา / ความเชื่อ',
  biometric: 'ข้อมูลชีวมิติ (ลายนิ้วมือ, ใบหน้า)',
}

const sensitiveKeys = new Set(['health', 'religion', 'biometric'])

const purposeDetails: Record<string, { label: string; basis: string; basisEn: string }> = {
  service:   { label: 'ให้บริการหลักแก่ผู้ใช้งานตามที่ร้องขอ',                     basis: 'ฐานสัญญา',                      basisEn: 'Contract' },
  order:     { label: 'ดำเนินการคำสั่งซื้อ การจัดส่ง และการคืนสินค้า',                basis: 'ฐานสัญญา',                      basisEn: 'Contract' },
  contact:   { label: 'ติดต่อสื่อสาร ตอบคำถาม และแจ้งข้อมูลสำคัญ',                  basis: 'ฐานสัญญา',                      basisEn: 'Contract' },
  payment:   { label: 'ดำเนินการชำระเงินและออกใบเสร็จรับเงิน',                       basis: 'ฐานสัญญา',                      basisEn: 'Contract' },
  marketing: { label: 'ส่งข้อเสนอพิเศษ โปรโมชัน และข่าวสารทางการตลาด',              basis: 'ฐานความยินยอม',                  basisEn: 'Consent' },
  analytics: { label: 'วิเคราะห์พฤติกรรมการใช้งานเพื่อปรับปรุงบริการ',               basis: 'ฐานประโยชน์อันชอบธรรม',          basisEn: 'Legitimate Interest' },
  legal:     { label: 'ปฏิบัติตามข้อกำหนด กฎหมาย หรือคำสั่งของหน่วยงานรัฐ',         basis: 'ฐานหน้าที่ตามกฎหมาย',            basisEn: 'Legal Obligation' },
  security:  { label: 'ตรวจจับ ป้องกัน และระงับการทุจริต รักษาความปลอดภัย',         basis: 'ฐานประโยชน์อันชอบธรรม',          basisEn: 'Legitimate Interest' },
}

const thirdPartyDetails: Record<string, { label: string; purpose: string }> = {
  ga:        { label: 'Google Analytics (Google LLC)',                   purpose: 'วิเคราะห์การใช้งานเว็บไซต์' },
  gtm:       { label: 'Google Tag Manager (Google LLC)',                 purpose: 'จัดการแท็กและโค้ดติดตาม' },
  gads:      { label: 'Google Ads (Google LLC)',                         purpose: 'โฆษณาออนไลน์' },
  fb:        { label: 'Facebook / Meta Ads (Meta Platforms, Inc.)',      purpose: 'โฆษณาออนไลน์และวิเคราะห์ผล' },
  line:      { label: 'LINE Official Account (LINE Corporation)',        purpose: 'ส่งข้อความและการสื่อสาร' },
  stripe:    { label: 'Stripe, Inc.',                                    purpose: 'ดำเนินการชำระเงิน' },
  omise:     { label: 'Omise / GB Prime Pay',                            purpose: 'ดำเนินการชำระเงิน' },
  aws:       { label: 'Amazon Web Services / Google Cloud',              purpose: 'บริการ Hosting และจัดเก็บข้อมูล' },
  mailchimp: { label: 'Mailchimp / Klaviyo',                             purpose: 'ส่งอีเมลและการตลาดทางอีเมล' },
  zendesk:   { label: 'Zendesk / Freshdesk',                             purpose: 'ระบบดูแลลูกค้าและ Support Ticket' },
}

function ul(items: string[]): string {
  return `<ul style="margin:8px 0 8px 24px;padding:0;line-height:1.9">${items.map(i => `<li>${i}</li>`).join('')}</ul>`
}

function section(num: number, title: string, content: string): string {
  return `
    <div style="margin-bottom:32px">
      <h2 style="font-size:15px;font-weight:700;color:#0f1f38;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #059669">
        ${num}. ${title}
      </h2>
      <div style="font-size:14px;color:#374151;line-height:1.8">${content}</div>
    </div>`
}

export function generatePolicyHTML(data: PolicyInput): string {
  const name        = esc(data.websiteName) || 'บริษัท'
  const url         = esc(data.websiteUrl)
  const email       = esc(data.contactEmail)
  const phone       = esc(data.contactPhone)
  const addr        = esc(data.address)
  const dpo         = esc(data.dpoEmail || data.contactEmail)
  const retention   = esc(data.retentionPeriod) || '3 ปี'
  const today       = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })

  const stdTypes  = data.dataTypes.filter(k => !sensitiveKeys.has(k))
  const sensTypes = data.dataTypes.filter(k => sensitiveKeys.has(k))

  const hasCookies    = true
  const hasAccounts   = false
  const hasMarketing  = data.purposes.includes('marketing')
  const validThirds   = data.thirdParties.filter(k => k !== 'none' && thirdPartyDetails[k])

  // ── Section 1: Data Controller ─────────────────────────────
  const sec1 = section(1, 'ผู้ควบคุมข้อมูลส่วนบุคคล', `
    <p>นโยบายความเป็นส่วนตัวฉบับนี้อธิบายวิธีที่ <strong>${name}</strong> ("บริษัท", "เรา", "ของเรา")
    เก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลของท่าน ("ท่าน", "เจ้าของข้อมูล")
    เมื่อท่านเข้าใช้งานเว็บไซต์หรือบริการของเรา</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px;font-size:13px">
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 16px 8px 0;color:#64748b;width:140px;vertical-align:top">ชื่อเว็บไซต์ / แอป</td>
        <td style="padding:8px 0;font-weight:600;color:#111827">${name}</td>
      </tr>
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 16px 8px 0;color:#64748b;vertical-align:top">เว็บไซต์</td>
        <td style="padding:8px 0"><a href="${url}" style="color:#059669">${url}</a></td>
      </tr>
      ${addr ? `<tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 16px 8px 0;color:#64748b;vertical-align:top">ที่อยู่</td>
        <td style="padding:8px 0">${addr}</td>
      </tr>` : ''}
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 16px 8px 0;color:#64748b;vertical-align:top">อีเมลติดต่อ</td>
        <td style="padding:8px 0"><a href="mailto:${email}" style="color:#059669">${email}</a></td>
      </tr>
      ${phone ? `<tr>
        <td style="padding:8px 16px 8px 0;color:#64748b;vertical-align:top">โทรศัพท์</td>
        <td style="padding:8px 0">${phone}</td>
      </tr>` : ''}
    </table>`)

  // ── Section 2: Personal Data Collected ────────────────────
  const sec2Body = [
    stdTypes.length > 0 ? `<h3 style="font-size:13px;font-weight:600;color:#374151;margin:12px 0 4px">ข้อมูลส่วนบุคคลทั่วไป</h3>
      ${ul(stdTypes.map(k => dataTypeLabels[k] || k))}` : '',
    sensTypes.length > 0 ? `
      <h3 style="font-size:13px;font-weight:600;color:#b45309;margin:16px 0 4px">
        ⚠ ข้อมูลส่วนบุคคลที่อ่อนไหว (Sensitive Personal Data)
      </h3>
      <p style="font-size:13px;color:#64748b;margin:0 0 4px">
        ข้อมูลประเภทนี้จะถูกเก็บรวบรวมเฉพาะเมื่อท่านให้ความยินยอมอย่างชัดแจ้งเท่านั้น
      </p>
      ${ul(sensTypes.map(k => dataTypeLabels[k] || k))}` : '',
    hasCookies ? `<p><strong>ข้อมูลจากคุกกี้และเทคโนโลยีติดตาม:</strong>
      เราใช้คุกกี้เก็บข้อมูลพฤติกรรมการเข้าชม, Preferences, และข้อมูลทางสถิติ</p>` : '',
    hasAccounts ? `<p><strong>ข้อมูลบัญชีผู้ใช้งาน:</strong>
      เมื่อท่านสมัครสมาชิก เราจะเก็บชื่อผู้ใช้ รหัสผ่านที่เข้ารหัสแล้ว และประวัติการใช้งาน</p>` : '',
  ].filter(Boolean).join('\n')

  const sec2 = section(2, 'ข้อมูลส่วนบุคคลที่เก็บรวบรวม', sec2Body || '<p>ไม่มีการเก็บรวบรวมข้อมูลส่วนบุคคล</p>')

  // ── Section 3: Purposes & Legal Basis ─────────────────────
  const selectedPurposes = data.purposes
    .filter(k => purposeDetails[k])
    .map(k => purposeDetails[k])

  const purposeRows = selectedPurposes.map(p =>
    `<tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:8px 16px 8px 0;vertical-align:top;width:55%">${p.label}</td>
      <td style="padding:8px 0;vertical-align:top">
        <span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;
          background:rgba(5,150,105,0.1);color:#059669">${p.basis}</span>
      </td>
    </tr>`
  ).join('')

  const sec3 = section(3, 'วัตถุประสงค์และฐานทางกฎหมายในการประมวลผล', `
    <p>เราประมวลผลข้อมูลส่วนบุคคลของท่านตามวัตถุประสงค์และฐานทางกฎหมายดังนี้:</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px;font-size:13px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="text-align:left;padding:10px 16px 10px 0;color:#64748b;font-weight:600;border-bottom:2px solid #e5e7eb">วัตถุประสงค์</th>
          <th style="text-align:left;padding:10px 0;color:#64748b;font-weight:600;border-bottom:2px solid #e5e7eb">ฐานทางกฎหมาย</th>
        </tr>
      </thead>
      <tbody>${purposeRows}</tbody>
    </table>
    ${hasMarketing ? `<p style="margin-top:12px;font-size:13px;color:#92400e;background:#fef3c7;padding:10px 14px;border-radius:8px;border-left:3px solid #f59e0b">
      <strong>หมายเหตุ:</strong> สำหรับการตลาด ท่านมีสิทธิ์ถอนความยินยอมได้ทุกเมื่อโดยติดต่อเราผ่านอีเมลด้านล่าง
    </p>` : ''}`)

  // ── Section 4: Third Party Disclosure ─────────────────────
  let sec4Content: string
  if (validThirds.length === 0) {
    sec4Content = `<p>เราไม่เปิดเผยข้อมูลส่วนบุคคลของท่านให้แก่บุคคลที่สาม ยกเว้นกรณีที่กฎหมายกำหนด</p>`
  } else {
    const rows = validThirds.map(k => {
      const d = thirdPartyDetails[k]
      return `<tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;font-size:13px">${d.label}</td>
        <td style="padding:8px 0;color:#64748b;vertical-align:top;font-size:13px">${d.purpose}</td>
      </tr>`
    }).join('')
    sec4Content = `
      <p>เราอาจเปิดเผยข้อมูลส่วนบุคคลของท่านให้แก่ผู้ประมวลผลข้อมูลที่น่าเชื่อถือดังต่อไปนี้
      ซึ่งมีมาตรการคุ้มครองข้อมูลที่เหมาะสม:</p>
      <table style="border-collapse:collapse;width:100%;margin-top:12px;font-size:13px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="text-align:left;padding:10px 16px 10px 0;color:#64748b;font-weight:600;border-bottom:2px solid #e5e7eb">ผู้รับข้อมูล</th>
            <th style="text-align:left;padding:10px 0;color:#64748b;font-weight:600;border-bottom:2px solid #e5e7eb">วัตถุประสงค์</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:12px;font-size:13px;color:#64748b">
        บุคคลที่สามเหล่านี้ได้รับอนุญาตให้ใช้ข้อมูลของท่านเฉพาะเพื่อให้บริการตามที่ระบุ
        และต้องปฏิบัติตามมาตรฐานการคุ้มครองข้อมูลตาม PDPA
      </p>`
  }
  const sec4 = section(4, 'การเปิดเผยข้อมูลส่วนบุคคล', sec4Content)

  // ── Section 5: Cookies (conditional) ──────────────────────
  const sec5 = hasCookies ? section(5, 'คุกกี้และเทคโนโลยีติดตาม', `
    <p>เราใช้คุกกี้และเทคโนโลยีที่คล้ายคลึงกันเพื่อปรับปรุงประสบการณ์การใช้งาน โดยแบ่งเป็น:</p>
    ${ul([
      '<strong>คุกกี้จำเป็น (Necessary):</strong> จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์',
      '<strong>คุกกี้การวิเคราะห์ (Analytics):</strong> ช่วยให้เราเข้าใจวิธีที่ผู้เข้าชมใช้เว็บไซต์',
      '<strong>คุกกี้การตลาด (Marketing):</strong> ใช้ติดตามผู้เข้าชมและแสดงโฆษณาที่เกี่ยวข้อง',
    ])}
    <p>ท่านสามารถจัดการการตั้งค่าคุกกี้ได้ผ่านการตั้งค่าเบราว์เซอร์ของท่าน
    อย่างไรก็ตาม การปิดใช้งานคุกกี้บางประเภทอาจส่งผลต่อการทำงานของเว็บไซต์</p>`) : ''

  const sectionNum = hasCookies ? 6 : 5

  // ── Section: Data Retention ────────────────────────────────
  const secRetention = section(sectionNum, 'ระยะเวลาการเก็บรักษาข้อมูล', `
    <p>เราจะเก็บรักษาข้อมูลส่วนบุคคลของท่านเป็นระยะเวลา <strong>${retention}</strong>
    หรือตลอดระยะเวลาที่จำเป็นสำหรับวัตถุประสงค์ที่ระบุไว้ในนโยบายนี้
    เว้นแต่กฎหมายกำหนดให้เก็บรักษาไว้นานกว่านั้น</p>
    <p>เมื่อพ้นระยะเวลาดังกล่าว เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้ (Anonymize) อย่างปลอดภัย</p>`)

  // ── Section: Data Subject Rights ──────────────────────────
  const secRights = section(sectionNum + 1, 'สิทธิของเจ้าของข้อมูลส่วนบุคคล', `
    <p>ภายใต้ PDPA ท่านมีสิทธิดังต่อไปนี้เกี่ยวกับข้อมูลส่วนบุคคลของท่าน:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
      ${[
        ['🔍 สิทธิในการเข้าถึงข้อมูล', 'ท่านมีสิทธิขอรับสำเนาข้อมูลส่วนบุคคลที่เราเก็บรักษาเกี่ยวกับท่าน'],
        ['✏️ สิทธิในการแก้ไขข้อมูล', 'ท่านมีสิทธิขอให้แก้ไขข้อมูลส่วนบุคคลที่ไม่ถูกต้องหรือไม่สมบูรณ์'],
        ['🗑️ สิทธิในการลบข้อมูล', 'ท่านมีสิทธิขอให้ลบข้อมูลส่วนบุคคลของท่านภายใต้เงื่อนไขที่กำหนด'],
        ['📦 สิทธิในการโอนย้ายข้อมูล', 'ท่านมีสิทธิรับข้อมูลของท่านในรูปแบบที่อ่านได้ด้วยเครื่อง'],
        ['🚫 สิทธิในการคัดค้าน', 'ท่านมีสิทธิคัดค้านการประมวลผลข้อมูลของท่านในบางกรณี'],
        ['⏸️ สิทธิในการจำกัดการประมวลผล', 'ท่านมีสิทธิขอระงับการใช้ข้อมูลของท่านชั่วคราว'],
        ...(hasMarketing ? [['↩️ สิทธิถอนความยินยอม', 'ท่านสามารถถอนความยินยอมได้ทุกเมื่อสำหรับการตลาด']] : []),
      ].map(([title, desc]) => `
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:12px">
          <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">${title}</div>
          <div style="font-size:12px;color:#64748b;line-height:1.6">${desc}</div>
        </div>`).join('')}
    </div>
    <p style="margin-top:16px;font-size:13px;color:#64748b">
      ในการใช้สิทธิดังกล่าว โปรดติดต่อเราตามที่อยู่ในหัวข้อ "ติดต่อเรา"
      เราจะตอบสนองต่อคำขอของท่านภายใน 30 วัน
    </p>`)

  // ── Section: Security ──────────────────────────────────────
  const secSecurity = section(sectionNum + 2, 'มาตรการรักษาความปลอดภัย', `
    <p>เราดำเนินมาตรการด้านความปลอดภัยทั้งทางเทคนิคและองค์กรที่เหมาะสม เพื่อปกป้องข้อมูลส่วนบุคคลของท่าน ได้แก่:</p>
    ${ul([
      'การเข้ารหัสข้อมูล (Encryption) ระหว่างการส่งผ่านเครือข่ายด้วย TLS/SSL',
      'การควบคุมการเข้าถึงข้อมูล (Access Control) ตามหลักการ Least Privilege',
      'การตรวจสอบและบันทึกการเข้าถึงระบบ (Audit Logging)',
      'การทดสอบความปลอดภัยและการประเมินความเสี่ยงอย่างสม่ำเสมอ',
      'การฝึกอบรมพนักงานด้านการคุ้มครองข้อมูลส่วนบุคคล',
    ])}
    <p style="font-size:13px;color:#64748b">
      หากเกิดเหตุละเมิดข้อมูลส่วนบุคคลที่มีความเสี่ยงสูง เราจะแจ้งให้ท่านทราบโดยเร็วที่สุดตามที่กฎหมายกำหนด
    </p>`)

  // ── Section: Contact ───────────────────────────────────────
  const secContact = section(sectionNum + 3, 'ติดต่อเรา', `
    <p>หากท่านมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิของท่าน
    โปรดติดต่อเรา:</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px;font-size:13px">
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 16px 8px 0;color:#64748b;width:160px">ผู้ควบคุมข้อมูล</td>
        <td style="padding:8px 0;font-weight:600">${name}</td>
      </tr>
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 16px 8px 0;color:#64748b">อีเมลติดต่อ</td>
        <td style="padding:8px 0"><a href="mailto:${email}" style="color:#059669">${email}</a></td>
      </tr>
      ${dpo && dpo !== email ? `<tr>
        <td style="padding:8px 16px 8px 0;color:#64748b">เจ้าหน้าที่คุ้มครองข้อมูล (DPO)</td>
        <td style="padding:8px 0"><a href="mailto:${dpo}" style="color:#059669">${dpo}</a></td>
      </tr>` : ''}
    </table>`)

  // ── Assemble the full document ─────────────────────────────
  return `
<div style="font-family:'Sarabun','Noto Sans Thai',sans-serif;max-width:860px;margin:0 auto;color:#374151">
  <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #059669">
    <h1 style="font-size:22px;font-weight:800;color:#0f1f38;margin:0 0 6px">
      นโยบายความเป็นส่วนตัว (Privacy Policy)
    </h1>
    <p style="font-size:13px;color:#64748b;margin:0">
      สำหรับ <strong style="color:#374151">${name}</strong> · มีผลบังคับใช้: ${today}
    </p>
    ${data.language === 'both' ? `<span style="display:inline-block;margin-top:6px;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#dbeafe;color:#1d4ed8">
      🌐 ภาษาไทย + English (Bilingual)
    </span>` : ''}
  </div>

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:28px;font-size:13px;color:#166534;line-height:1.7">
    <strong>บทนำ:</strong> ${name} ตระหนักถึงความสำคัญของการคุ้มครองข้อมูลส่วนบุคคลของท่าน
    และมุ่งมั่นปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) อย่างเคร่งครัด
    โปรดอ่านนโยบายนี้เพื่อทำความเข้าใจว่าเราจัดการข้อมูลส่วนบุคคลของท่านอย่างไร
  </div>

  ${sec1}
  ${sec2}
  ${sec3}
  ${sec4}
  ${sec5}
  ${secRetention}
  ${secRights}
  ${secSecurity}
  ${secContact}

  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#94a3b8">
    นโยบายนี้สร้างขึ้นโดย
    <a href="https://flowpdpa.co.th" style="color:#059669;font-weight:600">FlowPDPA</a>
    · สร้างเมื่อ ${today} · เวอร์ชัน 1.0
  </div>
</div>`
}
