import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileEdit,
  Globe2,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import "./MerchantFlow.css";
import type {
  PolicyChangeRequest,
  PolicyLanguage,
  SavedPolicy,
} from "@/services/api";

const requestStatus: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "รอฝ่ายกฎหมายตรวจสอบ",
    className: "bg-amber-50 text-amber-700",
  },
  resolved: { label: "ดำเนินการแล้ว", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "ไม่ดำเนินการ", className: "bg-red-50 text-red-700" },
};

function PolicyProgress({ policy }: { policy: SavedPolicy }) {
  const [copied, setCopied] = useState(false);
  const reviewed = policy.status !== "pending_review";
  const publicUrl = policy.shareUrl ?? null;
  const copyPublicLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold">สถานะนโยบาย</h2>
      <ol className="merchant-timeline mt-3">
        <li data-done="true">
          <span className="merchant-timeline-mark"><CheckCircle2 className="h-4 w-4" /></span>
          <p className="text-sm font-semibold">ส่งให้ตรวจสอบแล้ว</p>
        </li>
        <li data-done={reviewed} data-current={!reviewed}>
          <span className="merchant-timeline-mark">
            {reviewed ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          </span>
          <p className="text-sm font-semibold">
            {reviewed ? "ฝ่ายกฎหมายตรวจสอบแล้ว" : "รอฝ่ายกฎหมายตรวจสอบ"}
          </p>
        </li>
      </ol>
      {publicUrl && (
        <button type="button" className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700" onClick={() => void copyPublicLink()}>
          <Copy className="h-4 w-4" />
          {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์สาธารณะ"}
        </button>
      )}
    </section>
  );
}

export default function PolicyEdit() {
  const [theme, toggleTheme] = useTheme("flowpdpa-merchant-theme");
  const { policyId = "" } = useParams();
  const { auth } = useAuth();
  const [policy, setPolicy] = useState<SavedPolicy | null>(null);
  const [requests, setRequests] = useState<PolicyChangeRequest[]>([]);
  const [previewLanguage, setPreviewLanguage] = useState<"th" | "en">("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    language: "th" as PolicyLanguage,
    sectionTitle: "",
    requestedChange: "",
    reason: "",
  });

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.policies.get(policyId),
      api.policies.listChangeRequests(policyId),
    ]).then(([policyResponse, requestsResponse]) => {
      if (!active) return;
      let loadError = "";
      if (policyResponse.success && policyResponse.data) {
        setPolicy(policyResponse.data);
        const language = policyResponse.data.language === "en" ? "en" : "th";
        setPreviewLanguage(language);
        setForm((current) => ({
          ...current,
          language: policyResponse.data!.language,
        }));
      } else {
        loadError = policyResponse.error?.message || "ไม่สามารถโหลดนโยบายได้";
      }
      if (requestsResponse.success && requestsResponse.data)
        setRequests(requestsResponse.data);
      else if (!loadError) loadError = requestsResponse.error?.message || "";
      setError(loadError);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [policyId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth?.email || !form.requestedChange.trim()) return;
    setSaving(true);
    setError("");
    setSuccess("");
    const response = await api.policies.createChangeRequest(policyId, {
      requesterName: auth.name,
      requesterEmail: auth.email,
      language: form.language,
      sectionTitle: form.sectionTitle.trim() || undefined,
      requestedChange: form.requestedChange.trim(),
      reason: form.reason.trim() || undefined,
      merchantComment: form.reason.trim() || undefined,
      priority: "normal",
    });
    setSaving(false);
    if (!response.success || !response.data) {
      setError(response.error?.message || "ไม่สามารถส่งคำขอให้ฝ่ายกฎหมายได้");
      return;
    }
    setRequests((current) => [response.data!, ...current]);
    setForm((current) => ({
      ...current,
      sectionTitle: "",
      requestedChange: "",
      reason: "",
    }));
    setSuccess("ส่งคำขอแก้ไขให้ฝ่ายกฎหมายแล้ว ระหว่างนี้เอกสารที่เผยแพร่จะยังไม่เปลี่ยน");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#f4f6f9] grid place-items-center text-sm text-gray-500">
        กำลังโหลดนโยบาย...
      </div>
    );
  if (!policy)
    return (
      <div className="min-h-screen bg-[#f4f6f9] p-6">
        <Link
          to="/dashboard"
          state={{ view: "policies" }}
          className="text-sm text-emerald-700"
        >
          กลับไปยังนโยบาย
        </Link>
        <p className="mt-6 text-sm text-red-700">{error || "ไม่พบนโยบาย"}</p>
      </div>
    );

  const html =
    previewLanguage === "th"
      ? policy.htmlContentByLanguage.th
      : policy.htmlContentByLanguage.en;
  const languages = (["th", "en"] as const).filter(
    (language) => policy.language === "both" || policy.language === language,
  );

  return (
    <div className="merchant-flow min-h-screen bg-[#f4f6f9] text-[#172033]" data-theme={theme}>
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/dashboard"
            state={{ view: "policies" }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="กลับไปยังรายการนโยบาย"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {policy.typeName}
            </h1>
            <p className="truncate text-xs text-gray-500">
              {policy.websiteName} · {policy.domain}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        {policy.shareUrl && (
          <a
            href={`/p/${policy.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-2 rounded border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            หน้าสาธารณะ
          </a>
        )}
        </div>
      </header>

      <main className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-5">
        <section className="min-w-0 overflow-hidden rounded border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">เอกสารนโยบาย</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                ดูตัวอย่างฉบับปัจจุบันและระบุหัวข้อที่ต้องการแก้ไข
              </p>
            </div>
            <div className="flex gap-1">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => setPreviewLanguage(language)}
                  className={`h-8 rounded border px-3 text-xs font-semibold ${previewLanguage === language ? "border-emerald-700 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"}`}
                >
                  <Globe2 className="mr-1.5 inline h-4 w-4" />
                  {language === "th" ? "ภาษาไทย" : "English"}
                </button>
              ))}
            </div>
          </div>
          {html ? (
            <iframe
              title={`ตัวอย่างนโยบายภาษา${previewLanguage === "th" ? "ไทย" : "อังกฤษ"}`}
              srcDoc={html}
              sandbox=""
              className="h-[calc(100vh-150px)] min-h-[620px] w-full border-0 bg-white"
            />
          ) : (
            <div className="grid min-h-[620px] place-items-center text-sm text-gray-400">
              ไม่มีเนื้อหาภาษา{previewLanguage === "th" ? "ไทย" : "อังกฤษ"}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <PolicyProgress policy={policy} />
          {policy.status === "rejected" && (
            <section
              role="status"
              className="rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-red-800">
                <AlertTriangle className="h-4 w-4" />
                ฝ่ายกฎหมายไม่อนุมัตินโยบายนี้
              </h2>
              <p className="mt-2 text-sm leading-6 text-red-900 whitespace-pre-wrap">
                {policy.reviewComment
                  ? "เหตุผล: " + policy.reviewComment
                  : "ฝ่ายกฎหมายไม่ได้ระบุเหตุผลไว้"}
              </p>
            </section>
          )}
          <form
            onSubmit={submit}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-emerald-50 text-emerald-700">
                <FileEdit className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">ขอแก้ไขนโยบาย</h2>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  คำขอจะถูกส่งให้ฝ่ายกฎหมาย
                  เอกสารที่เผยแพร่จะยังไม่เปลี่ยนแปลงจนกว่าจะได้รับอนุมัติ
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-600">
                ภาษา
                <select
                  value={form.language}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      language: event.target.value as PolicyLanguage,
                    }))
                  }
                  className="mt-1.5 h-10 w-full border border-gray-300 bg-white px-3 text-sm"
                >
                  {policy.language !== "en" && (
                    <option value="th">ภาษาไทย</option>
                  )}
                  {policy.language !== "th" && (
                    <option value="en">ภาษาอังกฤษ</option>
                  )}
                  {policy.language === "both" && (
                    <option value="both">ภาษาไทย + ภาษาอังกฤษ</option>
                  )}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                หัวข้อ
                <input
                  value={form.sectionTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sectionTitle: event.target.value,
                    }))
                  }
                  className="mt-1.5 h-10 w-full border border-gray-300 px-3 text-sm"
                  placeholder="ตัวอย่าง: 7. ระยะเวลาการเก็บรักษาข้อมูล"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                รายละเอียดที่ต้องการแก้ไข{" "}
                <span className="text-red-600">*</span>
                <textarea
                  required
                  value={form.requestedChange}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requestedChange: event.target.value,
                    }))
                  }
                  className="mt-1.5 min-h-28 w-full border border-gray-300 p-3 text-sm"
                  placeholder="อธิบายสิ่งที่ต้องการให้ฝ่ายกฎหมายแก้ไขอย่างชัดเจน"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                เหตุผล
                <textarea
                  value={form.reason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  className="mt-1.5 min-h-20 w-full border border-gray-300 p-3 text-sm"
                  placeholder="เหตุผลทางธุรกิจหรือคำขอจากลูกค้าที่ตรวจสอบแล้ว"
                />
              </label>
            </div>
            {error && (
              <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-3 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </p>
            )}
            <button
              disabled={saving}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded bg-emerald-700 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {saving ? "กำลังส่ง..." : "ส่งให้ฝ่ายกฎหมาย"}
            </button>
          </form>

          <section className="rounded border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold">ประวัติคำขอแก้ไข</h2>
              <p className="mt-1 text-xs text-gray-500">
                {requests.length} คำขอสำหรับนโยบายนี้
              </p>
            </div>
            {requests.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400">
                ยังไม่มีคำขอแก้ไข
              </div>
            ) : (
              <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
                {requests.map((request) => {
                  const status =
                    requestStatus[request.status] ||
                    requestStatus.pending_review;
                  return (
                    <article key={request.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-semibold text-gray-800">
                          {request.sectionTitle || "คำขอทั่วไปเกี่ยวกับนโยบาย"}
                        </p>
                        <span
                          className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        {request.requestedChange}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock3 className="h-3 w-3" />
                        {new Date(request.createdAt).toLocaleString("th-TH")}
                      </p>
                      {request.legalComment && (
                        <p className="mt-3 border-l-2 border-emerald-600 pl-2 text-xs text-gray-600">
                          Legal: {request.legalComment}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

        </aside>
      </main>
    </div>
  );
}
