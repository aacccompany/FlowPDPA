import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileEdit,
  Globe2,
  Search,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import type {
  ChangeRequestPriority,
  PolicyActivityLog,
  PolicyActivityType,
  PolicyChangeRequest,
  PolicyLanguage,
  SavedPolicy,
} from "@/services/api";

const requestStatus: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "Pending Legal review",
    className: "bg-amber-50 text-amber-700",
  },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700" },
};

const activityLabel: Record<PolicyActivityLog["type"], string> = {
  document_acknowledged: "Customer acknowledged document",
  customer_consent: "Customer consented",
  merchant_change_requested: "Sent change request to Legal",
  legal_document_updated: "Legal updated document",
};

export default function PolicyEdit() {
  const { policyId = "" } = useParams();
  const { auth } = useAuth();
  const [policy, setPolicy] = useState<SavedPolicy | null>(null);
  const [requests, setRequests] = useState<PolicyChangeRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<PolicyActivityLog[]>([]);
  const [activityType, setActivityType] = useState<"all" | PolicyActivityType>(
    "all",
  );
  const [activitySearch, setActivitySearch] = useState("");
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
    priority: "normal" as ChangeRequestPriority,
  });

  const filteredActivityLogs = useMemo(() => {
    const query = activitySearch.trim().toLocaleLowerCase();
    return activityLogs.filter((log) => {
      if (activityType !== "all" && log.type !== activityType) return false;
      if (!query) return true;
      return [
        log.id,
        log.relatedField,
        log.relatedType,
        log.description,
        activityLabel[log.type],
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [activityLogs, activitySearch, activityType]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.policies.get(policyId),
      api.policies.listChangeRequests(policyId),
      api.policies.listActivityLogs(policyId),
    ]).then(([policyResponse, requestsResponse, activityResponse]) => {
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
        loadError = policyResponse.error?.message || "Unable to load policy.";
      }
      if (requestsResponse.success && requestsResponse.data)
        setRequests(requestsResponse.data);
      else if (!loadError) loadError = requestsResponse.error?.message || "";
      if (activityResponse.success && activityResponse.data)
        setActivityLogs(activityResponse.data);
      else if (!loadError) loadError = activityResponse.error?.message || "";
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
      priority: form.priority,
    });
    setSaving(false);
    if (!response.success || !response.data) {
      setError(response.error?.message || "Unable to send request to Legal.");
      return;
    }
    setRequests((current) => [response.data!, ...current]);
    const activityResponse = await api.policies.listActivityLogs(policyId);
    if (activityResponse.success && activityResponse.data)
      setActivityLogs(activityResponse.data);
    setForm((current) => ({
      ...current,
      sectionTitle: "",
      requestedChange: "",
      reason: "",
      priority: "normal",
    }));
    setSuccess("Change request sent to Legal.");
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
    <div className="min-h-screen bg-[#f4f6f9] text-[#172033]">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/dashboard"
            state={{ view: "policies" }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Back to policies"
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
        {policy.shareUrl && (
          <a
            href={`/p/${policy.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-2 rounded border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            หน้าสาธารณะ
          </a>
        )}
      </header>

      <main className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-5">
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
                  <Globe2 className="mr-1.5 inline h-3.5 w-3.5" />
                  {language === "th" ? "Thai" : "English"}
                </button>
              ))}
            </div>
          </div>
          {html ? (
            <iframe
              title={`${previewLanguage} policy preview`}
              srcDoc={html}
              sandbox=""
              className="h-[calc(100vh-150px)] min-h-[620px] w-full border-0 bg-white"
            />
          ) : (
            <div className="grid min-h-[620px] place-items-center text-sm text-gray-400">
              No {previewLanguage === "th" ? "Thai" : "English"} content
              available.
            </div>
          )}
        </section>

        <aside className="space-y-4">
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
              <label className="block text-xs font-semibold text-gray-600">
                ระดับความสำคัญ
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as ChangeRequestPriority,
                    }))
                  }
                  className="mt-1.5 h-10 w-full border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="low">ต่ำ</option>
                  <option value="normal">ปกติ</option>
                  <option value="high">สูง</option>
                  <option value="urgent">เร่งด่วน</option>
                </select>
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
              {saving ? "Sending..." : "Send to Legal"}
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
                No change requests yet.
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
                          {request.sectionTitle || "General policy request"}
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

          <section className="rounded border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold">กิจกรรมเอกสาร</h2>
              <p className="mt-1 text-xs text-gray-500">
                ประวัติความยินยอมและขั้นตอนเอกสารที่ไม่สามารถแก้ไขย้อนหลังได้
              </p>
            </div>
            <div className="grid gap-2 border-b border-gray-100 p-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <span className="sr-only">Search activity logs</span>
                <input
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                  className="h-9 w-full rounded border border-gray-200 pl-9 pr-3 text-xs"
                  placeholder="Search ID, field, description"
                />
              </label>
              <label>
                <span className="sr-only">Filter activity type</span>
                <select
                  value={activityType}
                  onChange={(event) =>
                    setActivityType(
                      event.target.value as "all" | PolicyActivityType,
                    )
                  }
                  className="h-9 w-full rounded border border-gray-200 bg-white px-3 text-xs text-gray-700"
                >
                  <option value="all">All activity types</option>
                  <option value="document_acknowledged">
                    Document acknowledgement
                  </option>
                  <option value="customer_consent">Customer consent</option>
                  <option value="merchant_change_requested">
                    Merchant change request
                  </option>
                  <option value="legal_document_updated">
                    Legal document update
                  </option>
                </select>
              </label>
              <p className="text-[11px] text-gray-400 sm:col-span-2">
                Showing {filteredActivityLogs.length} of {activityLogs.length}{" "}
                events
              </p>
            </div>
            {activityLogs.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400">
                No activity recorded yet.
              </div>
            ) : filteredActivityLogs.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400">
                No activity matches these filters.
              </div>
            ) : (
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">ID</th>
                      <th className="px-3 py-2 font-semibold">Related field</th>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="px-3 py-2 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredActivityLogs.map((log) => (
                      <tr key={log.id}>
                        <td
                          className="max-w-24 truncate px-3 py-3 font-mono text-[10px] text-gray-400"
                          title={log.id}
                        >
                          {log.id}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {log.relatedField || log.relatedType}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-gray-700">
                            {activityLabel[log.type]}
                          </p>
                          <p className="mt-1 text-gray-500">
                            {log.description}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-400">
                          {new Date(log.createdAt).toLocaleString("th-TH")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}
