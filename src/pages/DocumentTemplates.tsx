import { useEffect, useState } from "react";
import {
  Check,
  ClipboardCopy,
  Download,
  Eye,
  FileText,
  Info,
  X,
} from "lucide-react";
import { api, type DocumentTemplate } from "@/services/api";

const disclaimer =
  "เอกสารนี้เป็นแบบฟอร์มเริ่มต้นสำหรับนำไปปรับใช้ตามบริบทขององค์กร ไม่ใช่คำปรึกษาทางกฎหมาย และไม่รับรองว่าการใช้แบบฟอร์มนี้จะทำให้องค์กรปฏิบัติตามกฎหมายได้อย่างถูกต้อง 100% โดยอัตโนมัติ ควรตรวจสอบฐานกฎหมาย กระบวนการจริง และปรึกษาผู้เชี่ยวชาญก่อนนำไปใช้";

const builtinTemplates = [
  {
    id: "privacy-notice",
    title: "ประกาศความเป็นส่วนตัว",
    purpose: "แจ้งรายละเอียดการเก็บ ใช้ เปิดเผย และสิทธิของเจ้าของข้อมูล",
    content: `ประกาศความเป็นส่วนตัว (Privacy Notice)\n\n[ชื่อองค์กร] ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน\n\n1. ผู้ควบคุมข้อมูลส่วนบุคคล\nชื่อองค์กร: [ระบุชื่อ]\nช่องทางติดต่อ: [ระบุที่อยู่ อีเมล และโทรศัพท์]\n\n2. ข้อมูลที่เก็บรวบรวม\n[ระบุประเภทข้อมูลส่วนบุคคลและข้อมูลอ่อนไหว]\n\n3. วัตถุประสงค์และฐานกฎหมาย\n[ระบุวัตถุประสงค์และฐานกฎหมายของแต่ละกิจกรรม]\n\n4. การเปิดเผยข้อมูล\n[ระบุผู้รับข้อมูลหรือประเภทผู้รับข้อมูล]\n\n5. ระยะเวลาเก็บรักษา\n[ระบุระยะเวลาหรือเกณฑ์ที่ใช้กำหนด]\n\n6. สิทธิของเจ้าของข้อมูล\nท่านอาจมีสิทธิเข้าถึง แก้ไข ลบ จำกัด คัดค้าน โอนย้าย หรือถอนความยินยอมตามที่กฎหมายกำหนด\n\n7. ช่องทางติดต่อและร้องเรียน\n[ระบุช่องทางยื่นคำร้องและข้อมูล DPO ถ้ามี]`,
  },
  {
    id: "consent-form",
    title: "แบบฟอร์มขอความยินยอม",
    purpose: "ขอความยินยอมแบบแยกวัตถุประสงค์และถอนภายหลังได้",
    content: `แบบฟอร์มขอความยินยอม (Consent Form)\n\nผู้ควบคุมข้อมูล: [ชื่อองค์กร]\nเจ้าของข้อมูล: [ชื่อ/อีเมล/รหัสอ้างอิง]\n\nโปรดเลือกโดยอิสระสำหรับแต่ละวัตถุประสงค์\n[ ] ยินยอม  [ ] ไม่ยินยอม — [วัตถุประสงค์ที่ 1 พร้อมข้อมูลและระยะเวลา]\n[ ] ยินยอม  [ ] ไม่ยินยอม — [วัตถุประสงค์ที่ 2 พร้อมข้อมูลและระยะเวลา]\n\nการไม่ให้ความยินยอมจะมีผลดังนี้: [ระบุผลที่เกิดขึ้นจริง]\nท่านถอนความยินยอมได้ที่: [ช่องทาง] โดยการถอนจะไม่กระทบการประมวลผลที่ชอบด้วยกฎหมายก่อนถอน\n\nชื่อผู้ให้ความยินยอม: ____________________\nวันที่และเวลา: ____________________\nหลักฐาน/รหัสรายการ: ____________________`,
  },
  {
    id: "withdrawal-form",
    title: "แบบฟอร์มถอนความยินยอม",
    purpose: "รับคำขอถอนและบันทึกผลกระทบกับวันที่ดำเนินการ",
    content: `แบบฟอร์มถอนความยินยอม\n\nถึง [ชื่อองค์กร]\nข้าพเจ้า [ชื่อเจ้าของข้อมูล] อีเมล/รหัสอ้างอิง [ระบุ] ประสงค์ถอนความยินยอมสำหรับ\n[ ] วัตถุประสงค์ทั้งหมด\n[ ] เฉพาะวัตถุประสงค์: [ระบุ]\n\nช่องทางที่เคยให้ความยินยอม: [ระบุ]\nวันที่โดยประมาณที่ให้ความยินยอม: [ระบุ]\nเหตุผล (ไม่บังคับ): [ระบุ]\n\nข้าพเจ้ารับทราบว่าการถอนความยินยอมไม่กระทบความชอบด้วยกฎหมายของการประมวลผลก่อนการถอน\n\nลงชื่อ/ยืนยันตัวตน: ____________________\nวันที่และเวลา: ____________________\nสำหรับเจ้าหน้าที่ — เลขคำขอ/ผล/วันที่ดำเนินการ: ____________________`,
  },
  {
    id: "data-subject-request",
    title: "แบบฟอร์มคำร้องเจ้าของข้อมูล",
    purpose: "รองรับคำขอใช้สิทธิตาม PDPA และติดตามการดำเนินงาน",
    content: `แบบฟอร์มคำร้องขอใช้สิทธิของเจ้าของข้อมูล\n\nข้อมูลผู้ยื่นคำร้อง\nชื่อ: [ระบุ]  อีเมล/โทรศัพท์: [ระบุ]  ความสัมพันธ์กับเจ้าของข้อมูล: [ระบุ]\n\nสิทธิที่ต้องการใช้\n[ ] เข้าถึง/ขอสำเนา  [ ] แก้ไข  [ ] ลบ  [ ] จำกัดการใช้\n[ ] คัดค้าน  [ ] โอนย้าย  [ ] ถอนความยินยอม  [ ] อื่น ๆ\n\nรายละเอียดและข้อมูลที่เกี่ยวข้อง: [ระบุ]\nช่วงเวลาของข้อมูล: [ระบุ]\nช่องทางรับผลคำร้อง: [ระบุ]\n\nเอกสารยืนยันตัวตนที่จำเป็นและได้สัดส่วน: [ระบุ]\nวันที่ยื่นคำร้อง: [ระบุ]\n\nสำหรับเจ้าหน้าที่ — เลขคำร้อง/ผู้รับผิดชอบ/กำหนดตอบ/ผลการพิจารณา: [ระบุ]`,
  },
  {
    id: "collection-notice",
    title: "ข้อความแจ้งการเก็บข้อมูล",
    purpose: "ข้อความสั้นสำหรับหน้าเว็บ จุดบริการ หรือก่อนเริ่มกรอกแบบฟอร์ม",
    content: `ข้อความแจ้งการเก็บข้อมูลส่วนบุคคล\n\n[ชื่อองค์กร] จะเก็บข้อมูล [ระบุข้อมูล] เพื่อ [ระบุวัตถุประสงค์] โดยอาศัย [ระบุฐานกฎหมาย] และเก็บไว้เป็นเวลา [ระบุระยะเวลา]\n\nเราอาจเปิดเผยข้อมูลแก่ [ระบุผู้รับข้อมูล] เท่าที่จำเป็น ท่านสามารถอ่านประกาศความเป็นส่วนตัวฉบับเต็มได้ที่ [ลิงก์] และใช้สิทธิหรือติดต่อเราได้ที่ [อีเมล/โทรศัพท์/DPO]\n\nหากกิจกรรมนี้อาศัยความยินยอม ท่านเลือกให้หรือไม่ให้ความยินยอมได้โดยอิสระและถอนภายหลังได้ผ่าน [ช่องทาง]`,
  },
] satisfies Array<
  Pick<DocumentTemplate, "id" | "title" | "purpose" | "content">
