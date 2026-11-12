import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  FileText,
  Inbox,
  Languages,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api } from "@/services/api";
import type {
  LegalDashboard,
  PolicyChangeRequest,
  PolicyReviewStatus,
  SavedPolicy,
} from "@/services/api";
import { normalizePolicyMarkdown } from "@/utils/policyMarkdown";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import "./Portal.css";

const LegalPolicyEditor = lazy(() =>
  import("@/components/legal/LegalPolicyEditor").then((module) => ({
    default: module.LegalPolicyEditor,
  })),
);

type LegalView = "dashboard" | "submissions" | "changes";
type LegalWorkType = "admin_return" | "review";
type PolicyStatus =
  | "pending_review"
  | "pending_admin_review"
  | "changes_requested_by_admin"
  | "approved"
  | "edited"
  | "rejected";
type ChangeStatus =
  | "pending_review"
  | "pending_admin_review"
  | "resolved"
  | "rejected";

interface Submission {
  id: string;
  slug: string;
  websiteName: string;
  domain: string;
  ownerName: string;
  ownerEmail: string;
  language: "th" | "en" | "both";
  status: PolicyStatus;
  approvalDeadline: string;
  createdAt: string;
  contentTh: string;
  contentEn: string;
  reviewComment: string;
}

interface ChangeRequest {
  id: string;
  policySlug: string;
  websiteName: string;
  sectionTitle: string;
  requestedChange: string;
  reason?: string | null;
  merchantComment?: string | null;
  requesterName: string;
  status: ChangeStatus;
  createdAt: string;
  legalComment?: string | null;
}

const submissionFromApi = (policy: SavedPolicy): Submission => ({
  id: policy.id,
  slug: policy.slug,
  websiteName: policy.websiteName,
  domain: policy.domain,
  ownerName: policy.ownerName || policy.websiteName,
  ownerEmail: policy.ownerEmail,
  language: policy.language,
  status: policy.status === "archived" ? "rejected" : policy.status,
  approvalDeadline: policy.approvalDeadline || policy.updatedAt,
  createdAt: policy.createdAt,
  contentTh: normalizePolicyMarkdown(
    policy.contentByLanguage?.th || policy.htmlContentByLanguage.th || "",
  ),
  contentEn: normalizePolicyMarkdown(
    policy.contentByLanguage?.en || policy.htmlContentByLanguage.en || "",
  ),
  reviewComment: policy.reviewComment || "",
});

const changeFromApi = (request: PolicyChangeRequest): ChangeRequest => ({
  id: request.id,
  policySlug: request.policySlug,
  websiteName: request.websiteName || request.policySlug,
  sectionTitle: request.sectionTitle || "-",
  requestedChange: request.requestedChange,
  reason: request.reason,
  merchantComment: request.merchantComment,
  requesterName: request.requesterName || request.requesterEmail,
  status: request.status,
  createdAt: request.createdAt,
  legalComment: request.legalComment,
});


const statusMeta: Record<
  PolicyStatus | ChangeStatus,
  { label: string; color: string; bg: string }
> = {
  pending_review: { label: "รอตรวจสอบ", color: "#a86207", bg: "#fff6e5" },
  pending_admin_review: { label: "รอ Admin ตรวจซ้ำ", color: "#2457a6", bg: "#eaf0fa" },
  changes_requested_by_admin: { label: "Admin ส่งกลับแก้ไข", color: "#b42318", bg: "#fdf0ef" },
  approved: { label: "อนุมัติแล้ว", color: "#087a5b", bg: "#e8f4ef" },
  edited: { label: "แก้ไขแล้ว", color: "#2457a6", bg: "#eaf0fa" },
  rejected: { label: "ไม่อนุมัติ", color: "#b42318", bg: "#fdf0ef" },
  resolved: { label: "ดำเนินการแล้ว", color: "#087a5b", bg: "#e8f4ef" },
};

