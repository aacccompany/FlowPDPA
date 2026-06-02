# FlowPDPA — Policy Template Examples

**For:** Backend Development Team  
**Date:** 2026-05-23

---

## Overview

This document shows the actual template structure with placeholders that AI will fill in based on client form data.

---

## Template 1: Privacy + Cookies Policy (Thai)

### File: `templates/privacy_th_v1.md`

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
นโยบายความเป็นส่วนตัว (Privacy Policy)
Privacy + Cookies Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

วันที่อัปเดตล่าสุด: {{currentDate}}

บริษัท {{companyName}} ("เรา") ตระหนักถึงความสำคัญของการคุ้มครองข้อมูลส่วนบุคคล
ของท่าน โดยเราได้จัดทำนโยบายฉบับนี้ขึ้นเพื่อแจ้งให้ท่านทราบถึง
แนวทางปฏิบัติ และมาตรการในการคุ้มครองข้อมูลส่วนบุคคลของท่าน
ให้เป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เราคือผู้ควบคุมข้อมูลส่วนบุคคล สามารถติดต่อเราได้ที่:

ชื่อบริษัท: {{companyName}}
เว็บไซต์: {{websiteUrl}}
ประเภทธุรกิจ: {{businessType}}
อีเมล: {{contactEmail}}
{{#if contactPhone}}โทร: {{contactPhone}}{{/if}}
{{#if address}}ที่อยู่: {{address}}{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เราอาจเก็บรวบรวมข้อมูลส่วนบุคคลของท่านดังนี้:

ข้อมูลทั่วไป:
{{#each standardDataTypes}}
• {{label}}
{{/each}}

{{#if sensitiveData}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ข้อมูลอ่อนไหว (Sensitive Data)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เราอาจเก็บรวบรวมข้อมูลอ่อนไหวดังนี้:
{{#each sensitiveData}}
• {{label}}
{{/each}}

⚠️ ข้อมูลอ่อนไหวคือข้อมูลที่มีความเสี่ยงต่อเจ้าของข้อมูลสูง
ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคลฯ การเก็บรวบรวมข้อมูลดังกล่าว
เราจะขอความยินยอมโดยเฉพาะและให้ข้อมูลอย่างชัดเจนก่อนดำเนินการ
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เราเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังนี้:

{{#each purposes}}
• {{@indexToNumber(this)}}. {{label}}
   {{description}}
{{/each}}

ฐานทางกฎหมายในการประมวลผลข้อมูล:
• ความยินยอมของเจ้าของข้อมูล (มาตรา 19)
• การปฏิบัติตามสัญญา (มาตรา 24(2)(ก))
{{#if hasUserAccounts}}• ประโยชน์อันดียงของผู้ควบคุมข้อมูล (มาตรา 24(2)(ข)){{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. การเปิดเผยข้อมูลแก่บุคคลที่สาม
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{#if thirdParties.length}}
เราอาจเปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลที่สามดังนี้:

{{#each thirdParties}}
• {{name}}
  วัตถุประสงค์: {{purpose}}
  ประเภทบริการ: {{serviceType}}
{{/each}}

ท่านสามารถขอทราบรายละเอียดเกี่ยวกับการเปิดเผยข้อมูล
ได้ตามสิทธิของเจ้าของข้อมูลส่วนบุคคล
{{else}}
เราไม่มีการเปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลที่สาม
นอกจากกรณีที่จำเป็นตามกฎหมาย หรือได้รับความยินยอมจากท่าน
{{/if}}

{{includeSection "cookies"}}

{{includeSection "userAccounts"}}

{{includeSection "dataTransferAbroad"}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ระยะเวลาในการเก็บรักษาข้อมูล
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เราจะเก็บรักษาข้อมูลส่วนบุคคลของท่านเป็นระยะเวลา {{retentionPeriod}}
นับแต่วันที่ได้มาซึ่งข้อมูล หรือตามที่กฎหมายกำหนด

เมื่อพ้นระยะเวลาดังกล่าวแล้ว เราจะดำเนินการทำลาย
หรือทำให้ข้อมูลดังกล่าวไม่สามารถระบุตัวตนเจ้าของข้อมูลได้
โดยไม่ก่อให้เกิดความเสียหายแก่สิทธิและเสรีภาพของท่าน

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. สิทธิของเจ้าของข้อมูลส่วนบุคคล
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ท่านมีสิทธิดังนี้:

1. สิทธิในการขอเข้าถึงข้อมูลส่วนบุคคล (Right of Access)
   ท่านมีสิทธิขอทราบว่าเรามีข้อมูลส่วนบุคคลของท่านอยู่หรือไม่
   และสามารถขอทำสำเนาข้อมูลดังกล่าวได้

2. สิทธิในการขอทำสำเนา (Right to Obtain Copy)
   ท่านมีสิทธิขอรับสำเนาข้อมูลส่วนบุคคลของท่าน

3. สิทธิในการขอแก้ไข (Right to Rectification)
   ท่านมีสิทธิขอให้แก้ไขข้อมูลส่วนบุคคลของท่านที่ไม่ถูกต้อง
   หรือไม่สมบูรณ์

4. สิทธิในการขอลบ (Right to Erasure)
   ท่านมีสิทธิขอให้ลบข้อมูลส่วนบุคคลของท่าน
   ในกรณีที่กฎหมายกำหนด

5. สิทธิในการขอให้แจ้ง (Right to Portability)
   ท่านมีสิทธิขอรับข้อมูลส่วนบุคคลของท่าน
   ในรูปแบบที่สามารถนำไปใช้ได้

6. สิทธิในการขอคัดค้าน (Right to Object)
   ท่านมีสิทธิคัดค้านการประมวลผลข้อมูลส่วนบุคคลของท่าน

7. สิทธิในการถอนความยินยอม (Right to Withdraw Consent)
   ท่านมีสิทธิถอนความยินยอมที่เคยให้ไว้ได้ตลอดเวลา

การใช้สิทธิดังกล่าว:
ท่านสามารถติดต่อใช้สิทธิได้โดยส่งอีเมลถึง: {{dpoEmail}}
เราจะดำเนินการตามคำขอภายใน 30 วันนับจากวันที่ได้รับคำขอ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. การแจ้งเหตุละเมิดข้อมูลส่วนบุคคล
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ในกรณีที่เกิดเหตุละเมิดข้อมูลส่วนบุคคลที่อาจก่อให้เกิด
ความเสียหายแก่เจ้าของข้อมูลส่วนบุคคล เราจะแจ้งเหตุดังกล่าว

• แจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลภายใน 72 ชั่วโมง
• แจ้งเจ้าของข้อมูลส่วนบุคคลโดยไม่ชักช้าหากมีความเสี่ยงสูง

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. การเปลี่ยนแปลงนโยบาย
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เราขอสงวนสิทธิในการแก้ไขเปลี่ยนแปลงแก้ไขนโยบายฉบับนี้
เพื่อให้สอดคล้องกับกฎหมายและแนวปฏิบัติที่เปลี่ยนแปลงไป

การเปลี่ยนแปลงจะแจ้งให้ท่านทราบล่วงหน้าผ่าน:
• เว็บไซต์ของเรา
• อีเมล (หากท่านเป็นสมาชิก)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. ติดต่อเรา
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

หากท่านมีข้อสงสัย หรือต้องการใช้สิทธิตามนโยบายฉบับนี้
สามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (Data Protection Officer) ได้ที่:

อีเมล: {{dpoEmail}}
{{#if contactPhone}}โทร: {{contactPhone}}{{/if}}
เว็บไซต์: {{websiteUrl}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
นโยบายฉบับนี้อัปเดตล่าสุดเมื่อวันที่ {{currentDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Conditional Sections

#### Section: Cookies (include if `hasCookies = true`)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
นโยบายคุกกี้ (Cookie Policy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เว็บไซต์ของเราใช้คุกกี้ (Cookies) เพื่อปรับปรุงประสบการณ์
การใช้งานของท่าน

คุกกี้ คือไฟล์ข้อความขนาดเล็กที่จัดเก็บบนอุปกรณ์ของท่าน
เมื่อท่านเข้าชมเว็บไซต์ของเรา

ประเภทคุกกี้ที่เราใช้:
1. คุกกี้ที่จำเป็น (Essential Cookies)
   - ใช้สำหรับการทำงานพื้นฐานของเว็บไซต์
   - ไม่สามารถปิดการใช้งานได้

2. คุกกี้เพื่อการวิเคราะห์ (Analytics Cookies)
   - ใช้เพื่อวิเคราะห์พฤติกรรมการใช้งาน
   - ช่วยให้เราปรับปรุงเว็บไซต์

{{#if thirdParties}}
คุกกี้ของบุคคลที่สาม:
{{#each thirdParties}}
• {{name}} - {{cookiePurpose}}
{{/each}}
{{/if}}

ท่านสามารถจัดการคุกกี้ได้ผ่านการตั้งค่าเบราว์เซอร์
หรือติดต่อเราหากต้องการทราบรายละเอียดเพิ่มเติม
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Section: User Accounts (include if `hasUserAccounts = true`)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
บัญชีผู้ใช้งาน
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เว็บไซต์ของเรามีระบบบัญชีผู้ใช้งาน (User Account) สำหรับสมาชิก

ข้อมูลที่เราเก็บรวบรวมเมื่อท่านสมัครสมาชิก:
• ชื่อ-นามสกุล
• อีเมล
• รหัสผ่าน (ถูกเข้ารหัส)
• เบอร์โทรศัพท์ (ถ้าระบุ)
• ที่อยู่ (ถ้าระบุ)

ความปลอดภัยของบัญชี:
• เราใช้การเข้ารหัสรหัสผ่าน
• ท่านควรใช้รหัสผ่านที่มีความซับซ้อนสูง
• ห้ามแชร์รหัสผ่านกับบุคคลอื่น
• หากท่านพบว่ามีการใช้บัญชีโดยไม่ได้รับอนุญาต
  กรุณาแจ้งให้เราทราบทันที

ท่านมีสิทธิขอเข้าถึง แก้ไข หรือลบบัญชีได้ตลอดเวลา
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Section: Data Transfer Abroad (include if Premium plan)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
การถ่ายโอนข้อมูลไปต่างประเทศ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เราอาจถ่ายโอนข้อมูลส่วนบุคคลของท่านไปยังประเทศอื่น
ในกรณีที่จำเป็นเพื่อการดำเนินงาน

ประเทศที่อาจมีการถ่ายโอนข้อมูล:
• สหรัฐอเมริกา (สำหรับบริการคลาวด์)
• สิงคโปร์ (สำหรับเซิร์ฟเวอร์)

เรามีมาตรการคุ้มครองข้อมูลที่เหมาะสมให้ได้มาตรฐาน
ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคลของประเทศไทย
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Template 2: Privacy Policy (English - Premium)

### File: `templates/privacy_en_v1.md`

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Privacy Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Last Updated: {{currentDate}}

{{companyName}} ("we", "us", or "our") is committed to protecting your personal data.
This Privacy Policy explains how we collect, use, and protect your information
in compliance with the Personal Data Protection Act B.E. 2562 (2019) (PDPA).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Data Controller
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Company Name: {{companyName}}
Website: {{websiteUrl}}
Business Type: {{businessType}}
Email: {{contactEmail}}
{{#if contactPhone}}Phone: {{contactPhone}}{{/if}}
{{#if address}}Address: {{address}}{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. Personal Data We Collect
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We may collect the following personal data:

{{#each standardDataTypes}}
• {{label}}
{{/each}}

{{#if sensitiveData}}
Sensitive Personal Data:
{{#each sensitiveData}}
• {{label}}
{{/each}}

⚠️ Sensitive data requires your explicit consent before collection.
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Purposes of Data Collection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We collect and use your personal data for the following purposes:

{{#each purposes}}
• {{@indexToNumber(this)}}. {{label}}
{{/each}}

Legal Basis for Processing:
• Consent (Section 19 PDPA)
• Contract performance (Section 24(2)(a))
{{#if hasUserAccounts}}• Legitimate interest (Section 24(2)(d)){{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. Third Party Disclosure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{#if thirdParties.length}}
We may disclose your personal data to the following third parties:

{{#each thirdParties}}
• {{name}}
  Purpose: {{purpose}}
{{/each}}
{{else}}
We do not disclose your personal data to third parties except as required by law.
{{/if}}

{{includeSection "cookies"}}

{{includeSection "userAccounts"}}

{{includeSection "gdpr"}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Data Retention Period
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We retain your personal data for {{retentionPeriod}} from the date of collection,
or as required by law. After this period, we will delete or anonymize your data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. Your Data Subject Rights
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Under the PDPA, you have the following rights:

1. Right of Access - Request access to your personal data
2. Right to Obtain Copy - Receive a copy of your personal data
3. Right to Rectification - Correct inaccurate data
4. Right to Erasure - Request deletion of your data
5. Right to Portability - Receive your data in a usable format
6. Right to Object - Object to data processing
7. Right to Withdraw Consent - Withdraw your consent at any time

To exercise these rights, contact: {{dpoEmail}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. Data Breach Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In the event of a personal data breach, we will:
• Notify the Office of the Personal Data Protection Committee within 72 hours
• Notify affected data subjects without undue delay if high risk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. Changes to This Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We may update this policy to reflect changes in laws or our practices.
Changes will be notified via our website or email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. Contact Us
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For questions about this policy or your data rights, contact our Data Protection Officer:

Email: {{dpoEmail}}
{{#if contactPhone}}Phone: {{contactPhone}}{{/if}}
Website: {{websiteUrl}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This policy was last updated on {{currentDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Conditional Section: GDPR (Premium only)

```
{{#if includeGDPR}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GDPR Compliance (For EU Residents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you are located in the European Union, this policy also complies with
the General Data Protection Regulation (GDPR).

Additional Rights for EU Residents:
• Right to restrict processing
• Right to lodge a complaint with a supervisory authority

Data Transfers Outside EU:
Your data may be transferred to countries outside the European Economic Area.
We ensure appropriate safeguards are in place to protect your data.

EU Representative:
{{#if euRepName}}
Representative: {{euRepName}}
Contact: {{euRepContact}}
{{/if}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{/if}}
```

---

## Placeholder Reference

| Placeholder | Source | Description |
|-------------|--------|-------------|
| `{{companyName}}` | formData.websiteName | ชื่อเว็บไซต์/บริษัท |
| `{{websiteUrl}}` | formData.websiteUrl | URL เว็บไซต์ |
| `{{businessType}}` | formData.businessType | ประเภทธุรกิจ |
| `{{contactEmail}}` | formData.contactEmail | อีเมลติดต่อ |
| `{{contactPhone}}` | formData.contactPhone | เบอร์โทร (optional) |
| `{{address}}` | formData.address | ที่อยู่ (optional) |
| `{{dpoEmail}}` | formData.dpoEmail or contactEmail | อีเมล DPO |
| `{{retentionPeriod}}` | formData.retentionPeriod | ระยะเวลาเก็บข้อมูล |
| `{{currentDate}}` | System generated | วันที่ปัจจุบัน |
| `{{#each dataTypes}}` | formData.dataTypes | Loop ข้อมูลที่เก็บ |
| `{{#each purposes}}` | formData.purposes | Loop วัตถุประสงค์ |
| `{{#each thirdParties}}` | formData.thirdParties | Loop บุคคลที่สาม |
| `{{includeSection}}` | Conditional | Include หากเงื่อนไขตรงกัน |

---

## Backend Implementation Notes

### 1. Template Storage

```typescript
// Store templates in database or filesystem
interface TemplateStorage {
  id: string;
  policyType: 'privacy' | 'hr' | 'cctv' | 'recruitment' | 'vendor' | 'dpa';
  language: 'th' | 'en';
  version: string;
  content: string;           // Main template with placeholders
  sections: {                // Conditional sections
    [key: string]: {
      condition: string;      // e.g., "hasCookies === true"
      content: string;
    }
  };
}
```

### 2. Placeholder Replacement Helper

```typescript
function replacePlaceholders(template: string, data: FormData): string {
  const replacements = {
    '{{companyName}}': data.websiteName,
    '{{websiteUrl}}': data.websiteUrl,
    '{{businessType}}': data.businessType,
    '{{contactEmail}}': data.contactEmail,
    '{{contactPhone}}': data.contactPhone || '',
    '{{address}}': data.address || '',
    '{{dpoEmail}}': data.dpoEmail || data.contactEmail,
    '{{retentionPeriod}}': data.retentionPeriod,
    '{{currentDate}}': new Date().toLocaleDateString('th-TH'),
  };
  
  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return result;
}
```

### 3. Conditional Section Handler

```typescript
function handleConditionalSections(template: string, data: FormData): string {
  // Handle {{#if condition}}...{{/if}}
  template = template.replace(/\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, 
    (match, condition, content) => {
      if (evaluateCondition(condition, data)) {
        return content;
      }
      return '';
    }
  );
  
  // Handle {{#each array}}...{{/each}}
  template = template.replace(/\{\{#each ([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, arrayName, itemTemplate) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      return array.map(item => processItemTemplate(itemTemplate, item)).join('\n');
    }
  );
  
  return template;
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-23