>;

function fullText(template: DocumentTemplate) {
  return `${template.content}\n\nข้อควรทราบ\n${template.disclaimer || disclaimer}`;
}

export default function DocumentTemplates() {
  const [selected, setSelected] = useState<DocumentTemplate | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>(
    builtinTemplates.map((template) => ({
      ...template,
      category: template.id,
      disclaimer,
      fields: [],
      status: "active",
      createdAt: "",
      updatedAt: "",
    })),
  );

  useEffect(() => {
    void api.templates.list().then((response) => {
      if (response.success && response.data?.length)
        setTemplates(response.data);
    });
  }, []);

  async function copyTemplate(template: DocumentTemplate) {
    await navigator.clipboard.writeText(fullText(template));
    setCopied(template.id);
    window.setTimeout(
      () => setCopied((current) => (current === template.id ? null : current)),
      1800,
    );
  }
  function downloadTemplate(template: DocumentTemplate) {
    const blob = new Blob([fullText(template)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${template.id}-template.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
          PDPA document kit
        </p>
        <h1 className="text-xl font-black text-gray-900">คลังแบบฟอร์ม PDPA</h1>
        <p className="mt-1 text-sm text-gray-500">
          เลือกแบบฟอร์มเริ่มต้น แล้วปรับข้อความให้ตรงกับกระบวนการจริงขององค์กร
        </p>
      </div>
      <div className="mb-5 flex gap-3 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>ข้อควรทราบ:</strong> {disclaimer}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template, index) => (
          <article
            key={template.id}
            className="group flex min-h-56 flex-col border border-gray-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="mb-5 flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center border border-emerald-100 bg-emerald-50 text-emerald-700">
                <FileText className="h-5 w-5" />
              </span>
              <span className="font-mono text-xs text-gray-300">
                T{String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="font-bold text-gray-900">{template.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-gray-500">
              {template.purpose}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelected(template)}
                className="inline-flex items-center gap-1.5 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-3.5 w-3.5" />
                ดูตัวอย่าง
              </button>
              <button
                type="button"
                onClick={() => void copyTemplate(template)}
                className="inline-flex items-center gap-1.5 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {copied === template.id ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ClipboardCopy className="h-3.5 w-3.5" />
                )}
                {copied === template.id ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate(template)}
                className="inline-flex items-center gap-1.5 bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                <Download className="h-3.5 w-3.5" />
                ดาวน์โหลด
              </button>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <header className="sticky top-0 flex items-start justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="font-black text-gray-900">{selected.title}</h2>
                <p className="mt-1 text-xs text-gray-400">
                  ตัวอย่างสำหรับนำไปปรับใช้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="ปิด"
                className="p-1 text-gray-400 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-gray-700">
                {fullText(selected)}
              </pre>
              <div className="mt-6 flex gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => void copyTemplate(selected)}
                  className="border border-gray-200 px-4 py-2 text-sm font-semibold"
                >
                  คัดลอกข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => downloadTemplate(selected)}
                  className="bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  ดาวน์โหลด .txt
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
