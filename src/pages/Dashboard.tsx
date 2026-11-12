import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useTheme } from "@/hooks/useTheme";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  Download,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  X,
  ExternalLink,
  Loader,
  MailCheck,
  FileType2,
  Code2,
  Search,
  ChevronLeft,
  FileEdit,
  Activity,
  CreditCard,
  ReceiptText,
} from "lucide-react";
import {
  fetchContact,
  updateContact,
  defaultProfile,
  type ContactProfile,
} from "@/api/contact";
import type { SavedPolicy } from "@/utils/policyStorage";
import type {
  ConsentActivityLog,
  ConsentActivityType,
  ConsentPurpose,
  ConsentUsage,
  ConsentLogAddon,
  PolicyActivityLog,
  PolicyActivityType,
  MerchantBillingHistory,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { api, API_ENDPOINTS, peekApiCache } from "@/services/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import "./Dashboard.css";
import ConsentManagement from "./ConsentManagement";
import DocumentTemplates from "./DocumentTemplates";

// ── Auth helper ───────────────────────────────────────────────
type AuthUser = {
  name: string;
  email: string;
  plan: string;
  company?: string;
  phone?: string;
  emailVerified: boolean;
};

// ── Policy helpers ───────────────────────────────────────────

const langDisplay: Record<string, string> = {
  th: "TH",
  en: "EN",
  both: "TH + EN",
};

function useMerchantPolicies() {
  const [policies, setPolicies] = useState<SavedPolicy[]>(
    () => peekApiCache<SavedPolicy[]>(API_ENDPOINTS.policies.root)?.data ?? [],
  );
  const [loading, setLoading] = useState(
    () => !peekApiCache<SavedPolicy[]>(API_ENDPOINTS.policies.root)?.success,
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void api.policies.list().then((response) => {
      if (!active) return;
      if (response.success && response.data) {
        setPolicies(response.data);
        setError("");
      } else {
        // Keep what we already had: a failed load must not look like "no policies".
        setError(response.error?.message || "โหลดรายการนโยบายไม่สำเร็จ");
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  return { policies, setPolicies, loading, error, reload };
}

// ── Sidebar nav items ─────────────────────────────────────────
const merchantNavGroups = [
  {
    label: "ภาพรวม",
    items: [
      { key: "overview", label: "ภาพรวมการทำงาน", Icon: LayoutDashboard },
    ],
  },
  {
    label: "เอกสาร PDPA",
    items: [
      { key: "policies", label: "นโยบายของฉัน", Icon: FileText },
      { key: "new", label: "สร้าง Policy ใหม่", Icon: Plus },
      { key: "templates", label: "คลังแบบฟอร์ม PDPA", Icon: FileType2 },
    ],
  },
  {
    label: "ความยินยอมและหลักฐาน",
    items: [
      { key: "consents", label: "จัดการความยินยอม", Icon: CheckCircle },
      { key: "activity", label: "บันทึกกิจกรรม", Icon: Activity },
    ],
  },
  {
    label: "บัญชี",
    items: [
      { key: "billing", label: "แพ็กเกจและฟีเจอร์", Icon: CreditCard },
      { key: "settings", label: "ตั้งค่าบัญชี", Icon: Settings },
    ],
  },
];

const navItems = merchantNavGroups.flatMap((group) => group.items);

// Primary navigation (settings lives behind the account chip, "create" is the always-visible button).
const topNavItems = [
  { key: "overview", label: "ภาพรวม", Icon: LayoutDashboard },
  { key: "policies", label: "นโยบาย", Icon: FileText },
  { key: "templates", label: "แบบฟอร์ม", Icon: FileType2 },
  { key: "consents", label: "ความยินยอม", Icon: CheckCircle },
  { key: "activity", label: "กิจกรรม", Icon: Activity },
  { key: "billing", label: "แพ็กเกจ", Icon: CreditCard },
];

const subscriptionStatusLabel: Record<string, string> = {
  active: "ใช้งานอยู่",
  trialing: "ช่วงทดลองใช้",
  past_due: "ค้างชำระ",
  unpaid: "ยังไม่ได้ชำระ",
  canceled: "ยกเลิกแล้ว",
  incomplete: "ยังไม่เสร็จสมบูรณ์",
};

const consentStatusLabel: Record<string, string> = {
  active: "ใช้งานอยู่",
  granted: "ให้ความยินยอม",
  rejected: "ปฏิเสธ",
  withdrawn: "ถอนความยินยอมแล้ว",
};

// ── Helpers ───────────────────────────────────────────────────
const statusDisplay: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending_review: {
    label: "รอตรวจสอบ",
    color: "#8a4f05",
    bg: "rgba(138,79,5,0.1)",
  },
  pending_admin_review: {
    label: "รอ Admin ตรวจซ้ำ",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.1)",
  },
  changes_requested_by_admin: {
    label: "Admin ส่งกลับ Legal",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.1)",
  },
  approved: { label: "Reviewed", color: "#059669", bg: "rgba(5,150,105,0.12)" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  edited: { label: "Edited", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  Draft: { label: "Draft", color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  Active: { label: "Active", color: "#059669", bg: "rgba(5,150,105,0.12)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusDisplay[status] ?? {
    label: status,
    color: "#64748b",
    bg: "rgba(100,116,139,0.1)",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
      style={{ color: cfg.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="merchant-empty-state">
      <AlertTriangle
        className="w-6 h-6 mx-auto mb-3"
        style={{ color: "#b42318" }}
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-gray-800">
        โหลดข้อมูลไม่สำเร็จ
      </p>
      <p className="text-xs mt-1 mb-4">
        {/[ก-๙]/.test(message)
          ? message
          : "เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้งในอีกสักครู่"}
      </p>
      <button className="merchant-button primary" onClick={onRetry}>
        ลองอีกครั้ง
      </button>
    </div>
  );
}

// ── Sub-views ─────────────────────────────────────────────────
function Overview({
  setView,
  user,
}: {
  setView: (v: string) => void;
  user: AuthUser;
}) {
  const { policies: userPolicies, loading, error, reload } =
    useMerchantPolicies();
  const loadFailed = Boolean(error) && userPolicies.length === 0;
  const countBy = (status: string) =>
    userPolicies.filter((p) => p.status === status).length;
  const needsAction = userPolicies.filter((p) => p.status === "rejected");
  const recent = [...userPolicies]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);
  // The hero shows the first item that needs action; the side column only lists the rest.
  const hasSide =
    !loadFailed &&
    (needsAction.length > 1 || (!loading && countBy("approved") === 0));
  const stats = [
    { label: "นโยบายทั้งหมด", value: userPolicies.length, alert: false },
    { label: "รอตรวจสอบ", value: countBy("pending_review"), alert: false },
    { label: "อนุมัติแล้ว", value: countBy("approved"), alert: false },
    { label: "ต้องแก้ไข", value: needsAction.length, alert: true },
  ];

  return (
    <div>
      <div className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "Noto Serif Thai, serif" }}
          >
            ภาพรวมของ {user.name}
          </h1>
          <p className="text-sm text-gray-600">
            ติดตามเอกสาร การตรวจสอบ และคำขอจากที่เดียว
          </p>
        </div>
      </div>

      {!loading && !loadFailed && (
        <section className="merchant-hero" aria-label="งานของคุณ">
          {needsAction.length > 0 ? (
            <>
              <div className="min-w-0">
                <p className="text-sm text-gray-600">ต้องดำเนินการ</p>
                <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#b42318" }}>
                  มี {needsAction.length} นโยบายที่ต้องแก้ไข
                </h2>
                <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                  {needsAction[0].typeName} · {needsAction[0].domain}
                  {needsAction[0].reviewComment
                    ? " — เหตุผล: " + needsAction[0].reviewComment
                    : ""}
                </p>
              </div>
              <Link
                to={`/dashboard/policies/${needsAction[0].id}`}
                className="merchant-cta merchant-hero-cta"
              >
                แก้ไขนโยบาย <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : countBy("pending_review") > 0 ? (
            <>
              <div className="min-w-0">
                <p className="text-sm text-gray-600">สถานะล่าสุด</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  ฝ่ายกฎหมายกำลังตรวจสอบ {countBy("pending_review")} นโยบาย
                </h2>
                <p className="mt-2 text-sm text-gray-700">
                  โดยปกติภายใน 1–2 วันทำการ
                </p>
              </div>
              <button
                onClick={() => setView("policies")}
                className="merchant-button merchant-hero-cta"
              >
                ดูสถานะ <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : userPolicies.length > 0 ? (
            <>
              <div className="min-w-0">
                <p className="text-sm text-gray-600">สถานะล่าสุด</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  นโยบายของคุณพร้อมใช้งาน
                </h2>
                <p className="mt-2 text-sm text-gray-700">
                  นำลิงก์นโยบายไปติดตั้งบนเว็บไซต์ได้จากหน้านโยบาย
                </p>
              </div>
              <button
                onClick={() => setView("policies")}
                className="merchant-button merchant-hero-cta"
              >
                ไปที่นโยบายของฉัน <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-sm text-gray-600">เริ่มต้น</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  สร้างนโยบายฉบับแรกของคุณ
                </h2>
                <p className="mt-2 text-sm text-gray-700">
                  ใช้เวลาไม่กี่นาที ฝ่ายกฎหมายจะตรวจสอบก่อนเผยแพร่
                </p>
              </div>
              <Link
                to="/create/policy"
                className="merchant-cta merchant-hero-cta"
              >
                <Plus className="w-4 h-4" /> สร้างนโยบาย
              </Link>
            </>
          )}
        </section>
      )}

      <section className="merchant-kpis mb-7" aria-label="สรุปนโยบาย">
        {stats.map(({ label, value, alert }) => (
          <div key={label} className="merchant-kpi">
            <p
              className="text-3xl font-semibold tabular-nums"
              style={{ color: alert && value > 0 ? "#b42318" : undefined }}
            >
              {loading || loadFailed ? "—" : value}
            </p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </section>

      <div className="merchant-overview-grid" data-single={!hasSide}>
        <section className="merchant-panel">
          <div className="merchant-panel-head">
            <h2 className="text-base font-semibold text-gray-900">
              นโยบายล่าสุด
            </h2>
            <button
              onClick={() => setView("policies")}
              className="merchant-button"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div role="status" aria-label="กำลังโหลดนโยบาย">
              {[0, 1, 2].map((item) => (
                <div key={item} className="merchant-list-row">
                  <div className="skeleton h-4 w-40" />
                  <div className="skeleton mt-2 h-3 w-24" />
                </div>
              ))}
            </div>
          ) : loadFailed ? (
            <LoadError message={error} onRetry={reload} />
          ) : recent.length === 0 ? (
            <div className="merchant-empty-state">
              <FileText className="w-6 h-6 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">
                ยังไม่มีนโยบาย
              </p>
              <p className="text-xs mt-1 mb-4">
                สร้างนโยบายฉบับแรก ฝ่ายกฎหมายจะตรวจสอบก่อนเผยแพร่
              </p>
              <Link to="/create/policy" className="merchant-button primary">
                <Plus className="w-4 h-4" /> สร้างนโยบายแรก
              </Link>
            </div>
          ) : (
            <ul>
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/dashboard/policies/${p.id}`}
                    className="merchant-list-row merchant-list-link"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {p.typeName}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 truncate">
                        <Globe className="w-4 h-4 shrink-0" /> {p.domain}
                        <span aria-hidden="true">·</span>
                        {langDisplay[p.language] || p.language}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {hasSide && (
        <div className="space-y-7">
        {needsAction.length > 1 && (
        <section className="merchant-panel self-start">
          <div className="merchant-panel-head">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                ต้องดำเนินการอื่นๆ
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                นโยบายที่ฝ่ายกฎหมายส่งกลับให้แก้ไข
              </p>
            </div>
          </div>
          {needsAction.length === 0 ? (
            <div className="merchant-empty-state">
              <CheckCircle className="w-6 h-6 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">
                ไม่มีรายการที่ต้องแก้ไข
              </p>
            </div>
          ) : (
            <ul>
              {needsAction.slice(1).map((p) => (
                <li key={p.id} className="merchant-list-row merchant-list-stack">
                  <p className="text-sm font-semibold text-gray-900">
                    {p.typeName}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{p.domain}</p>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                    {p.reviewComment
                      ? "เหตุผลจากฝ่ายกฎหมาย: " + p.reviewComment
                      : "ฝ่ายกฎหมายไม่อนุมัติ โปรดตรวจสอบและแก้ไข"}
                  </p>
                  <Link
                    to={`/dashboard/policies/${p.id}`}
                    className="merchant-button mt-3"
                  >
                    แก้ไขนโยบาย <ArrowRight className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}
        {!loading && countBy("approved") === 0 && (
          <section className="merchant-panel self-start">
            <div className="merchant-panel-head">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  เริ่มต้นใช้งาน
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  จากสร้างนโยบายไปจนเผยแพร่บนเว็บไซต์
                </p>
              </div>
            </div>
            <ol className="merchant-steps">
              <li data-done={userPolicies.length > 0}>
                <span className="merchant-step-mark" aria-hidden="true">
                  {userPolicies.length > 0 ? <CheckCircle className="w-5 h-5" /> : "1"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    สร้างนโยบายฉบับแรก
                  </p>
                </div>
              </li>
              <li data-done="false">
                <span className="merchant-step-mark" aria-hidden="true">2</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    รอฝ่ายกฎหมายตรวจสอบและอนุมัติ
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    โดยปกติภายใน 1–2 วันทำการ
                  </p>
                </div>
              </li>
              <li data-done="false">
                <span className="merchant-step-mark" aria-hidden="true">3</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    นำลิงก์นโยบายไปติดตั้งบนเว็บไซต์
                  </p>
                  <button
                    onClick={() => setView("consents")}
                    className="merchant-button mt-2"
                  >
                    ตั้งค่าความยินยอมล่วงหน้า <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </li>
            </ol>
          </section>
        )}
        </div>
        )}
      </div>
    </div>
  );
}

const downloadFormats = [
  {
    key: "pdf",
    label: "PDF",
    description: "เอกสารพกพา (PDF)",
    Icon: FileText,
  },
  {
    key: "docx",
    label: "Word (.docx)",
    description: "ไฟล์ Word แก้ไขได้",
    Icon: FileType2,
  },
  { key: "txt", label: "TXT", description: "ไฟล์ข้อความธรรมดา", Icon: FileText },
  { key: "html", label: "HTML", description: "ไฟล์เว็บเพจ", Icon: Code2 },
] as const;

function PolicyDownloadsDialog({
  policy,
  close,
}: {
  policy: SavedPolicy;
  close: () => void;
}) {
  useEscapeKey(close);
  const languages = [
    { key: "th", label: "Thai", downloads: policy.downloadsByLanguage?.th },
    { key: "en", label: "English", downloads: policy.downloadsByLanguage?.en },
  ] as const;
  const availableLanguages = languages.filter(
    (language) =>
      language.downloads &&
      downloadFormats.some((format) =>
        Boolean(language.downloads?.[format.key]),
      ),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4"
      onMouseDown={close}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              ดาวน์โหลดไฟล์นโยบาย
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {policy.typeName} · {policy.websiteName}
            </p>
          </div>
          <button
            className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
            onClick={close}
            aria-label="ปิดหน้าต่างดาวน์โหลด"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5">
          {availableLanguages.length === 0 ? (
            <div className="border border-dashed border-gray-300 px-5 py-10 text-center">
              <Clock className="mx-auto mb-3 h-5 w-5 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">
                ไฟล์ยังไม่พร้อมให้ดาวน์โหลด
              </p>
              <p className="mt-1 text-xs text-gray-500">
                ไฟล์จะพร้อมให้ดาวน์โหลดหลังฝ่ายกฎหมายอนุมัตินโยบาย
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {availableLanguages.map((language) => (
                <section key={language.key}>
                  <div className="mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {language.label}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {downloadFormats.map(
                      ({ key, label, description, Icon }) => {
                        const url = language.downloads?.[key];
                        return url ? (
                          <a
                            key={key}
                            href={url}
                            download
                            className="flex items-center gap-3 rounded border border-gray-200 px-3 py-3 text-left hover:border-emerald-600 hover:bg-emerald-50/40"
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-gray-100 text-gray-600">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-gray-900">
                                {label}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {description}
                              </span>
                            </span>
                            <Download className="h-4 w-4 shrink-0 text-emerald-700" />
                          </a>
                        ) : null;
                      },
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PoliciesList() {
  const { policies, setPolicies, loading, error, reload } =
    useMerchantPolicies();
  const [consentPolicyIds, setConsentPolicyIds] = useState<Set<string>>(() => new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [downloadPolicy, setDownloadPolicy] = useState<SavedPolicy | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<SavedPolicy | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const search = query.trim().toLowerCase();
  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      !search ||
      [policy.typeName, policy.websiteName, policy.domain, policy.slug].some(
        (value) => value?.toLowerCase().includes(search),
      );
    const matchesStatus =
      statusFilter === "all" || policy.status === statusFilter;
    const matchesLanguage =
      languageFilter === "all" || policy.language === languageFilter;
    return matchesSearch && matchesStatus && matchesLanguage;
  });
  const pageCount = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagePolicies = filteredPolicies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstResult = filteredPolicies.length
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const lastResult = Math.min(currentPage * pageSize, filteredPolicies.length);

  useEffect(() => {
    let active = true;
    void api.consents.listForms().then((response) => {
      if (active && response.success && response.data) {
        setConsentPolicyIds(new Set(response.data.map((form) => form.policyId)));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const publicPolicyUrl = (policy: SavedPolicy) =>
    `${window.location.origin}/p/${encodeURIComponent(policy.slug)}`;

  const handleCopy = (p: SavedPolicy) => {
    const url = publicPolicyUrl(p);
    navigator.clipboard.writeText(url).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopied(p.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (policy: SavedPolicy) => {
    setDeleteError("");
    setPendingDelete(policy);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const response = await api.policies.delete(pendingDelete.id);
    setDeleting(false);
    if (!response.success) {
      setDeleteError(response.error?.message || "ไม่สามารถลบนโยบายได้");
      setPendingDelete(null);
      return;
    }
    setPolicies((current) =>
      current.filter((policy) => policy.id !== pendingDelete.id),
    );
    setPendingDelete(null);
  };

  return (
    <div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="ลบนโยบายนี้หรือไม่?"
        description={
          pendingDelete
            ? `นโยบาย “${pendingDelete.typeName}” ของ ${pendingDelete.websiteName} จะถูกเก็บเป็น archived และหน้าเผยแพร่จะหยุดทำงาน`
            : ""
        }
        confirmLabel="ลบนโยบาย"
        cancelLabel="ยกเลิก"
        tone="destructive"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">
            นโยบายของฉัน
          </h1>
          <p className="text-sm text-gray-400">
            {policies.length} นโยบายในบัญชีของคุณ
          </p>
        </div>
      </div>

      {deleteError && (
        <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {loading ? (
        <div className="skeleton-stack" role="status" aria-label="กำลังโหลดนโยบาย">
          {[0, 1, 2, 3].map((item) => <div key={item} className="skeleton h-20" />)}
        </div>
      ) : error && policies.length === 0 ? (
        <div className="merchant-empty bg-white border border-gray-100">
          <LoadError message={error} onRetry={reload} />
        </div>
      ) : policies.length === 0 ? (
        <div className="merchant-empty bg-white border border-gray-100 p-10 text-center">
          <FileText className="w-5 h-5 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-500 mb-1">
            ยังไม่มีนโยบาย
          </p>
          <p className="text-xs text-gray-400 mb-5">
            สร้างนโยบาย PDPA สำหรับธุรกิจของคุณใน 5 นาที
          </p>
          <Link
            to="/create/policy"
            className="btn-green text-sm px-6 py-2.5"
            style={{ borderRadius: "8px" }}
          >
            สร้างนโยบายแรก
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm"
                placeholder="ค้นหาชื่อนโยบาย เว็บไซต์ หรือโดเมน"
                aria-label="ค้นหานโยบาย"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 border border-gray-300 bg-white px-3 text-sm"
              aria-label="กรองตามสถานะ"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending_review">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ถูกปฏิเสธ</option>
              <option value="edited">แก้ไขแล้ว</option>
            </select>
            <select
              value={languageFilter}
              onChange={(event) => {
                setLanguageFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 border border-gray-300 bg-white px-3 text-sm"
              aria-label="กรองตามภาษา"
            >
              <option value="all">ทุกภาษา</option>
              <option value="th">ไทย</option>
              <option value="en">English</option>
              <option value="both">ไทย + English</option>
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <div className="col-span-3">ชื่อนโยบาย</div>
              <div className="col-span-2">โดเมน</div>
              <div className="col-span-1">ภาษา</div>
              <div className="col-span-2">สถานะ</div>
              <div className="col-span-2">อัปเดตล่าสุด</div>
              <div className="col-span-2 text-right">จัดการ</div>
            </div>

            {/* Rows */}
            {pagePolicies.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <Search className="mx-auto mb-3 h-5 w-5 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">
                  ไม่พบนโยบายที่ตรงกับตัวกรอง
                </p>
                <button
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                    setLanguageFilter("all");
                    setPage(1);
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              pagePolicies.map((p, i) => (
                <div
                  key={p.id}
                  className={`grid grid-cols-2 md:grid-cols-12 gap-3 px-4 py-3.5 items-center ${i < pagePolicies.length - 1 ? "border-b border-gray-50" : ""} hover:bg-gray-50 transition-colors`}
                >
                  {/* Name */}
                  <div className="col-span-2 md:col-span-3 flex items-center gap-3">
                    <FileText
                      className="w-4 h-4 shrink-0"
                      style={{ color: "#087a5b" }}
                    />
                    <div>
                      <Link
                        to={`/dashboard/policies/${p.id}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                        style={{ textDecorationColor: "var(--green)" }}
                      >
                        {p.typeName}
                      </Link>
                      <div className="text-xs text-gray-400 md:hidden">
                        {p.domain}
                      </div>
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="hidden md:flex md:col-span-2 items-center gap-1 text-xs text-gray-500">
                    <Globe className="w-3 h-3 shrink-0" /> {p.domain}
                  </div>

                  {/* Lang */}
                  <div className="hidden md:block md:col-span-1 text-xs text-gray-500">
                    {langDisplay[p.language] || p.language}
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <StatusBadge status={p.status} />
                  </div>

                  {/* Updated */}
                  <div className="hidden md:block md:col-span-2 text-xs text-gray-400">
                    {new Date(p.updatedAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Link
                      title="เปิดหน้านโยบาย"
                      to={`/dashboard/policies/${p.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <FileEdit className="w-4 h-4" />
                    </Link>
                    {(p.status === "approved" || p.status === "edited") && (
                      <>
                        {consentPolicyIds.has(p.id) ? (
                          <button
                            title="คัดลอกลิงก์ Consent"
                            onClick={() => handleCopy(p)}
                            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                            style={{
                              color: copied === p.id ? "var(--green)" : "#9ca3af",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#f3f4f6")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button
                          title="ดาวน์โหลดไฟล์นโยบาย"
                          onClick={() => setDownloadPolicy(p)}
                          className="flex h-7 items-center gap-1.5 rounded border border-gray-200 px-2 text-xs font-medium text-gray-600 hover:border-emerald-600 hover:text-emerald-700"
                        >
                          <Download className="h-4 w-4" /> Files
                        </button>
                        {consentPolicyIds.has(p.id) ? (
                          <a
                            href={publicPolicyUrl(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="เปิดลิงก์ Consent"
                            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                            style={{ color: "#9ca3af" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f3f4f6";
                              e.currentTarget.style.color = "#374151";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "#9ca3af";
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : null}
                      </>
                    )}
                    <button
                      title="ลบ"
                      onClick={() => handleDelete(p)}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                      style={{ color: "#9ca3af" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fef2f2";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#9ca3af";
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {filteredPolicies.length > 0 && (
            <div className="mt-3 flex flex-col gap-3 border-t border-gray-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                แสดง{" "}
                <strong className="text-gray-700">
                  {firstResult}-{lastResult}
                </strong>{" "}
                จาก{" "}
                <strong className="text-gray-700">
                  {filteredPolicies.length}
                </strong>{" "}
                รายการ
              </p>
              <div className="flex items-center gap-1">
                <button
                  className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (value) => (
                    <button
                      key={value}
                      onClick={() => setPage(value)}
                      className={`h-8 min-w-8 rounded border px-2 text-xs font-semibold ${currentPage === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 bg-white text-gray-600"}`}
                      aria-label={`หน้า ${value}`}
                    >
                      {value}
                    </button>
                  ),
                )}
                <button
                  className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 disabled:opacity-40"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="หน้าถัดไป"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {downloadPolicy && (
        <PolicyDownloadsDialog
          policy={downloadPolicy}
          close={() => setDownloadPolicy(null)}
        />
      )}
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="merchant-settings-section bg-white border border-gray-100 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </section>
  );
}

type MerchantActivityType = PolicyActivityType | ConsentActivityType;
type MerchantActivityRow = {
  id: string;
  policyId: string;
  policyName: string;
  policySlug: string;
  type: MerchantActivityType;
  relatedType: string;
  relatedField: string | null;
  description: string;
  createdAt: string;
  consent?: ConsentActivityLog;
  policyEvidence?: PolicyActivityLog;
};

type MerchantActivitySnapshot = {
  savedAt: number;
  logs: MerchantActivityRow[];
  usage: ConsentUsage | null;
};

const MERCHANT_ACTIVITY_CACHE_TTL_MS = 10 * 60 * 1000;
const merchantActivityCacheKey = (email?: string) =>
  `flowpdpa:merchant-activity:v1:${email || "anonymous"}`;

const readMerchantActivitySnapshot = (email?: string): MerchantActivitySnapshot | null => {
  try {
    const raw = window.sessionStorage.getItem(merchantActivityCacheKey(email));
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as MerchantActivitySnapshot;
    if (Date.now() - snapshot.savedAt > MERCHANT_ACTIVITY_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(merchantActivityCacheKey(email));
      return null;
    }
    return snapshot;
  } catch {
    return null;
  }
};

const writeMerchantActivitySnapshot = (
  email: string | undefined,
  logs: MerchantActivityRow[],
  usage: ConsentUsage | null,
) => {
  try {
    window.sessionStorage.setItem(
      merchantActivityCacheKey(email),
      JSON.stringify({ savedAt: Date.now(), logs, usage } satisfies MerchantActivitySnapshot),
    );
  } catch {
    // Cache is best effort and must never block the live response.
  }
};

const merchantActivityLabel: Record<MerchantActivityType, string> = {
  document_acknowledged: "รับทราบเอกสารแล้ว",
  document_acknowledgement_dismissed: "ปิดข้อความโดยไม่รับทราบ",
  merchant_submitted_to_legal: "ส่งเอกสารให้ Legal",
  legal_submitted_to_admin: "Legal ส่งให้ Admin ตรวจซ้ำ",
  admin_changes_requested: "Admin ส่งกลับ Legal",
  admin_approved: "Admin อนุมัติเอกสาร",
  customer_consent: "ลูกค้าให้ความยินยอม",
  merchant_change_requested: "คำขอแก้ไขจากผู้ประกอบการ",
  legal_document_updated: "ฝ่ายกฎหมายแก้ไขเอกสาร",
  consent_granted: "ให้ความยินยอม",
  consent_rejected: "ปฏิเสธความยินยอม",
  consent_withdrawn: "ถอนความยินยอม",
};

const activityDescriptionThai: Record<MerchantActivityType, string> = {
  document_acknowledged: "ลูกค้ากดยืนยันว่าได้อ่านและรับทราบเอกสารสาธารณะแล้ว",
  document_acknowledgement_dismissed: "ลูกค้าปิดข้อความหรือเลือกอ่านต่อโดยไม่กดรับทราบ",
  merchant_submitted_to_legal: "ลูกค้าส่งเอกสารให้ฝ่ายกฎหมายตรวจสอบ",
  legal_submitted_to_admin: "ฝ่ายกฎหมายแก้ไขเอกสารและส่งให้ Admin ตรวจซ้ำ",
  admin_changes_requested: "Admin ส่งเอกสารกลับให้ฝ่ายกฎหมายแก้ไขพร้อมเหตุผล",
  admin_approved: "Admin อนุมัติฉบับสุดท้ายและส่งเอกสารให้ลูกค้าแล้ว",
  customer_consent: "ลูกค้าได้บันทึกการให้ความยินยอมในระบบเดิม",
  merchant_change_requested: "ผู้ประกอบการส่งคำขอให้ฝ่ายกฎหมายแก้ไขเอกสาร",
  legal_document_updated: "ฝ่ายกฎหมายแก้ไขเอกสารตามคำขอเรียบร้อยแล้ว",
  consent_granted:
    "เจ้าของข้อมูลส่งตัวเลือกและให้ความยินยอมอย่างน้อยหนึ่งวัตถุประสงค์",
  consent_rejected: "เจ้าของข้อมูลส่งตัวเลือกโดยไม่ให้ความยินยอม",
  consent_withdrawn: "ความยินยอมถูกถอนและบันทึกไว้ในประวัติแล้ว",
};

const dismissalDescription: Record<string, string> = {
  close_button: "ลูกค้ากดปิดข้อความโดยไม่กดรับทราบเอกสาร",
  continue_without_acknowledgement:
    "ลูกค้าเลือกอ่านต่อโดยไม่กดรับทราบเอกสาร",
};

function getMerchantActivityLabel(type: MerchantActivityType): string {
  return merchantActivityLabel[type] || type || "กิจกรรม";
}

function getMerchantActivityDescription(log: MerchantActivityRow): string {
  if (log.type === "document_acknowledgement_dismissed") {
    const reason = String(
      log.policyEvidence?.metadata?.dismissalReason || "",
    );
    return (
      dismissalDescription[reason] ||
      activityDescriptionThai.document_acknowledgement_dismissed
    );
  }

  return activityDescriptionThai[log.type] || log.description || "-";
}

function PolicyEvidenceDialog({
  log,
  close,
}: {
  log: PolicyActivityLog;
  close: () => void;
}) {
  useEscapeKey(close);
  const metadata = log.metadata || {};
  const items = [
    ["รหัสเหตุการณ์", log.id],
    ["วันที่และเวลา", new Date(log.createdAt).toLocaleString("th-TH")],
    ["รหัสนโยบาย", String(metadata.policyId || log.policyId)],
    ["Slug", String(metadata.policySlug || "-")],
    ["เวอร์ชันนโยบาย", String(metadata.policyVersion || "-")],
    ["เวอร์ชันเทมเพลต", String(metadata.templateVersion || "-")],
    ["ภาษาเอกสาร", String(metadata.contentLanguage || "-")],
    ["Acknowledgement version", String(metadata.acknowledgementVersion || "-")],
    ["IP Address", String(metadata.ipAddress || "-")],
    ["ภาษาของเบราว์เซอร์", String(metadata.acceptLanguage || "-")],
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              หลักฐานการรับทราบเอกสาร
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              บันทึกทางเทคนิค ณ เวลาที่ลูกค้ากดยืนยัน
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="ปิด"
            className="p-1 text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-5 p-6">
          <dl className="grid gap-4 rounded border bg-gray-50 p-4 sm:grid-cols-2">
            {items.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="mt-1 break-all text-sm text-gray-800">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="text-xs text-gray-400">Browser / User Agent</p>
            <p className="mt-1 break-all text-xs text-gray-700">
              {String(metadata.userAgent || "-")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">SHA-256 ของเนื้อหาเอกสาร</p>
            <p className="mt-1 break-all rounded bg-slate-100 p-3 font-mono text-xs text-slate-800">
              {String(metadata.contentSha256 || "ไม่มีสำหรับบันทึกเก่า")}
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold">Snapshot หลักฐานทั้งหมด</h3>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function ConsentEvidenceDialog({
  log,
  close,
}: {
  log: ConsentActivityLog;
  close: () => void;
}) {
  useEscapeKey(close);
  const evidence = log.evidence || {};
  const purposes = log.purposes as ConsentPurpose[];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-evidence-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2
              id="consent-evidence-title"
              className="text-lg font-black text-gray-900"
            >
              หลักฐานความยินยอม
            </h2>
            <p className="mt-1 text-xs text-gray-400">รหัสเหตุการณ์ {log.id}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-5 p-6 text-sm">
          <dl className="grid gap-4 rounded border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-gray-400">ประเภทเหตุการณ์</dt>
              <dd className="mt-1 font-semibold text-emerald-700">
                {getMerchantActivityLabel(log.type)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">วันที่และเวลา</dt>
              <dd className="mt-1 text-gray-800">
                {new Date(log.createdAt).toLocaleString("th-TH")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">ผู้ให้ความยินยอม</dt>
              <dd className="mt-1 text-gray-800">
                {log.subjectName || "-"} · {log.subjectEmail}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">รหัสอ้างอิงผู้ให้ข้อมูล</dt>
              <dd className="mt-1 break-all text-gray-800">
                {log.subjectReference || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">แบบฟอร์ม / เวอร์ชัน</dt>
              <dd className="mt-1 text-gray-800">
                {log.formName} · v{log.formVersion}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">นโยบาย</dt>
              <dd className="mt-1 text-gray-800">{log.policyName}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">รหัส Consent</dt>
              <dd className="mt-1 break-all text-gray-800">{log.recordId}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">สถานะปัจจุบัน</dt>
              <dd className="mt-1 font-semibold text-gray-800">{consentStatusLabel[log.status] ?? log.status}</dd>
            </div>
          </dl>
          <div>
            <h3 className="mb-2 font-bold text-gray-900">
              รายการวัตถุประสงค์ที่ตัดสินใจ
            </h3>
            <div className="divide-y divide-gray-100 rounded border border-gray-100">
              {purposes.map((purpose) => (
                <div
                  key={purpose.id}
                  className="flex items-start justify-between gap-4 p-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">{purpose.label}</p>
                    {purpose.description && (
                      <p className="mt-1 text-xs text-gray-500">
                        {purpose.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${log.choices[purpose.id] ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                  >
                    {log.choices[purpose.id] ? "ยินยอม" : "ไม่ยินยอม"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-gray-400">IP Address</dt>
              <dd className="mt-1 break-all text-gray-800">
                {String(evidence.ipAddress || "-")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Browser / User Agent</dt>
              <dd className="mt-1 break-all text-xs text-gray-600">
                {String(evidence.userAgent || "-")}
              </dd>
            </div>
          </dl>
          <div>
            <h3 className="mb-2 font-bold text-gray-900">
              Snapshot ที่เก็บ ณ เวลาเกิดเหตุการณ์
            </h3>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(log.snapshot, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActivityLogsView() {
  const { user } = useAuth();
  const [initialSnapshot] = useState(() => readMerchantActivitySnapshot(user?.email));
  const [logs, setLogs] = useState<MerchantActivityRow[]>(
    () => initialSnapshot?.logs ?? [],
  );
  const [loading, setLoading] = useState(() => !initialSnapshot);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | MerchantActivityType>("all");
  const [policyId, setPolicyId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEvidence, setSelectedEvidence] =
    useState<ConsentActivityLog | null>(null);
  const [selectedPolicyEvidence, setSelectedPolicyEvidence] =
    useState<PolicyActivityLog | null>(null);
  const [page, setPage] = useState(1);
  const [exportingConsent, setExportingConsent] = useState<"csv" | "pdf" | null>(null);
  const [consentUsage, setConsentUsage] = useState<ConsentUsage | null>(
    () => initialSnapshot?.usage ?? null,
  );
  const pageSize = 10;

  const exportConsentLogs = async (format: "csv" | "pdf") => {
    if (exportingConsent || consentUsage?.plan !== "business") return;
    setExportingConsent(format);
    setError("");
    const response = await api.consents.exportRecords(format);
    setExportingConsent(null);
    if (!response.success || !response.data) {
      setError(response.error?.message || "ไม่สามารถส่งออก Consent Log ได้");
      return;
    }
    const url = URL.createObjectURL(response.data.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = response.data.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.policies.list(),
      api.consents.listActivityLogs(),
      api.consents.listRecords({ page: 1, limit: 1 }),
    ]).then(async ([policiesResponse, consentResponse, recordsResponse]) => {
      if (!policiesResponse.success || !policiesResponse.data) {
        if (active) {
          setError(
            policiesResponse.error?.message || "ไม่สามารถโหลดบันทึกกิจกรรมได้",
          );
          setLoading(false);
        }
        return;
      }
      const responses = await Promise.all(
        policiesResponse.data.map(async (policy) => ({
          policy,
          response: await api.policies.listActivityLogs(policy.id),
        })),
      );
      if (!active) return;
      const policyRows: MerchantActivityRow[] = responses.flatMap(
        ({ policy, response }) =>
          response.success && response.data
            ? response.data.map((log) => ({
                ...log,
                policyName: policy.typeName,
                policySlug: policy.slug,
                policyEvidence: log,
              }))
            : [],
      );
      const consentRows: MerchantActivityRow[] =
        consentResponse.success && consentResponse.data
          ? consentResponse.data.map((log) => ({
              id: log.id,
              policyId: log.policyId,
              policyName: log.policyName,
              policySlug: log.policySlug,
              type: log.type,
              relatedType: "consent",
              relatedField: log.subjectEmail,
              description: log.description,
              createdAt: log.createdAt,
              consent: log,
            }))
          : [];
      const nextUsage = recordsResponse.success && recordsResponse.data
        ? recordsResponse.data.usage
        : initialSnapshot?.usage ?? null;
      const nextLogs = [...policyRows, ...consentRows].toSorted(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setConsentUsage(nextUsage);
      setLogs(nextLogs);
      writeMerchantActivitySnapshot(user?.email, nextLogs, nextUsage);
      setError(
        responses.find((item) => !item.response.success)?.response.error
          ?.message ||
          consentResponse.error?.message ||
          "",
      );
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const policies = useMemo(
    () =>
      Array.from(
        new Map(
          logs.map((log) => [
            log.policyId,
            { id: log.policyId, name: log.policyName },
          ]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name, "th")),
    [logs],
  );
  const visibleLogs = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return logs.filter((log) => {
      if (type !== "all" && log.type !== type) return false;
      if (policyId !== "all" && log.policyId !== policyId) return false;
      const createdDate = log.createdAt.slice(0, 10);
      if (dateFrom && createdDate < dateFrom) return false;
      if (dateTo && createdDate > dateTo) return false;
      if (!normalized) return true;
      return [
        log.id,
        log.policyName,
        log.policySlug,
        log.relatedField,
        log.description,
        merchantActivityLabel[log.type],
        log.consent?.subjectName,
        log.consent?.subjectEmail,
        log.consent?.subjectReference,
        log.consent?.formName,
      ].some((value) => value?.toLocaleLowerCase().includes(normalized));
    });
  }, [logs, query, type, policyId, dateFrom, dateTo]);
  const hasFilters = Boolean(
    query || type !== "all" || policyId !== "all" || dateFrom || dateTo,
  );
  const clearFilters = () => {
    setQuery("");
    setType("all");
    setPolicyId("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };
  const pageCount = Math.max(1, Math.ceil(visibleLogs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageLogs = visibleLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstResult = visibleLogs.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastResult = Math.min(currentPage * pageSize, visibleLogs.length);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-0.5 text-xl font-black text-gray-900">
            บันทึกกิจกรรม
          </h1>
          <p className="text-sm text-gray-400">
            ติดตามการรับทราบ ความยินยอม และขั้นตอนการจัดการเอกสารของนโยบายทั้งหมด
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["csv", "pdf"] as const).map((format) => (
            <button
              key={format}
              type="button"
              disabled={consentUsage?.plan !== "business" || exportingConsent !== null}
              title={consentUsage?.plan === "business" ? undefined : "Export ใช้ได้เฉพาะแพ็กเกจ BUSINESS ที่ยังใช้งานอยู่"}
              onClick={() => void exportConsentLogs(format)}
              className="flex h-9 items-center gap-2 border border-emerald-700 bg-white px-4 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportingConsent === format
                ? "กำลังสร้าง..."
                : consentUsage?.plan === "business"
                  ? `ส่งออกความยินยอม ${format.toUpperCase()}`
                  : `${format.toUpperCase()} · BUSINESS`}
            </button>
          ))}
        </div>
      </div>
      {consentUsage ? (
        <div className={`mb-4 border px-4 py-3 ${consentUsage.reached ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50/60"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 text-xs font-bold">
                <span className={consentUsage.reached ? "text-amber-900" : "text-emerald-900"}>
                  {consentUsage.reached
                    ? `Consent Log ถึงขีดจำกัด ${consentUsage.limit} รายการแล้ว`
                    : `Consent Log ${consentUsage.total}/${consentUsage.limit} รายการ`}
                </span>
                <span>{Math.min(consentUsage.total, consentUsage.limit)}/{consentUsage.limit}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full ${consentUsage.reached ? "bg-amber-500" : "bg-emerald-600"}`}
                  style={{ width: `${Math.min(100, (consentUsage.total / consentUsage.limit) * 100)}%` }}
                />
              </div>
              <p className={`mt-2 text-xs ${consentUsage.reached ? "text-amber-800" : "text-emerald-800"}`}>
                {consentUsage.locked > 0
                  ? `${consentUsage.locked} รายการถูกเก็บไว้แต่ล็อกการดูและ Export`
                  : `เหลืออีก ${Math.max(0, consentUsage.limit - consentUsage.total)} รายการ`}
              </p>
            </div>
            {consentUsage.plan === "free" ? (
              <Link
                to="/dashboard?view=billing"
                className="btn-green shrink-0 px-4 py-2 text-xs font-bold"
              >
                {consentUsage.reached ? "อัปเกรดเพื่อปลดล็อก" : "เพิ่มเป็น 500 รายการ"}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="h-9 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm"
            placeholder="ค้นหาบันทึกหรือนโยบาย"
            aria-label="ค้นหาบันทึกกิจกรรม"
          />
        </div>
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value as "all" | MerchantActivityType);
            setPage(1);
          }}
          className="h-9 border border-gray-300 bg-white px-3 text-sm"
          aria-label="กรองประเภทกิจกรรม"
        >
          <option value="all">กิจกรรมทุกประเภท</option>
          <option value="document_acknowledged">การรับทราบเอกสาร</option>
          <option value="document_acknowledgement_dismissed">ปิดโดยไม่รับทราบ</option>
          <option value="customer_consent">การให้ความยินยอม (เดิม)</option>
          <option value="consent_granted">ให้ความยินยอม</option>
          <option value="consent_rejected">ปฏิเสธความยินยอม</option>
          <option value="consent_withdrawn">ถอนความยินยอม</option>
          <option value="merchant_change_requested">
            คำขอแก้ไขจากผู้ประกอบการ
          </option>
          <option value="legal_document_updated">ฝ่ายกฎหมายแก้ไขเอกสาร</option>
        </select>
        <select
          value={policyId}
          onChange={(event) => {
            setPolicyId(event.target.value);
            setPage(1);
          }}
          className="h-9 border border-gray-300 bg-white px-3 text-sm"
          aria-label="กรองนโยบาย"
        >
          <option value="all">นโยบายทั้งหมด</option>
          {policies.map((policy) => (
            <option key={policy.id} value={policy.id}>{policy.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          จาก
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="h-9 border border-gray-300 bg-white px-3 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          ถึง
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="h-9 border border-gray-300 bg-white px-3 text-sm"
          />
        </label>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-9 items-center gap-1.5 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            ล้างตัวกรอง
          </button>
        ) : null}
        <span className="self-center text-xs text-gray-400">
          แสดง {visibleLogs.length} จาก {logs.length} รายการ
        </span>
      </div>
      {error && (
        <p className="mb-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <section className="overflow-hidden border border-gray-100 bg-white">
        {loading ? (
          <div className="skeleton-stack" role="status" aria-label="กำลังโหลดบันทึกกิจกรรม">
            {[0, 1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-10" />)}
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            ไม่พบบันทึกกิจกรรมที่ตรงกับตัวกรอง
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="merchant-card-table mct-activity w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ประเภท</th>
                    <th className="px-4 py-3 font-semibold">นโยบาย</th>
                    <th className="px-4 py-3 font-semibold">
                      ข้อมูลที่เกี่ยวข้อง
                    </th>
                    <th className="px-4 py-3 font-semibold">รายละเอียด</th>
                    <th className="px-4 py-3 font-semibold">วันที่บันทึก</th>
                    <th className="px-4 py-3 font-semibold">หลักฐาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700">
                        {getMerchantActivityLabel(log.type)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/dashboard/policies/${log.policyId}`}
                          className="font-semibold text-gray-800 hover:underline"
                        >
                          {log.policyName}
                        </Link>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {log.policySlug}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.relatedField === "document"
                          ? "เอกสารสาธารณะ"
                          : log.relatedField ||
                            (log.relatedType === "policy"
                              ? "นโยบาย"
                              : log.relatedType)}
                      </td>
                      <td className="min-w-64 px-4 py-3 text-gray-600">
                        {getMerchantActivityDescription(log)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        {log.consent ? (
                          <button
                            type="button"
                            onClick={() => setSelectedEvidence(log.consent!)}
                            className="whitespace-nowrap rounded border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            รายละเอียด
                          </button>
                        ) : log.policyEvidence ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPolicyEvidence(log.policyEvidence!)
                            }
                            className="whitespace-nowrap rounded border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            รายละเอียด
                          </button>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                แสดง{" "}
                <strong className="text-gray-700">
                  {firstResult}-{lastResult}
                </strong>{" "}
                จาก{" "}
                <strong className="text-gray-700">{visibleLogs.length}</strong>{" "}
                รายการ
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="grid h-8 w-8 place-items-center border border-gray-200 text-gray-600 disabled:opacity-40"
                  aria-label="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setPage(value)}
                      className={`h-8 min-w-8 border px-2 text-xs font-semibold ${currentPage === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 text-gray-600"}`}
                      aria-label={`หน้า ${value}`}
                      aria-current={currentPage === value ? "page" : undefined}
                    >
                      {value}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="grid h-8 w-8 place-items-center border border-gray-200 text-gray-600 disabled:opacity-40"
                  aria-label="หน้าถัดไป"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
      {selectedEvidence && (
        <ConsentEvidenceDialog
          log={selectedEvidence}
          close={() => setSelectedEvidence(null)}
        />
      )}
      {selectedPolicyEvidence && (
        <PolicyEvidenceDialog
          log={selectedPolicyEvidence}
          close={() => setSelectedPolicyEvidence(null)}
        />
      )}
    </div>
  );
}

function MerchantBillingView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [history, setHistory] = useState<MerchantBillingHistory | null>(
    () => peekApiCache<MerchantBillingHistory>(API_ENDPOINTS.billing.history)?.data ?? null,
  );
  const [loading, setLoading] = useState(
    () => !peekApiCache<MerchantBillingHistory>(API_ENDPOINTS.billing.history)?.success,
  );
  const [error, setError] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [purchasingAddon, setPurchasingAddon] = useState<ConsentLogAddon | null>(null);
  const [cancelingAddonId, setCancelingAddonId] = useState<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout === "success" && sessionId) return;

    let active = true;
    void api.billing.history().then((response) => {
      if (!active) return;
      if (response.success && response.data) setHistory(response.data);
      else setError(response.error?.message ?? "ไม่สามารถโหลดข้อมูลการชำระเงินได้");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout === "cancel") {
      setCheckoutMessage("ยกเลิกการชำระเงินแล้ว คุณสามารถอัปเกรดใหม่ได้ทุกเมื่อ");
      setSearchParams({ view: "billing" }, { replace: true });
      return;
    }
    if (checkout !== "success" || !sessionId) return;

    let active = true;
    setLoading(true);
    setUpgrading(true);
    void api.billing.verifyCheckout(sessionId).then(async (verification) => {
      if (!active) return;
      if (!verification.success || !verification.data?.active) {
        setError(verification.error?.message ?? "ยังไม่สามารถยืนยันการชำระเงินได้");
        setLoading(false);
        setUpgrading(false);
        return;
      }
      const refreshed = await api.billing.history();
      if (!active) return;
      if (refreshed.success && refreshed.data) setHistory(refreshed.data);
      else setError(refreshed.error?.message ?? "ชำระเงินแล้ว แต่ยังโหลดสถานะแพ็กเกจไม่สำเร็จ");
      setCheckoutMessage("ชำระเงินสำเร็จและอัปเดตสิทธิ์การใช้งานแล้ว");
      setLoading(false);
      setUpgrading(false);
      setPurchasingAddon(null);
      setSearchParams({ view: "billing" }, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [searchParams, setSearchParams]);

  const subscriptions = history?.subscriptions ?? [];
  const payments = history?.payments ?? [];
  const pageSize = 10;
  const paymentPages = Math.max(1, Math.ceil(payments.length / pageSize));
  const visiblePayments = payments.slice(
    (paymentPage - 1) * pageSize,
    paymentPage * pageSize,
  );
  const current = subscriptions.find((item) =>
    (item.policyType === "account" || !item.policyType) &&
    ["active", "trialing", "past_due", "unpaid"].includes(item.status),
  );
  const activeAddons = subscriptions.filter(
    (item) => item.policyType?.startsWith("consent_logs_") &&
      ["active", "trialing", "past_due", "unpaid"].includes(item.status),
  );
  const overduePayment = payments
    .filter((item) => item.status === "failed")
    .at(-1);
  const overdueDays = overduePayment?.createdAt
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(overduePayment.createdAt).getTime()) /
            86_400_000,
        ) + 1,
      )
    : null;
  const graceDaysLeft = overdueDays
    ? Math.max(0, 15 - overdueDays)
    : null;
  const formatDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value))
      : "—";
  const planLabel = current?.plan
    ? current.plan.charAt(0).toUpperCase() + current.plan.slice(1)
    : "Free";
  const isBusiness = current?.plan?.toLowerCase() === "business";

  const cancelPlan = async () => {
    if (!current || canceling) return;
    setCanceling(true);
    const response = await api.billing.cancelSubscription(current.id);
    setCanceling(false);
    setCancelOpen(false);
    if (!response.success || !response.data) {
      setError(response.error?.message ?? "ไม่สามารถยกเลิกแพ็กเกจได้");
      return;
    }
    setHistory((previous) =>
      previous
        ? {
            ...previous,
            subscriptions: previous.subscriptions.map((item) =>
              item.id === current.id ? response.data! : item,
            ),
          }
        : previous,
    );
  };

  const upgradeToBusiness = async () => {
    if (upgrading) return;
    setError("");
    setCheckoutMessage("");
    setUpgrading(true);
    const response = await api.billing.createCheckout("business", "monthly");
    if (!response.success || !response.data?.checkoutUrl) {
      setError(response.error?.message ?? "ไม่สามารถเริ่มการชำระเงินได้");
      setUpgrading(false);
      return;
    }
    window.location.assign(response.data.checkoutUrl);
  };

  const purchaseAddon = async (logs: ConsentLogAddon) => {
    if (purchasingAddon) return;
    setError("");
    setCheckoutMessage("");
    setPurchasingAddon(logs);
    const response = await api.billing.createAddonCheckout(logs);
    if (!response.success || !response.data?.checkoutUrl) {
      setError(response.error?.message ?? "ไม่สามารถเริ่มการชำระเงิน Add-on ได้");
      setPurchasingAddon(null);
      return;
    }
    window.location.assign(response.data.checkoutUrl);
  };

  const cancelAddon = async (subscriptionId: string) => {
    if (cancelingAddonId) return;
    setCancelingAddonId(subscriptionId);
    const response = await api.billing.cancelSubscription(subscriptionId);
    setCancelingAddonId(null);
    if (!response.success || !response.data) {
      setError(response.error?.message ?? "ไม่สามารถยกเลิก Add-on ได้");
      return;
    }
    setHistory((previous) => previous ? {
      ...previous,
      subscriptions: previous.subscriptions.map((item) =>
        item.id === subscriptionId ? response.data! : item,
      ),
    } : previous);
  };

  return (
    <div>
      <ConfirmDialog
        open={cancelOpen}
        title="ยกเลิกการต่ออายุแพ็กเกจหรือไม่?"
        description={`แพ็กเกจ ${planLabel} ยังใช้งานได้จนถึง ${formatDate(current?.currentPeriodEnd)} และจะไม่ต่ออายุในรอบถัดไป`}
        confirmLabel={canceling ? "กำลังยกเลิก..." : "ยกเลิกเมื่อสิ้นสุดรอบ"}
        cancelLabel="ใช้แพ็กเกจต่อ"
        onConfirm={() => void cancelPlan()}
        onCancel={() => !canceling && setCancelOpen(false)}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">แพ็กเกจและการชำระเงิน</h1>
        <p className="mt-1 text-sm text-gray-500">
          เลือกความจุ Consent Log ที่เหมาะกับงาน และตรวจสอบสถานะแพ็กเกจของบัญชีคุณ
        </p>
      </div>

      {checkoutMessage ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {checkoutMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3" role="status" aria-label="กำลังโหลดสถานะแพ็กเกจ">
          {[0, 1, 2].map((item) => <div key={item} className="skeleton h-72" />)}
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <section className="mb-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">เลือกแพ็กเกจที่เหมาะกับจำนวน Consent Log</h2>
              </div>
              <p className="text-xs text-gray-500">สร้างเอกสาร PDPA ได้ฟรีทุกแพ็กเกจ</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                {!current ? (
                  <span className="absolute right-5 top-5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                    แพ็กเกจปัจจุบัน
                  </span>
                ) : null}
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Free</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-gray-950">฿0</span>
                  <span className="pb-1 text-sm text-gray-500">ตลอดการใช้งาน</span>
                </div>
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">ความจุ Consent Log</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">100 <span className="text-sm font-semibold text-slate-500">รายการ</span></p>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-gray-700">
                  {[
                    "สร้างเอกสาร PDPA ได้",
                    "ดูประวัติการให้ความยินยอมได้",
                    "ถอนความยินยอมได้",
                    "ระบบแจ้งเตือนเมื่อ Consent Log เต็ม",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="relative flex flex-col overflow-hidden rounded-xl border-2 border-emerald-600 bg-white p-6 shadow-[0_12px_30px_rgba(5,150,105,0.10)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-600" />
                <span className="absolute right-5 top-5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  {isBusiness ? "แพ็กเกจปัจจุบัน" : "สำหรับธุรกิจ"}
                </span>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Business</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-gray-950">฿289</span>
                  <span className="pb-1 text-sm text-gray-500">/ เดือน</span>
                </div>
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-700">ความจุ Consent Log</p>
                  <p className="mt-1 text-2xl font-black text-emerald-950">500 <span className="text-sm font-semibold text-emerald-700">รายการ</span></p>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-gray-700">
                  {[
                    "สร้างเอกสาร PDPA ได้",
                    "แก้ไขและจัดการข้อมูลลูกค้าได้",
                    "จัดการการยกเลิกและถอนความยินยอมได้",
                    "เก็บประวัติการเปลี่ยนแปลง",
                    "ซื้อจำนวน Consent Log เพิ่มได้",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {!isBusiness ? (
                  <button
                    type="button"
                    disabled={upgrading || Boolean(current)}
                    onClick={() => void upgradeToBusiness()}
                    className="mt-6 w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {upgrading ? "กำลังเปิดหน้าชำระเงิน..." : current ? "มีแพ็กเกจที่ใช้งานอยู่แล้ว" : "อัปเกรดเป็น BUSINESS"}
                  </button>
                ) : null}
              </article>

              <article className="relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />
                <span className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-200">
                  FULL OPTIONS
                </span>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Tech Hunt</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-white">฿9,252</span>
                  <span className="pb-1 text-sm text-slate-400">/ เดือน</span>
                </div>
                <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3">
                  <p className="text-xs text-slate-400">ความจุ Consent Log</p>
                  <p className="mt-1 text-2xl font-black text-white">ไม่จำกัด <span className="text-sm font-semibold text-emerald-400">Unlimited</span></p>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-slate-200">
                  {[
                    "สร้างเอกสาร PDPA ได้ไม่จำกัด",
                    "Consent Log ไม่จำกัดจำนวน",
                    "แก้ไขและจัดการข้อมูลลูกค้าได้",
                    "จัดการการยกเลิกและถอนความยินยอมได้",
                    "ดูและส่งออกประวัติทั้งหมดได้",
                    "เปิดใช้งานทุกฟีเจอร์",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="mt-1 text-lg font-bold text-gray-900">เพิ่มความจุ Consent Log ได้ทั้ง FREE และ BUSINESS</h2>
                <p className="mt-1 text-xs text-gray-500">โควตา Add-on จะบวกจากแพ็กเกจปัจจุบันตลอดรอบรายเดือน สิทธิ์ Export ยังเป็นของ BUSINESS</p>
              </div>
              <span className="text-xs font-semibold text-gray-500">เรียกเก็บรายเดือน</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {([
                { logs: 500 as const, price: 99 },
                { logs: 2000 as const, price: 209 },
                { logs: 5000 as const, price: 409 },
              ]).map((addon) => {
                const policyType = `consent_logs_${addon.logs}`;
                const subscription = activeAddons.find((item) => item.policyType === policyType);
                return (
                  <article key={addon.logs} className="flex flex-col rounded-lg border border-gray-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">เพิ่ม {addon.logs.toLocaleString()} Log</p>
                    <p className="mt-3 text-3xl font-black text-gray-950">฿{addon.price}<span className="ml-1 text-sm font-medium text-gray-500">/ เดือน</span></p>
                    <p className="mt-2 text-xs text-gray-500">
                      {isBusiness ? "BUSINESS" : "FREE"} รวมเป็นอย่างน้อย {((isBusiness ? 500 : 100) + addon.logs).toLocaleString()} Log
                    </p>
                    {subscription ? (
                      <div className="mt-5 space-y-2">
                        <p className="rounded bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-700">
                          {subscription.cancelAtPeriodEnd ? "ยกเลิกแล้ว · ใช้ได้ถึงสิ้นรอบ" : "Add-on กำลังใช้งาน"}
                        </p>
                        <dl className="grid grid-cols-2 gap-2 rounded border border-gray-100 bg-slate-50 p-3 text-xs">
                          <div>
                            <dt className="text-gray-400">เริ่มรอบ</dt>
                            <dd className="mt-1 font-semibold text-gray-700">{formatDate(subscription.currentPeriodStart)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400">รอบถัดไป</dt>
                            <dd className="mt-1 font-semibold text-gray-700">{formatDate(subscription.currentPeriodEnd)}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-gray-400">การต่ออายุ</dt>
                            <dd className="mt-1 font-semibold text-gray-700">
                              {subscription.cancelAtPeriodEnd ? "สิ้นสุดเมื่อครบรอบ" : "ต่ออายุอัตโนมัติรายเดือน"}
                            </dd>
                          </div>
                        </dl>
                        {!subscription.cancelAtPeriodEnd ? (
                          <button
                            type="button"
                            disabled={cancelingAddonId !== null}
                            onClick={() => void cancelAddon(subscription.id)}
                            className="w-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            {cancelingAddonId === subscription.id ? "กำลังยกเลิก..." : "ยกเลิกเมื่อสิ้นสุดรอบ"}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={purchasingAddon !== null}
                        onClick={() => void purchaseAddon(addon.logs)}
                        className="mt-5 w-full rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {purchasingAddon === addon.logs
                          ? "กำลังเปิดหน้าชำระเงิน..."
                          : "ซื้อ Add-on"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          {current && ["past_due", "unpaid"].includes(current.status) ? (
            <div className="mb-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-bold">
                {graceDaysLeft === 0
                  ? "แพ็กเกจถูกหยุดใช้งานเนื่องจากค้างชำระ"
                  : "แพ็กเกจถูกจำกัดเนื่องจากค้างชำระ"}
              </p>
              <p className="mt-1 text-xs leading-5">
                {graceDaysLeft === 0
                  ? "คุณยังเข้าสู่ระบบและดูประวัติการชำระเงินได้ แต่ฟีเจอร์ในแพ็กเกจและเอกสารสาธารณะถูกหยุดแล้ว"
                  : "ยังสร้างและแก้ไข Policy ได้ฟรี แต่ฟีเจอร์เสริมในแพ็กเกจจะถูกจำกัดชั่วคราว"}
                {graceDaysLeft !== null && graceDaysLeft > 0
                  ? ` · เหลือ ${graceDaysLeft} วันก่อนหยุดสิทธิ์แพ็กเกจอัตโนมัติ`
                  : graceDaysLeft === null
                    ? " · กรุณาชำระภายใน 14 วันเพื่อป้องกันการหยุดสิทธิ์แพ็กเกจ"
                    : ""}
              </p>
            </div>
          ) : null}
          <section className="mb-6 overflow-hidden rounded-xl border border-emerald-200 bg-white">
            <div className="grid gap-6 bg-[linear-gradient(110deg,#073f33,#0b6b52)] p-6 text-white md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="text-xs text-emerald-100">แพ็กเกจปัจจุบัน</p>
                <p className="mt-2 text-3xl font-black tracking-tight">{planLabel}</p>
                <p className="mt-2 text-xs text-emerald-100">
                  {current ? "เรียกเก็บรายเดือน" : "เลือกแพ็กเกจเพื่อเปิดใช้ฟีเจอร์เพิ่มเติม"}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs text-emerald-100">รอบบริการถัดไป</p>
                <p className="mt-1 font-mono text-sm font-semibold">{formatDate(current?.currentPeriodEnd)}</p>
                {current && !current.cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    className="mt-4 rounded-md border border-white/40 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    ยกเลิกการต่ออายุ
                  </button>
                ) : current?.cancelAtPeriodEnd ? (
                  <p className="mt-4 text-xs font-semibold text-amber-200">กำหนดยกเลิกเมื่อสิ้นสุดรอบแล้ว</p>
                ) : null}
              </div>
            </div>
            <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                ["สถานะ", current ? (subscriptionStatusLabel[current.status] ?? current.status) : "ไม่มีรายการ"],
                ["เริ่มรอบปัจจุบัน", formatDate(current?.currentPeriodStart)],
                ["การต่ออายุ", current ? (current.cancelAtPeriodEnd ? "สิ้นสุดเมื่อครบรอบ" : "ต่ออายุอัตโนมัติ") : "ไม่มีการต่ออายุ"],
              ].map(([label, value]) => (
                <div key={label} className="p-4">
                  <p className="text-[11px] text-gray-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <header className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <ReceiptText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900">ประวัติการชำระเงิน</h2>
                <p className="text-xs text-gray-400">แสดงหน้าละ 10 รายการ</p>
              </div>
            </header>
            {payments.length ? (
              <div className="overflow-x-auto">
                <table className="merchant-card-table mct-billing w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] text-gray-500">
                    <tr><th className="px-5 py-3">เลขอ้างอิงใบแจ้งหนี้</th><th className="px-5 py-3">รายการ</th><th className="px-5 py-3">วันที่</th><th className="px-5 py-3">ยอดชำระ</th><th className="px-5 py-3">สถานะ</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visiblePayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-mono text-xs text-gray-600">{payment.invoiceReference}</td>
                        <td className="px-5 py-4 text-gray-600">
                          {payment.policyType?.startsWith("consent_logs_")
                            ? `Add-on +${Number(payment.policyType.replace("consent_logs_", "")).toLocaleString()} Log`
                            : "BUSINESS"}
                        </td>
                        <td className="px-5 py-4 text-gray-600">{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                        <td className="px-5 py-4 font-semibold text-gray-900">{new Intl.NumberFormat("th-TH", { style: "currency", currency: payment.currency.toUpperCase() }).format(payment.amountPaid / 100)}</td>
                        <td className="px-5 py-4"><StatusBadge status={payment.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-gray-400">ยังไม่มีประวัติการชำระเงินที่บันทึกจาก Stripe</div>
            )}
            {payments.length ? (
              <footer className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-400">
                  แสดง {(paymentPage - 1) * pageSize + 1}–{Math.min(paymentPage * pageSize, payments.length)} จาก {payments.length} รายการ
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="หน้าก่อนหน้า"
                    disabled={paymentPage === 1}
                    onClick={() => setPaymentPage((page) => Math.max(1, page - 1))}
                    className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-600 disabled:opacity-30"
                  ><ChevronLeft className="h-4 w-4" /></button>
                  <span className="min-w-14 text-center font-mono text-xs text-gray-500">{paymentPage} / {paymentPages}</span>
                  <button
                    type="button"
                    aria-label="หน้าถัดไป"
                    disabled={paymentPage === paymentPages}
                    onClick={() => setPaymentPage((page) => Math.min(paymentPages, page + 1))}
                    className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-600 disabled:opacity-30"
                  ><ChevronRight className="h-4 w-4" /></button>
                </div>
              </footer>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}

function AccountSettings({ user }: { user: AuthUser }) {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<ContactProfile>({
    ...defaultProfile(),
    name: user.name,
    email: user.email,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchContact(user.email)
      .then((p) => {
        if (active && p) setProfile(p);
      })
      .catch((error) => {
        if (active)
          setProfileError(
            error instanceof Error
              ? error.message
              : "ไม่สามารถโหลดข้อมูลบัญชีได้",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.email]);

  function set<K extends keyof ContactProfile>(
    key: K,
    value: ContactProfile[K],
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setProfileError("");
    try {
      await updateContact(user.email, profile);
      updateUser({
        name: profile.name,
        phone: profile.phone,
        company: profile.company_name,
      });
      setSaved(true);
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถบันทึกข้อมูลบัญชีได้",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwSaved(false);
    if (!pwCurrent) {
      setPwError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }
    if (pwNew.length < 8) {
      setPwError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    setPwError("");
    setPwSaving(true);
    const response = await api.profile.changePassword({
      currentPassword: pwCurrent,
      newPassword: pwNew,
    });
    setPwSaving(false);
    if (!response.success) {
      setPwError(
        response.error?.code === "INVALID_CURRENT_PASSWORD"
          ? "รหัสผ่านปัจจุบันไม่ถูกต้อง"
          : response.error?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้",
      );
      return;
    }
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwSaved(true);
  }

  function handleVerifyEmail() {
    navigate("/register", {
      state: { verificationEmail: user.email, requestOtp: true },
    });
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors bg-white";
  const labelCls =
    "block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5";

  if (loading) {
    return (
      <div className="skeleton-stack" role="status" aria-label="กำลังโหลดข้อมูล">
        <div className="skeleton h-12" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 mb-1">ตั้งค่าบัญชี</h1>
        <p className="text-sm text-gray-400">
          ข้อมูลของคุณจะถูกซิงค์กับระบบ Odoo เมื่อเชื่อมต่อแล้ว
        </p>
      </div>

      {profileError && (
        <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {profileError}
        </p>
      )}

      {!user.emailVerified && (
        <section
          className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border p-5"
          style={{
            backgroundColor: "#f0f8f5",
            borderColor: "#cfe5dc",
            borderRadius: "8px",
          }}
        >
          <div className="flex items-start gap-3">
            <MailCheck
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color: "var(--green)" }}
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-1">
                อีเมลยังไม่ได้รับการยืนยัน
              </h2>
              <p className="text-xs text-gray-600">
                ยืนยัน {user.email} เพื่อเริ่มสร้างและจัดการนโยบาย
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleVerifyEmail}
            className="btn-green px-5 py-2.5 text-sm shrink-0"
          >
            ยืนยันอีเมล
          </button>
        </section>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* ── 1. Personal Info (res.partner: name, function, email, phone, mobile) ── */}
        <SettingsSection title="ข้อมูลส่วนตัว">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                ชื่อ-นามสกุล (Name){" "}
                <span className="text-red-400 normal-case">*</span>
              </label>
              <input
                required
                value={profile.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ชื่อ นามสกุล"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>ตำแหน่งงาน (Job Position)</label>
              <input
                value={profile.function}
                onChange={(e) => set("function", e.target.value)}
                placeholder="เช่น CEO, Developer"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                อีเมล (Email){" "}
                <span className="text-red-400 normal-case">*</span>
              </label>
              <input
                required
                readOnly
                type="email"
                value={profile.email}
                aria-readonly="true"
                className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={labelCls}>โทรศัพท์ (Phone)</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="02-xxx-xxxx"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>มือถือ (Mobile)</label>
              <input
                type="tel"
                value={profile.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                placeholder="08x-xxx-xxxx"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>เว็บไซต์ (Website)</label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://yoursite.com"
                className={inputCls}
              />
            </div>
          </div>
        </SettingsSection>

        {/* ── 2. Company Info (res.partner: company_name, vat) ── */}
        <SettingsSection title="ข้อมูลบริษัท / องค์กร">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ชื่อบริษัท / องค์กร (Company)</label>
              <input
                value={profile.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="บริษัท..."
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                เลขประจำตัวผู้เสียภาษี (Tax ID / VAT)
              </label>
              <input
                value={profile.vat}
                onChange={(e) => set("vat", e.target.value)}
                placeholder="0-0000-00000-00-0"
                className={inputCls}
              />
            </div>
          </div>
        </SettingsSection>

        {/* ── 3. Address (res.partner: street, street2, city, zip, state_id, country_id) ── */}
        <SettingsSection title="ที่อยู่">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>ที่อยู่ (Street)</label>
              <input
                value={profile.street}
                onChange={(e) => set("street", e.target.value)}
                placeholder="บ้านเลขที่ / ถนน / ซอย"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>ที่อยู่เพิ่มเติม (Street 2)</label>
              <input
                value={profile.street2}
                onChange={(e) => set("street2", e.target.value)}
                placeholder="อาคาร / ชั้น / หมู่บ้าน"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>เมือง / อำเภอ / เขต (City)</label>
              <input
                value={profile.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="เมืองขอนแก่น"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>จังหวัด (State)</label>
              <input
                value={profile.state_name}
                onChange={(e) => set("state_name", e.target.value)}
                placeholder="ขอนแก่น"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>รหัสไปรษณีย์ (ZIP)</label>
              <input
                value={profile.zip}
                onChange={(e) => set("zip", e.target.value)}
                placeholder="40000"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>ประเทศ (Country)</label>
              <input
                value={profile.country_name}
                onChange={(e) => set("country_name", e.target.value)}
                placeholder="ประเทศไทย"
                className={inputCls}
              />
            </div>
          </div>
        </SettingsSection>

        {/* ── 4. Preferences (res.partner: lang) ── */}
        <SettingsSection title="การตั้งค่า">
          <div className="max-w-xs">
            <label className={labelCls}>ภาษา (Language)</label>
            <select
              value={profile.lang}
              onChange={(e) => set("lang", e.target.value)}
              className={inputCls}
            >
              <option value="th_TH">ภาษาไทย</option>
              <option value="en_US">English</option>
            </select>
          </div>
        </SettingsSection>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-green text-sm px-8 py-2.5 flex items-center gap-2"
            style={{ borderRadius: "8px", opacity: saving ? 0.7 : 1 }}
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
          {saved && (
            <span
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "var(--green)" }}
            >
              <CheckCircle className="w-4 h-4" /> บันทึกสำเร็จ
            </span>
          )}
        </div>
      </form>

      {/* ── 5. Plan ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              แผนปัจจุบัน
            </h2>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(5,150,105,0.1)",
                  color: "var(--green)",
                }}
              >
                {user.plan}
              </span>
              <span className="text-xs text-gray-400">
                {user.plan?.toLowerCase() === "business"
                  ? "฿289/เดือน · ต่ออายุอัตโนมัติ"
                  : "฿0 · ใช้งานได้ตลอด"}
              </span>
            </div>
          </div>
          <Link
            to="/dashboard?view=billing"
            className="text-sm font-semibold transition-colors"
            style={{ color: "var(--blue)" }}
          >
            จัดการแพ็กเกจ →
          </Link>
        </div>
      </div>

      {/* ── 6. Security ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" /> ความปลอดภัย
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className={labelCls}>รหัสผ่านปัจจุบัน</label>
            <input
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>รหัสผ่านใหม่</label>
              <input
                type="password"
                value={pwNew}
                onChange={(e) => {
                  setPwNew(e.target.value);
                  setPwError("");
                }}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>
            <div>
              <label className={labelCls}>ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => {
                  setPwConfirm(e.target.value);
                  setPwError("");
                }}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>
          </div>
          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          {pwSaved && (
            <p
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "var(--green)" }}
            >
              <CheckCircle className="w-4 h-4" />
              เปลี่ยนรหัสผ่านสำเร็จ
            </p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="text-sm font-bold px-6 py-2.5 border-2 rounded-lg transition-colors disabled:opacity-60"
            style={{
              borderColor: "var(--green)",
              color: "var(--green)",
              borderRadius: "8px",
            }}
          >
            {pwSaving ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const [theme, toggleTheme] = useTheme("flowpdpa-merchant-theme");
  const navigate = useNavigate();
  const { user: sessionUser, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("view");
  const activeView = navItems.some((item) => item.key === requestedView && item.key !== "new")
    ? requestedView!
    : "overview";
  const setActiveView = useCallback(
    (view: string) => {
      if (view === "overview") setSearchParams({}, { replace: true });
      else setSearchParams({ view }, { replace: true });
    },
    [setSearchParams],
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [visitedViews, setVisitedViews] = useState<Set<string>>(
    () => new Set([activeView]),
  );

  useEffect(() => {
    setVisitedViews((current) => {
      if (current.has(activeView)) return current;
      const next = new Set(current);
      next.add(activeView);
      return next;
    });
  }, [activeView]);

  useEffect(() => {
    const prefetch = () => {
      const policiesRequest = api.policies.list();
      void Promise.all([
        policiesRequest,
        api.billing.history(),
        api.consents.listForms(),
        api.consents.listRecords({ page: 1, limit: 10 }),
        api.consents.listActivityLogs(),
        api.templates.list(),
      ]);
      void policiesRequest.then((response) => {
        if (!response.success || !response.data) return;
        void Promise.all(
          response.data.map((policy) => api.policies.listActivityLogs(policy.id)),
        );
      });
    };
    const timer = window.setTimeout(prefetch, 250);
    return () => window.clearTimeout(timer);
  }, []);

  const user: AuthUser = sessionUser ?? {
    name: "User",
    email: "",
    plan: "Free",
    emailVerified: false,
  };

  const handleLogout = () => setConfirmLogout(true);
  const confirmSignOut = () => {
    logout();
    navigate("/login");
  };

  const currentNav = navItems.find((n) => n.key === activeView);
  const initials =
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "FP";

  return (
    <div className="merchant-shell min-h-screen flex" data-theme={theme}>
      <ConfirmDialog
        open={confirmLogout}
        title="ออกจากระบบหรือไม่?"
        description="คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อจัดการนโยบายและบัญชีของคุณ"
        confirmLabel="ออกจากระบบ"
        cancelLabel="ยกเลิก"
        onConfirm={confirmSignOut}
        onCancel={() => setConfirmLogout(false)}
      />

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="merchant-main flex flex-col min-h-screen">
          <header className="merchant-topnav">
            <div className="merchant-topnav-bar">
              <Link
                to="/"
                className="merchant-brand-link"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <span className="merchant-brand-mark2" aria-hidden="true">
                  <img src="/favicon.svg" alt="" />
                </span>
                <span className="merchant-brand-name">
                  Flow<span>PDPA</span>
                </span>
              </Link>
              <nav className="merchant-nav2" aria-label="เมนูหลัก">
                {topNavItems.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    className="merchant-pill"
                    data-active={activeView === key}
                    aria-current={activeView === key ? "page" : undefined}
                    onClick={() => setActiveView(key)}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>
              <div className="merchant-actions">
                <Link to="/create/policy" className="merchant-cta" aria-label="สร้างนโยบาย">
                  <Plus className="w-4 h-4" />
                  <span>สร้างนโยบาย</span>
                </Link>
                <button
                  onClick={() => setActiveView("settings")}
                  className="merchant-account"
                  data-active={activeView === "settings"}
                  title="ตั้งค่าบัญชี"
                >
                  <span className="merchant-avatar2">{initials}</span>
                  <span className="merchant-account-text">
                    <b>{user.name}</b>
                    <i>{user.plan}</i>
                  </span>
                </button>
                <button
                  className="merchant-icon-button"
                  onClick={toggleTheme}
                  aria-pressed={theme === "dark"}
                  aria-label={theme === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
                  title={theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  className="merchant-icon-button merchant-logout"
                  onClick={handleLogout}
                  aria-label="ออกจากระบบ"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  className="merchant-icon-button merchant-menu-toggle"
                  aria-expanded={sidebarOpen}
                  aria-label={sidebarOpen ? "ปิดเมนู" : "เปิดเมนู"}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
            {sidebarOpen && (
              <nav className="merchant-sheet" aria-label="เมนูหลัก">
                {[...topNavItems, { key: "settings", label: "ตั้งค่าบัญชี", Icon: Settings }].map(
                  ({ key, label, Icon }) => (
                    <button
                      key={key}
                      className="merchant-pill"
                      data-active={activeView === key}
                      onClick={() => {
                        setActiveView(key);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ),
                )}
                <button className="merchant-pill" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </nav>
            )}
          </header>

          {/* Page content */}
          <main
            className="merchant-content flex-1 px-4 py-5 lg:px-5 lg:py-6"
            aria-label={currentNav?.label}
          >
            {visitedViews.has("overview") && (
              <section className="motion-view" hidden={activeView !== "overview"}>
                <Overview setView={setActiveView} user={user} />
              </section>
            )}
            {visitedViews.has("policies") && (
              <section className="motion-view" hidden={activeView !== "policies"}><PoliciesList /></section>
            )}
            {visitedViews.has("activity") && (
              <section className="motion-view" hidden={activeView !== "activity"}><ActivityLogsView /></section>
            )}
            {visitedViews.has("consents") && (
              <section className="motion-view" hidden={activeView !== "consents"}><ConsentManagement /></section>
            )}
            {visitedViews.has("templates") && (
              <section className="motion-view" hidden={activeView !== "templates"}><DocumentTemplates /></section>
            )}
            {visitedViews.has("billing") && (
              <section className="motion-view" hidden={activeView !== "billing"}><MerchantBillingView /></section>
            )}
            {visitedViews.has("settings") && (
              <section className="motion-view" hidden={activeView !== "settings"}><AccountSettings user={user} /></section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