const workTypeMeta: Record<LegalWorkType, { label: string; className: string }> = {
  admin_return: {
    label: "Admin ส่งกลับให้แก้ไข",
    className: "bg-red-50 text-red-700",
  },
  review: {
    label: "ตรวจสอบเอกสาร",
    className: "bg-amber-50 text-amber-700",
  },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const currentTime = () => Date.now();

function StatusBadge({ status }: { status: PolicyStatus | ChangeStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className="portal-badge"
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

const LEGAL_PAGE_SIZE = 3;

function usePagination<T>(rows: T[], pageSize = LEGAL_PAGE_SIZE) {
  const [requestedPage, setRequestedPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  return { page, pageCount, pageRows, pageSize, setPage: setRequestedPage };
}

function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  setPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  setPage: (page: number) => void;
}) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <footer className="portal-pagination">
      <p className="text-xs text-gray-500">
        แสดง{" "}
        <strong className="text-gray-700">
          {first}-{last}
        </strong>{" "}
        จาก <strong className="text-gray-700">{total}</strong> รายการ
      </p>
      <div className="portal-pagination-pages">
        <button
          className="portal-page-button"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map(
          (value) => (
            <button
              key={value}
              className="portal-page-button"
              data-active={page === value}
              onClick={() => setPage(value)}
              aria-label={`หน้า ${value}`}
            >
              {value}
            </button>
          ),
        )}
        <button
          className="portal-page-button"
          disabled={page === pageCount}
          onClick={() => setPage(page + 1)}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}

function Deadline({ row }: { row: Submission }) {
  if (!(["pending_review", "changes_requested_by_admin"] as string[]).includes(row.status))
    return (
      <span className="text-xs text-gray-400">
        {formatDate(row.approvalDeadline)}
      </span>
    );
  const hours = Math.ceil(
    (new Date(row.approvalDeadline).getTime() - currentTime()) / 3600000,
  );
  const overdue = hours < 0;
  const text = overdue
    ? "เกินกำหนด " + Math.abs(hours) + " ชม."
    : "เหลือ " + hours + " ชม.";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold"
      style={{
        color: overdue ? "#b42318" : hours <= 24 ? "#a86207" : "#475467",
      }}
    >
      {overdue ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : (
        <CalendarClock className="w-3.5 h-3.5" />
      )}
      {text}
    </span>
  );
}

