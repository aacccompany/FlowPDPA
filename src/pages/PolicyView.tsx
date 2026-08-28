import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import type { PublicConsentForm } from "@/services/api";

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api"
).replace(/\/$/, "");

export default function PolicyView() {
  const { slug } = useParams<{ slug: string }>();
  const [documentHtml, setDocumentHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAcknowledgement, setSavingAcknowledgement] = useState(false);
  const [showAcknowledgement, setShowAcknowledgement] = useState(true);
  const [error, setError] = useState("");
  const [consentForm, setConsentForm] = useState<PublicConsentForm | null>(
    null,
  );
  const [consentChoices, setConsentChoices] = useState<Record<string, boolean>>(
    {},
  );
  const [subjectEmail, setSubjectEmail] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [fieldValues, setFieldValues] = useState<
    Record<string, string | boolean>
  >({});
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentComplete, setConsentComplete] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void api.consents.publicForPolicy(slug).then((response) => {
      if (response.success && response.data) {
        setConsentForm(response.data);
        setConsentChoices(
          Object.fromEntries(
            response.data.purposes.map((purpose) => [purpose.id, false]),
          ),
        );
      }
    });
    const controller = new AbortController();
    void fetch(`${API_BASE_URL}/policies/public/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`ไม่สามารถเรียกเอกสารได้ (${response.status})`);
        return response.text();
      })
      .then(setDocumentHtml)
      .catch((fetchError) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        )
          return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "ไม่สามารถโหลดเอกสารได้",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [slug]);

  const acknowledgeDocument = async () => {
    if (!slug || savingAcknowledgement) return;
    setSavingAcknowledgement(true);
    setError("");
    const response = await api.policies.recordPublicAcknowledgement(slug);
    setSavingAcknowledgement(false);
    if (!response.success) {
      setError(
        response.error?.message ||
          "ไม่สามารถบันทึกการรับทราบได้ กรุณาลองใหม่อีกครั้ง",
      );
      return;
    }
    setShowAcknowledgement(false);
  };

  const saveConsentChoices = async () => {
    if (!consentForm || !subjectEmail || savingConsent) return;
    setSavingConsent(true);
    setError("");
    const missingRequired = consentForm.fields.some(
      (field) => field.required && !fieldValues[field.id],
    );
    if (missingRequired) {
      setError("กรุณากรอกช่องข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    const response = await api.consents.submitPublic(consentForm.token, {
      subjectName,
      subjectEmail,
      choices: consentChoices,
      fieldValues,
    });
    setSavingConsent(false);
    if (!response.success) {
      setError(
        response.error?.message || "ไม่สามารถบันทึกตัวเลือกความยินยอมได้",
      );
      return;
    }
    setConsentComplete(true);
  };

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          กำลังโหลดเอกสาร...
        </div>
      </main>
    );

  if (!slug || !documentHtml) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
          <h1 className="mb-2 text-lg font-semibold text-gray-900">
            ไม่สามารถเปิดเอกสารได้
          </h1>
          <p className="mb-5 text-sm text-gray-500">
            {error || "เอกสารนี้ไม่ได้เผยแพร่เป็นสาธารณะ"}
          </p>
          <Link to="/" className="text-sm font-semibold text-emerald-700">
            กลับไปยัง FlowPDPA
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-gray-100">
      <iframe
        title="เอกสารนโยบายสาธารณะ"
        srcDoc={documentHtml}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        className="h-screen w-full border-0 bg-white"
      />
      {showAcknowledgement && (
        <section
          aria-labelledby="acknowledgement-title"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-2xl sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1
                id="acknowledgement-title"
                className="text-sm font-semibold text-gray-900"
              >
                กรุณาตรวจสอบเอกสารก่อนรับทราบ
              </h1>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                คุณสามารถอ่านเอกสารฉบับเต็มด้านบนได้
                การกดรับทราบเป็นเพียงการยืนยันว่า คุณได้ตรวจสอบประกาศนี้แล้ว
                ไม่ใช่การให้ความยินยอมสำหรับการประมวลผลข้อมูล ที่เป็นทางเลือก
              </p>
              {error && (
                <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={savingAcknowledgement}
                  onClick={() => setShowAcknowledgement(false)}
                  className="h-10 rounded border border-gray-300 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  อ่านต่อโดยไม่กดรับทราบ
                </button>
                <button
                  type="button"
                  disabled={savingAcknowledgement}
                  onClick={() => void acknowledgeDocument()}
                  className="flex h-10 items-center justify-center gap-2 rounded bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {savingAcknowledgement ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {savingAcknowledgement
                    ? "กำลังบันทึก..."
                    : "ฉันได้อ่านและรับทราบแล้ว"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      {!showAcknowledgement && consentForm && !consentComplete && (
        <section
          aria-labelledby="consent-title"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[90vh] max-w-3xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 shadow-2xl"
        >
          <h2
            id="consent-title"
            className="text-base font-semibold text-gray-900"
          >
            {consentForm.name}
          </h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {consentForm.description ||
              "เลือกว่าคุณยินยอมต่อวัตถุประสงค์การประมวลผลข้อมูลแต่ละข้อหรือไม่"}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              className="h-10 rounded border border-gray-300 px-3 text-sm"
              placeholder="ชื่อของคุณ (ไม่บังคับ)"
            />
            <input
              required
              type="email"
              value={subjectEmail}
              onChange={(event) => setSubjectEmail(event.target.value)}
              className="h-10 rounded border border-gray-300 px-3 text-sm"
              placeholder="อีเมลของคุณ"
            />
          </div>
          {consentForm.fields.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {consentForm.fields.map((field) => (
                <label
                  key={field.id}
                  className={`text-xs font-semibold text-gray-700 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
                >
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                  {field.type === "textarea" ? (
                    <textarea
                      value={String(fieldValues[field.id] || "")}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="mt-1.5 min-h-20 w-full rounded border border-gray-300 p-3 text-sm font-normal"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={String(fieldValues[field.id] || "")}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal"
                    >
                      <option value="">เลือก...</option>
                      {field.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <span className="mt-2 flex items-center gap-2 font-normal">
                      <input
                        type="checkbox"
                        checked={Boolean(fieldValues[field.id])}
                        onChange={(event) =>
                          setFieldValues((current) => ({
                            ...current,
                            [field.id]: event.target.checked,
                          }))
                        }
                      />
                      {field.placeholder || field.label}
                    </span>
                  ) : (
                    <input
                      type={field.type}
                      value={String(fieldValues[field.id] || "")}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="mt-1.5 h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal"
                    />
                  )}
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2">
            {consentForm.purposes.map((purpose) => (
              <label
                key={purpose.id}
                className="flex cursor-pointer items-start gap-3 rounded border border-gray-200 p-3"
              >
                <input
                  type="checkbox"
                  checked={Boolean(consentChoices[purpose.id])}
                  onChange={(event) =>
                    setConsentChoices((current) => ({
                      ...current,
                      [purpose.id]: event.target.checked,
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    {purpose.label}
                  </span>
                  {purpose.description && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {purpose.description}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {error && (
            <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!subjectEmail || savingConsent}
              onClick={() => void saveConsentChoices()}
              className="flex h-10 items-center gap-2 rounded bg-emerald-700 px-5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {savingConsent && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึกตัวเลือกของฉัน
            </button>
          </div>
        </section>
      )}
      {consentComplete && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          บันทึกตัวเลือกความยินยอมของคุณแล้ว
        </div>
      )}
    </main>
  );
}
