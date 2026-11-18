import { useEffect, useState } from "react";
import { Check, ClipboardCopy, Eye, FileText, X } from "lucide-react";

import { useEscapeKey } from "@/hooks/useEscapeKey";
import { api, type DocumentTemplate } from "@/services/api";

function fullText(template: DocumentTemplate) {
  return template.disclaimer
    ? `${template.content}\n\nข้อควรทราบ\n${template.disclaimer}`
    : template.content;
}

export default function DocumentTemplates() {
  const [selected, setSelected] = useState<DocumentTemplate | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey(() => setSelected(null), selected !== null);

  useEffect(() => {
    let cancelled = false;

    void api.templates.list().then((response) => {
      if (cancelled) return;

      if (response.success) {
        setTemplates(response.data ?? []);
        setError(null);
      } else {
        setError(response.error?.message ?? "ไม่สามารถโหลดแบบฟอร์มได้");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function copyTemplate(template: DocumentTemplate) {
    await navigator.clipboard.writeText(fullText(template));
    setCopied(template.id);
    window.setTimeout(
      () => setCopied((current) => (current === template.id ? null : current)),
      1800,
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900">คลังแบบฟอร์ม PDPA</h1>
        <p className="mt-1 text-sm text-gray-500">
          เลือกแบบฟอร์มที่องค์กรจัดเตรียมไว้ แล้วปรับข้อความให้ตรงกับกระบวนการจริง
        </p>
      </div>

      {loading ? (
        <div className="border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          กำลังโหลดแบบฟอร์ม…
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : templates.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-800">ยังไม่มีแบบฟอร์ม</p>
          <p className="mt-1 text-sm text-gray-500">
            แบบฟอร์มที่ผู้ดูแลระบบเปิดใช้งานจะแสดงที่นี่
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <article
              key={template.id}
              className="group flex min-h-56 flex-col border border-gray-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
            >
              <span className="mb-5 grid h-10 w-10 place-items-center border border-emerald-100 bg-emerald-50 text-emerald-700">
                <FileText className="h-5 w-5" />
              </span>
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
                  <Eye className="h-4 w-4" />
                  ดูตัวอย่าง
                </button>
                <button
                  type="button"
                  onClick={() => void copyTemplate(template)}
                  className="inline-flex items-center gap-1.5 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {copied === template.id ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ClipboardCopy className="h-4 w-4" />
                  )}
                  {copied === template.id ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected ? (
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
              <div className="mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => void copyTemplate(selected)}
                  className="border border-gray-200 px-4 py-2 text-sm font-semibold"
                >
                  คัดลอกข้อความ
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