function Sidebar({
  view,
  changeView,
  pendingReviewCount,
  pendingChangeCount,
  open,
  close,
  logout,
}: {
  view: LegalView;
  changeView: (view: LegalView) => void;
  pendingReviewCount: number;
  pendingChangeCount: number;
  open: boolean;
  close: () => void;
  logout: () => void;
}) {
  const items = [
    { id: "dashboard" as const, label: "ภาพรวม", Icon: BarChart3 },
    {
      id: "submissions" as const,
      label: "คิวตรวจสอบนโยบาย",
      Icon: Inbox,
      count: pendingReviewCount,
    },
    {
      id: "changes" as const,
      label: "คำขอแก้ไขจากลูกค้า",
      Icon: MessageSquareText,
      count: pendingChangeCount,
    },
  ];
  return (
    <>
      {open && (
        <button
          className="portal-overlay"
          onClick={close}
          aria-label="ปิดเมนูนำทาง"
        />
      )}
      <aside className="portal-sidebar" data-open={open}>
        <div className="portal-brand">
          <img
            src="/favicon.svg"
            alt="FlowPDPA"
            style={{
              width: "32px",
              height: "32px",
              filter: "brightness(0) invert(1)",
              flexShrink: 0,
            }}
          />
          <div>
            <p className="text-sm font-extrabold" style={{ color: "#ffffff" }}>
              Flow<span style={{ color: "#4ade80" }}>PDPA</span>
            </p>
            <p className="text-[10px]" style={{ color: "#475569" }}>
              พื้นที่ทำงานฝ่ายกฎหมาย
            </p>
          </div>
        </div>
        <nav className="portal-nav">
          <p className="portal-nav-label">พื้นที่ทำงาน</p>
          {items.map(({ id, label, Icon, ...item }) => (
            <button
              key={id}
              className="portal-nav-item"
              data-active={view === id}
              onClick={() => {
                changeView(id);
                close();
              }}
            >
              <Icon />
              <span className="flex-1 text-left">{label}</span>
              {"count" in item && (item.count ?? 0) > 0 ? (
                <span className="min-w-5 rounded-full bg-emerald-400 px-1.5 py-0.5 text-center text-[10px] font-black text-slate-950">
                  {(item.count ?? 0) > 99 ? "99+" : item.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="portal-account">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-8 h-8 grid place-items-center rounded"
              style={{
                backgroundColor: "rgba(8,122,91,0.25)",
                color: "#4ade80",
              }}
            >
              <UserRound className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>
                ผู้ตรวจสอบฝ่ายกฎหมาย
              </p>
              <p className="text-[11px] truncate" style={{ color: "#475569" }}>
                legal@flowpdpa.co.th
              </p>
            </div>
          </div>
          <button className="portal-nav-item" onClick={logout}>
            <LogOut />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}

function SubmissionTable({
  rows,
  select,
  workTypeFor,
}: {
  rows: Submission[];
  select: (row: Submission) => void;
  workTypeFor?: (row: Submission) => LegalWorkType;
}) {
  if (!rows.length)
    return (
      <div className="portal-empty">
        <FileText className="w-7 h-7 mx-auto mb-3" />
        <p className="text-sm">ไม่มีรายการในคิวนี้</p>
      </div>
    );
  return (
    <table className="portal-table">
      <thead>
        <tr>
          <th>เว็บไซต์ / นโยบาย</th>
          {workTypeFor ? <th>ประเภทงาน</th> : null}
          <th>ผู้ประกอบการ</th>
          <th>ภาษา</th>
          <th>กำหนดส่ง</th>
          <th>สถานะ</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.websiteName}</p>
              <p className="text-xs text-gray-400 mt-1">
                {row.domain} · Privacy + Cookies Policy
              </p>
            </td>
            {workTypeFor ? (
              <td>
                {(() => {
                  const meta = workTypeMeta[workTypeFor(row)];
                  return (
                    <span className={`inline-flex rounded px-2 py-1 text-[11px] font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                  );
                })()}
              </td>
            ) : null}
            <td>
              <p>{row.ownerName}</p>
              <p className="text-xs text-gray-400">{row.ownerEmail}</p>
            </td>
            <td>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <Languages className="w-3.5 h-3.5 text-gray-400" />
                {row.language.toUpperCase()}
              </span>
            </td>
            <td>
              <Deadline row={row} />
            </td>
            <td>
              <StatusBadge status={row.status} />
            </td>
            <td>
              <button className="portal-button" onClick={() => select(row)}>
                ตรวจสอบ <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Dashboard({
  submissions,
  changes,
  summary,
  openQueue,
  select,
}: {
  submissions: Submission[];
  changes: ChangeRequest[];
  summary?: LegalDashboard["summary"];
  openQueue: () => void;
  select: (row: Submission) => void;
}) {
  const pending = submissions.filter((row) =>
    ["pending_review", "changes_requested_by_admin"].includes(row.status),
  );
  const stats = [
    {
      label: "นโยบายรอตรวจสอบ",
      value: summary?.pendingPolicies ?? pending.length,
      Icon: CalendarClock,
      color: "#a86207",
    },
    {
      label: "เกินกำหนด",
      value:
        summary?.overduePolicies ??
        pending.filter(
          (row) => new Date(row.approvalDeadline).getTime() < currentTime(),
        ).length,
      Icon: AlertTriangle,
      color: "#b42318",
    },
    {
      label: "อนุมัติเดือนนี้",
      value:
        summary?.approvedThisMonth ??
        submissions.filter((row) => row.status === "approved").length,
      Icon: CheckCircle2,
      color: "#087a5b",
    },
    {
      label: "คำขอแก้ไขจากลูกค้า",
      value:
        summary?.pendingChangeRequests ??
        changes.filter((row) => row.status === "pending_review").length,
      Icon: MessageSquareText,
      color: "#2457a6",
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="การดำเนินงานฝ่ายกฎหมาย"
        title="ภาพรวมการตรวจสอบ"
        description="แยกคิวตรวจสอบนโยบายออกจากคำขอแก้ไขที่ Merchant ส่งภายหลัง"
      />
      <section className="portal-kpis">
        {stats.map(({ label, value, Icon, color }) => (
          <div className="portal-kpi" key={label}>
            <Icon className="w-4 h-4 mb-4" style={{ color }} />
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </section>
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <h2 className="text-sm font-semibold">คิวเร่งด่วน</h2>
            <p className="text-xs text-gray-400 mt-1">
              เรียงตามกำหนดส่งที่ใกล้ที่สุด
            </p>
          </div>
          <button className="portal-button" onClick={openQueue}>
            ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="portal-table-wrap">
          <SubmissionTable rows={pending.slice(0, 4)} select={select} />
        </div>
      </section>
    </>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-[11px] font-medium text-green-700 mb-2">{eyebrow}</p>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </header>
  );
}

function Queue({
  submissions,
  changes,
  select,
}: {
  submissions: Submission[];
  changes: ChangeRequest[];
  select: (row: Submission) => void;
}) {
  const [filter, setFilter] = useState<"all" | LegalWorkType>("all");
  const [query, setQuery] = useState("");
  const merchantChangeSlugs = useMemo(
    () =>
      new Set(
        changes
          .filter((request) => request.status === "pending_review")
          .map((request) => request.policySlug),
      ),
    [changes],
  );
  const workTypeFor = (row: Submission): LegalWorkType => {
    if (row.status === "changes_requested_by_admin") return "admin_return";
    return "review";
  };
  const actionableSubmissions = submissions.filter(
    (row) =>
      ["pending_review", "changes_requested_by_admin"].includes(row.status) &&
      (row.status === "changes_requested_by_admin" ||
        !merchantChangeSlugs.has(row.slug)),
  );
  const rows = actionableSubmissions.filter(
    (row) =>
      (filter === "all" || workTypeFor(row) === filter) &&
      (row.websiteName + row.domain + row.ownerName)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const pagination = usePagination(rows, 100);
  return (
    <>
      <PageTitle
        eyebrow="งานที่มอบหมายให้คุณ"
        title="คิวตรวจสอบนโยบาย"
        description="ตรวจสอบฉบับร่างจาก AI แก้ไขเนื้อหา และบันทึกผลการพิจารณาทางกฎหมาย"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {(["admin_return", "review", "all"] as const).map((item) => (
          <button
            key={item}
            className="portal-filter"
            data-active={filter === item}
            onClick={() => setFilter(item)}
          >
            {item === "all" ? "ทั้งหมด" : workTypeMeta[item].label}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="portal-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาเว็บไซต์หรือผู้ประกอบการ"
          />
        </div>
      </div>
      <section className="portal-panel">
        <div className="portal-table-wrap">
          <SubmissionTable
            rows={pagination.pageRows}
            select={select}
            workTypeFor={workTypeFor}
          />
        </div>
        <Pagination {...pagination} total={rows.length} />
      </section>
    </>
  );
}

function Changes({
  rows,
  editPolicy,
}: {
  rows: ChangeRequest[];
  editPolicy: (slug: string) => Promise<string | null>;
}) {
  const [filter, setFilter] = useState<"all" | ChangeStatus>("pending_review");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visible = rows.filter(
    (row) => filter === "all" || row.status === filter,
  );
  const pagination = usePagination(visible);
  const openEditor = async (row: ChangeRequest) => {
    setOpeningId(row.id);
    setError("");
    const message = await editPolicy(row.policySlug);
    setOpeningId(null);
    if (message) setError(message);
  };
  return (
    <>
      <PageTitle
        eyebrow="คำขอจากผู้ประกอบการ"
        title="คำขอแก้ไขจากลูกค้า"
        description="คำขอที่ผู้ประกอบการยืนยันและส่งให้ฝ่ายกฎหมายดำเนินการ"
      />
      <div className="flex gap-2 mb-4">
        {(["pending_review", "resolved", "rejected", "all"] as const).map(
          (item) => (
            <button
              key={item}
              className="portal-filter"
              data-active={filter === item}
              onClick={() => setFilter(item)}
            >
              {item === "all" ? "ทั้งหมด" : statusMeta[item].label}
            </button>
          ),
        )}
      </div>
      {error && (
        <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <section className="portal-panel">
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>นโยบาย</th>
                <th>หัวข้อ</th>
                <th>คำขอ</th>
                <th>ผู้ขอ</th>
                <th>สถานะ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagination.pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-semibold">{row.websiteName}</p>
                    <p className="text-xs text-gray-400">{row.policySlug}</p>
                  </td>
                  <td>{row.sectionTitle}</td>
                  <td className="max-w-sm">{row.requestedChange}</td>
                  <td>
                    {row.requesterName}
                    <p className="text-xs text-gray-400">
                      {formatDate(row.createdAt)}
                    </p>
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>
                    <button
                      className="portal-button whitespace-nowrap"
                      disabled={openingId === row.id}
                      onClick={() => void openEditor(row)}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      {openingId === row.id
                        ? "กำลังเปิด..."
                        : row.status === "pending_review"
                          ? "ตรวจสอบในนโยบาย"
                          : "ดูนโยบาย"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} total={visible.length} />
      </section>
    </>
  );
}

function Editor({
  initial,
  back,
  save,
  approveChanges,
  changeRequests,
}: {
  initial: Submission;
  back: () => void;
  save: (
    row: Submission,
    decision: PolicyReviewStatus | null,
  ) => Promise<string | null>;
  approveChanges: (
    row: Submission,
    requests: ChangeRequest[],
  ) => Promise<string | null>;
  changeRequests: ChangeRequest[];
}) {
  const [draft, setDraft] = useState(initial);
  const [language, setLanguage] = useState<"th" | "en">(
    initial.language === "en" ? "en" : "th",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pendingChanges = changeRequests.filter(
    (request) => request.status === "pending_review",
  );
  const content = language === "th" ? draft.contentTh : draft.contentEn;
  const setContent = (value: string) =>
    setDraft((current) =>
      language === "th"
        ? { ...current, contentTh: value }
        : { ...current, contentEn: value },
    );
  const submit = async () => {
    setSaving(true);
    setError("");
    const message = pendingChanges.length
      ? await approveChanges(draft, pendingChanges)
      : await save({ ...draft, reviewComment: "" }, "approved");
    setSaving(false);
    if (message) setError(message);
  };
  return (
    <>
      <button className="portal-button mb-5" onClick={back}>
        <ArrowLeft className="w-4 h-4" />
        กลับไปยังคิว
      </button>
      <div className="flex flex-col xl:flex-row gap-5">
        <section className="portal-panel flex-1 min-w-0">
          <div className="portal-panel-head">
            <div>
              <p className="text-xs text-gray-400">{draft.slug}</p>
              <h1 className="text-lg font-semibold mt-1">
                {draft.websiteName}
              </h1>
            </div>
            <StatusBadge
              status={pendingChanges.length ? "pending_review" : draft.status}
            />
          </div>
          <div className="p-5">
            <div className="flex gap-2 mb-4">
              {(["th", "en"] as const)
                .filter(
                  (item) =>
                    draft.language === "both" || draft.language === item,
                )
                .map((item) => (
                  <button
                    key={item}
                    className="portal-filter"
                    data-active={language === item}
                    onClick={() => setLanguage(item)}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {item === "th" ? "Thai" : "English"}
                  </button>
                ))}
            </div>
            <Suspense
              fallback={
                <div className="legal-editor-loading">Loading editor...</div>
              }
            >
              <LegalPolicyEditor
                key={language}
                value={content}
                onChange={setContent}
              />
            </Suspense>
          </div>
        </section>
        <aside className="w-full xl:w-80 space-y-4">
          <section className="portal-panel p-5">
            <h2 className="text-sm font-semibold mb-4">Submission details</h2>
            {[
              ["Merchant", draft.ownerName],
              ["Contact", draft.ownerEmail],
              ["Domain", draft.domain],
              ["Created", formatDate(draft.createdAt)],
            ].map((pair) => (
              <div
                className="py-2.5 border-b border-gray-100 last:border-0"
                key={pair[0]}
              >
                <p className="text-[10px] text-gray-400 uppercase">{pair[0]}</p>
                <p className="text-xs mt-1 break-words">{pair[1]}</p>
              </div>
            ))}
          </section>
          {draft.status === "changes_requested_by_admin" && draft.reviewComment && (
            <section className="portal-panel p-5 border-l-4 border-red-500">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
                ความคิดเห็นจาก Admin
              </p>
              <p className="mt-2 text-xs leading-5 text-gray-700 whitespace-pre-wrap">
                {draft.reviewComment}
              </p>
            </section>
          )}
          {changeRequests.length > 0 && (
            <section className="portal-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">คำขอแก้ไขจากลูกค้า</h2>
                <span className="text-[11px] text-gray-400">
                  {changeRequests.length}
                </span>
              </div>
              <p className="mt-1 mb-4 text-[11px] leading-4 text-gray-500">
                ตรวจสอบรายละเอียดและแก้ไขเอกสารตามคำขอ
              </p>
              <div className="space-y-4">
                {changeRequests.map((request) => (
                  <article
                    key={request.id}
                    className="border-t border-gray-200 pt-4 first:border-0 first:pt-0"
                  >
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">
                        หัวข้อ
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {request.sectionTitle}
                      </p>
                    </div>
                    <div className="mt-3 space-y-3 text-xs leading-5 text-gray-700">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          รายละเอียดที่ต้องการแก้ไข
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {request.requestedChange}
                        </p>
                      </div>
                      {request.reason && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            เหตุผลจาก Merchant
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{request.reason}</p>
                        </div>
                      )}
                      {request.merchantComment && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            หมายเหตุจาก Merchant
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">
                            {request.merchantComment}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-gray-400">
                      {request.requesterName} · {formatDate(request.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section className="portal-panel p-5">
            <h2 className="text-sm font-semibold">อนุมัติเอกสาร</h2>
            {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
            <button
              type="button"
              className="portal-button primary w-full justify-center mt-4"
              disabled={saving}
              onClick={() => void submit()}
            >
              <ShieldCheck className="w-4 h-4" />
              {saving ? "กำลังอนุมัติ..." : "อนุมัติ"}
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}

export default function Legal() {
  const navigate = useNavigate();
  const [view, setView] = useState<LegalView>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [dashboard, setDashboard] = useState<LegalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedReturnView, setSelectedReturnView] =
    useState<LegalView>("submissions");
  const selected = useMemo(
    () => submissions.find((row) => row.id === selectedId) || null,
    [selectedId, submissions],
  );
  useEffect(() => {
    let active = true;
    void api.legal.dashboard().then((response) => {
      if (!active) return;
      if (response.success && response.data) setDashboard(response.data);
      else setLoadError(response.error?.message || "Unable to load dashboard.");
      setLoading(false);
    });
    void api.legal.listSubmissions().then((response) => {
      if (!active) return;
      if (response.success && response.data)
        setSubmissions(response.data.map(submissionFromApi));
      else {
        setSubmissions([]);
        setLoadError((current) => current || response.error?.message || "Unable to load submissions.");
      }
    });
    void api.legal.listChangeRequests().then((response) => {
      if (!active) return;
      if (response.success && response.data)
        setChanges(response.data.map(changeFromApi));
      else {
        setChanges([]);
        setLoadError((current) => current || response.error?.message || "Unable to load change requests.");
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const select = async (row: Submission) => {
    setLoadError("");
    const response = await api.legal.getSubmission(row.slug);
    if (!response.success || !response.data) {
      setLoadError(response.error?.message || "Unable to load submission.");
      return;
    }
    const detail = submissionFromApi(response.data);
    setSubmissions((current) =>
      current.map((item) => (item.id === detail.id ? detail : item)),
    );
    setSelectedReturnView(view);
    setSelectedId(detail.id);
  };
  const selectBySlug = async (slug: string) => {
    setLoadError("");
    const response = await api.legal.getSubmission(slug);
    if (!response.success || !response.data)
      return response.error?.message || "Unable to load the policy document.";
    const detail = submissionFromApi(response.data);
    setSubmissions((current) =>
      current.some((item) => item.id === detail.id)
        ? current.map((item) => (item.id === detail.id ? detail : item))
        : [detail, ...current],
    );
    setSelectedReturnView("changes");
    setSelectedId(detail.id);
    return null;
  };
  const logout = () => setConfirmLogout(true);
  const confirmSignOut = async () => {
    await api.auth.logout();
    navigate("/login", { replace: true });
  };
  const changeView = (next: LegalView) => {
    setView(next);
    setSelectedId(null);
  };
  const save = async (row: Submission, decision: PolicyReviewStatus | null) => {
    const content =
      row.language === "both"
        ? {
            language: "both" as const,
            contentTh: row.contentTh,
            contentEn: row.contentEn,
          }
        : {
            language: row.language,
            text: row.language === "th" ? row.contentTh : row.contentEn,
          };
    const response = await api.legal.updateSubmission(row.slug, {
      content,
      ...(decision
        ? {
            review: {
              status: decision,
              reviewComment: row.reviewComment || null,
            },
          }
        : {}),
    });
    if (!response.success || !response.data)
      return response.error?.message || "ไม่สามารถบันทึกผลการตรวจสอบได้";
    const saved = submissionFromApi(response.data);
    setSubmissions((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    if (decision === "approved") {
      const changesResponse = await api.legal.listChangeRequests();
      if (changesResponse.success && changesResponse.data)
        setChanges(changesResponse.data.map(changeFromApi));
    }
    setSelectedId(null);
    setView(selectedReturnView);
    return null;
  };
  const approveChanges = async (
    row: Submission,
    requests: ChangeRequest[],
  ) => {
    const content =
      row.language === "both"
        ? {
            language: "both" as const,
            contentTh: row.contentTh,
            contentEn: row.contentEn,
          }
        : {
            language: row.language,
            text: row.language === "th" ? row.contentTh : row.contentEn,
          };
    const contentResponse = await api.legal.updateSubmission(row.slug, {
      content,
    });
    if (!contentResponse.success)
      return contentResponse.error?.message || "ไม่สามารถบันทึกเอกสารได้";

    const reviewedRequests: ChangeRequest[] = [];
    for (const request of requests) {
      const response = await api.legal.reviewChangeRequest(request.id, {
        status: "resolved",
        legalComment: "",
      });
      if (!response.success || !response.data)
        return response.error?.message || "ไม่สามารถอนุมัติคำขอแก้ไขได้";
      reviewedRequests.push(changeFromApi(response.data));
    }
    const reviewedById = new Map(
      reviewedRequests.map((request) => [request.id, request]),
    );
    setChanges((current) =>
      current.map((request) => reviewedById.get(request.id) || request),
    );
    setDashboard((current) =>
      current
        ? {
            ...current,
            summary: {
              ...current.summary,
              pendingChangeRequests: Math.max(
                0,
                current.summary.pendingChangeRequests - requests.length,
              ),
            },
          }
        : current,
    );
    setSelectedId(null);
    setView(selectedReturnView);
    return null;
  };
  return (
    <div className="portal-shell">
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out of Legal Portal?"
        description="You will need to sign in again to continue reviewing policies."
        confirmLabel="Sign out"
        onConfirm={confirmSignOut}
        onCancel={() => setConfirmLogout(false)}
      />
      <Sidebar
        view={view}
        changeView={changeView}
        pendingReviewCount={dashboard?.summary.pendingPolicies ?? 0}
        pendingChangeCount={dashboard?.summary.pendingChangeRequests ?? 0}
        open={menuOpen}
        close={() => setMenuOpen(false)}
        logout={logout}
      />
      <div className="portal-main">
        <header className="portal-topbar">
          <div className="flex items-center gap-3">
            <button
              className="portal-button portal-mobile-menu px-2"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-semibold">Legal Review Portal</p>
              <p className="text-[11px] text-gray-400">Assigned workload</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-700" />
            Legal reviewer
          </span>
        </header>
        <main className="portal-content portal-content-legal">
          {loadError && (
            <div className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loadError}
            </div>
          )}
          {loading ? (
            <div className="portal-empty">Loading legal workspace...</div>
          ) : selected ? (
            <Editor
              initial={selected}
              back={() => setSelectedId(null)}
              save={save}
              approveChanges={approveChanges}
              changeRequests={changes.filter(
                (row) => row.policySlug === selected.slug,
              )}
            />
          ) : view === "dashboard" ? (
            <Dashboard
              submissions={submissions}
              changes={changes}
              summary={dashboard?.summary}
              openQueue={() => setView("submissions")}
              select={(row) => {
                void select(row);
              }}
            />
          ) : view === "submissions" ? (
            <Queue
              submissions={submissions}
              changes={changes}
              select={(row) => {
                void select(row);
              }}
            />
          ) : (
            <Changes rows={changes} editPolicy={selectBySlug} />
          )}
        </main>
      </div>
    </div>
  );
}
