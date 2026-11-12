import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
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
  XCircle,
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
  | "rejected"
  | "archived";
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
  typeName: string;
  assignmentNote: string | null;
  approvalDeadline: string | null;
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
  merchantComment?: string | null;
  requesterName: string;
  language: PolicyChangeRequest["language"];
  priority: PolicyChangeRequest["priority"];
  reason: string | null;
  selectedText: string | null;
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
  status: policy.status,
  typeName: policy.typeName || policy.type,
  assignmentNote: policy.assignmentNote || null,
  approvalDeadline: policy.approvalDeadline || null,
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
  sectionTitle: request.sectionTitle || "ไม่ระบุหัวข้อ",
  requestedChange: request.requestedChange,
  language: request.language,
  priority: request.priority,
  reason: request.reason ?? null,
  selectedText: request.selectedText ?? null,
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
  resolved: { label: "ดำเนินการแล้ว", color: "#066a4f", bg: "#e8f4ef" },
  archived: { label: "เก็บถาวร", color: "#475467", bg: "#f2f4f7" },
};

const priorityLabel: Record<PolicyChangeRequest["priority"], string> = {
  low: "ต่ำ",
  normal: "ปกติ",
  high: "สูง",
  urgent: "ด่วนมาก",
};
const isHighPriority = (priority: PolicyChangeRequest["priority"]) =>
  priority === "high" || priority === "urgent";
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

const LEGAL_PAGE_SIZE = 10;

// Soonest deadline first; items with no deadline go last.
const byUrgency = (a: Submission, b: Submission) => {
  const ta = a.approvalDeadline ? new Date(a.approvalDeadline).getTime() : Infinity;
  const tb = b.approvalDeadline ? new Date(b.approvalDeadline).getTime() : Infinity;
  if (ta === tb) return 0;
  return ta < tb ? -1 : 1;
};

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
  if (!row.approvalDeadline) return <span className="text-xs text-gray-400">—</span>;
  if (!(["pending_review", "changes_requested_by_admin"] as string[]).includes(row.status))
    return (
      <span className="text-xs text-gray-500 whitespace-nowrap">
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
      className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
      style={{
        color: overdue ? "#b42318" : hours <= 24 ? "#8a4f05" : "#475467",
      }}
    >
      {overdue ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <CalendarClock className="w-4 h-4" />
      )}
      {text}
    </span>
  );
}

function TopNav({
  view,
  changeView,
  pendingReviewCount,
  pendingChangeCount,
  open,
  setOpen,
  logout,
  reviewer,
}: {
  view: LegalView;
  changeView: (view: LegalView) => void;
  pendingReviewCount: number;
  pendingChangeCount: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  logout: () => void;
  reviewer?: LegalDashboard["reviewer"];
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
  const go = (id: LegalView) => {
    changeView(id);
    setOpen(false);
  };
  return (
    <header className="legal-topnav">
      <div className="legal-topnav-bar">
        <div className="legal-brand">
          <span className="legal-brand-mark" aria-hidden="true">
            <img src="/favicon.svg" alt="" />
          </span>
          <span className="legal-brand-name">
            Flow<span>PDPA</span>
          </span>
          <span className="legal-brand-tag">ฝ่ายกฎหมาย</span>
        </div>
        <nav className="portal-nav">
          <p className="portal-nav-label">พื้นที่ทำงาน</p>
          {items.map(({ id, label, Icon, ...item }) => (
            <button
              key={id}
              className="legal-nav-pill"
              data-active={view === id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => go(id)}
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
        <div className="legal-user">
          <span className="legal-user-chip" title={reviewer?.email}>
            <UserRound className="w-4 h-4" />
            <span>{reviewer?.name || "ผู้ตรวจสอบ"}</span>
          </span>
          <button
            className="legal-icon-button"
            onClick={logout}
            aria-label="ออกจากระบบ"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            className="legal-icon-button legal-menu-toggle"
            aria-expanded={open}
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            onClick={() => setOpen(!open)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
      {open && (
        <nav className="legal-sheet" aria-label="เมนูหลัก">
          {items.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              className="legal-nav-pill"
              data-active={view === id}
              onClick={() => go(id)}
            >
              <Icon className="w-4 h-4" />
              {label}
              {(count ?? 0) > 0 && <span className="legal-nav-count">{count}</span>}
            </button>
          ))}
          <button className="legal-nav-pill" onClick={logout}>
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </nav>
      )}
    </header>
  );
}

function SubmissionTable({
  rows,
  select,
  workTypeFor,
  searching = false,
}: {
  rows: Submission[];
  select: (row: Submission) => void;
  workTypeFor?: (row: Submission) => LegalWorkType;
  searching?: boolean;
}) {
  if (!rows.length)
    return (
      <div className="portal-empty">
        <FileText className="w-6 h-6 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700">
          {searching ? "ไม่พบรายการที่ตรงกับคำค้น" : "ไม่มีรายการในคิวนี้"}
        </p>
        <p className="text-xs mt-1">
          {searching
            ? "ลองค้นหาด้วยชื่อเว็บไซต์ โดเมน หรือชื่อผู้ประกอบการ"
            : "เมื่อมีนโยบายใหม่ที่ได้รับมอบหมาย จะแสดงที่นี่"}
        </p>
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
              <p className="text-xs text-gray-500 mt-1">
                {row.domain} · {row.typeName}
              </p>
              {row.assignmentNote && (
                <p className="text-xs text-gray-700 mt-1">
                  หมายเหตุ: {row.assignmentNote}
                </p>
              )}
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
              <p className="text-xs text-gray-500">{row.ownerEmail}</p>
            </td>
            <td data-label="ภาษา">
              <span className="inline-flex items-center gap-1.5 text-xs">
                <Languages className="w-4 h-4 text-gray-500" />
                {row.language.toUpperCase()}
              </span>
            </td>
            <td data-label="กำหนดส่ง">
              <Deadline row={row} />
            </td>
            <td data-label="สถานะ">
              <StatusBadge status={row.status} />
            </td>
            <td>
              <button className="portal-button" onClick={() => select(row)}>
                ตรวจสอบ <ChevronRight className="w-4 h-4" />
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
  openChanges,
  select,
}: {
  submissions: Submission[];
  changes: ChangeRequest[];
  summary?: LegalDashboard["summary"];
  openQueue: () => void;
  openChanges: () => void;
  select: (row: Submission) => void;
}) {
  const pending = submissions.filter((row) =>
    ["pending_review", "changes_requested_by_admin"].includes(row.status),
  );
  const pendingChanges = changes.filter((row) => row.status === "pending_review");
  const stats = [
    {
      label: "นโยบายรอตรวจสอบ",
      value: summary?.pendingPolicies ?? pending.length,
      Icon: CalendarClock,
      color: "#8a4f05",
    },
    {
      label: "เกินกำหนด",
      value:
        summary?.overduePolicies ??
        pending.filter(
          (row) =>
            !!row.approvalDeadline &&
            new Date(row.approvalDeadline).getTime() < currentTime(),
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
      <section className="legal-hero" aria-label="งานถัดไป">
        {pending[0] ? (
          <>
            <div className="min-w-0">
              <p className="text-sm text-gray-600">ฉบับถัดไปที่ต้องตรวจ</p>
              <h2 className="mt-1 truncate text-2xl font-semibold">
                {pending[0].websiteName}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                <span>{pending[0].typeName}</span>
                <Deadline row={pending[0]} />
                {pending[0].assignmentNote && (
                  <span>หมายเหตุ: {pending[0].assignmentNote}</span>
                )}
              </p>
            </div>
            <button
              className="portal-button primary legal-hero-cta"
              onClick={() => select(pending[0])}
            >
              เริ่มตรวจ <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8" style={{ color: "#066a4f" }} />
            <div>
              <h2 className="text-xl font-semibold">ไม่มีนโยบายรอตรวจ</h2>
              <p className="mt-1 text-sm text-gray-600">
                เมื่อมีงานใหม่ที่ได้รับมอบหมาย จะแสดงที่นี่
              </p>
            </div>
          </div>
        )}
      </section>
      <section className="portal-kpis">
        {stats.map(({ label, value, color }) => (
          <div className="portal-kpi" key={label}>
            <p
              className="text-3xl font-semibold tabular-nums"
              style={{ color: color === "#b42318" && value > 0 ? color : undefined }}
            >
              {value}
            </p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </section>
      <div className="portal-dashboard-grid">
        <section className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <h2 className="text-base font-semibold">คิวเร่งด่วน</h2>
              <p className="text-xs text-gray-500 mt-1">
                เรียงตามกำหนดส่งที่ใกล้ที่สุด
              </p>
            </div>
            <button className="portal-button" onClick={openQueue}>
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="portal-table-wrap">
            <SubmissionTable rows={pending.slice(0, 4)} select={select} />
          </div>
        </section>
        <section className="portal-panel self-start">
          <div className="portal-panel-head">
            <div>
              <h2 className="text-base font-semibold">คำขอแก้ไขที่รอดำเนินการ</h2>
              <p className="text-xs text-gray-500 mt-1">
                จากผู้ประกอบการ รอฝ่ายกฎหมายตอบกลับ
              </p>
            </div>
          </div>
          {pendingChanges.length === 0 ? (
            <div className="portal-empty">
              <MessageSquareText className="w-6 h-6 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">ไม่มีคำขอที่รอดำเนินการ</p>
            </div>
          ) : (
            <ul>
              {pendingChanges.slice(0, 4).map((row) => (
                <li key={row.id} className="portal-list-row">
                  <p className="text-sm font-semibold">{row.websiteName}</p>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {row.requestedChange}
                  </p>
                  {isHighPriority(row.priority) && (
                    <p
                      className="text-xs font-semibold mt-1"
                      style={{ color: "#b42318" }}
                    >
                      ความสำคัญ: {priorityLabel[row.priority]}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1.5">
                    {row.requesterName} · {formatDate(row.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="portal-panel-foot">
            <button className="portal-button" onClick={openChanges}>
              ดูคำขอทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
  </>
  );
}

function PageTitle({
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
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
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
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
      <div className="flex flex-wrap gap-2 mb-4">
        {(["pending_review", "resolved", "rejected", "all"] as const).map(
          (item) => (
            <button
              key={item}
              className="portal-filter"
              data-active={filter === item}
              onClick={() => setFilter(item)}
            >
              {item === "all" ? "ทั้งหมด" : statusMeta[item].label}
              <span className="portal-count">
                {item === "all"
                  ? rows.length
                  : rows.filter((row) => row.status === item).length}
              </span>
            </button>
          ),
        )}
      </div>
      {error && (
        <p role="alert" className="mb-4 rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
                    <p className="text-xs text-gray-500">{row.policySlug}</p>
                  </td>
                  <td data-label="หัวข้อ">{row.sectionTitle}</td>
                  <td className="max-w-sm" data-label="คำขอ">
                    <p>{row.requestedChange}</p>
                    {row.reason && (
                      <p className="text-xs text-gray-600 mt-1">
                        เหตุผล: {row.reason}
                      </p>
                    )}
                    <p
                      className="text-xs font-semibold mt-1"
                      style={{
                        color: isHighPriority(row.priority) ? "#b42318" : "#4b5563",
                      }}
                    >
                      ความสำคัญ: {priorityLabel[row.priority]}
                    </p>
                  </td>
                  <td data-label="ผู้ขอ">
                    {row.requesterName}
                    <p className="text-xs text-gray-500">
                      {formatDate(row.createdAt)}
                    </p>
                  </td>
                  <td data-label="สถานะ">
                    <StatusBadge status={row.status} />
                  </td>
                  <td>
                    <button
                      className="portal-button whitespace-nowrap"
                      disabled={openingId === row.id}
                      onClick={() => void openEditor(row)}
                    >
                      <FileEdit className="w-4 h-4" />
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
  hasNext,
  back,
  save,
  approveChanges,
  changeRequests,
}: {
  initial: Submission;
  hasNext: boolean;
  back: () => void;
  save: (
    row: Submission,
    decision: PolicyReviewStatus | null,
    goNext?: boolean,
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
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState<{ goNext: boolean } | null>(null);
  const [baseline, setBaseline] = useState(initial);
  const dirty =
    draft.contentTh !== baseline.contentTh ||
    draft.contentEn !== baseline.contentEn ||
    draft.reviewComment !== baseline.reviewComment ||
    decision !== null;
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
  const submit = async (goNext = false, confirmed = false) => {
    if (decision === "rejected" && !draft.reviewComment.trim()) {
      setError("กรุณากรอกความเห็นก่อนไม่อนุมัตินโยบาย");
      return;
    }
    if (decision === "approved" && !confirmed) {
      setConfirmApprove({ goNext });
      return;
    }
    setSaving(true);
    setError("");
    const message = pendingChanges.length
      ? await approveChanges(draft, pendingChanges)
      : await save(draft, decision, goNext);
    setSaving(false);
    if (message) setError(message);
    else if (decision === null) setBaseline(draft);
  };
  // Ctrl/Cmd+S saves, like any document editor. The handler is registered once and
  // always calls the latest submit through a ref that is refreshed after each render.
  const submitRef = useRef<() => void>(() => {});
  useEffect(() => {
    submitRef.current = () => {
      if (!saving) void submit();
    };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        submitRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <ConfirmDialog
        open={confirmLeave}
        title="ออกโดยไม่บันทึก?"
        description="การแก้ไขและความเห็นที่ยังไม่ได้บันทึกจะหายไป"
        confirmLabel="ออกโดยไม่บันทึก"
        cancelLabel="กลับไปแก้ไขต่อ"
        tone="destructive"
        onConfirm={back}
        onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmDialog
        open={confirmApprove !== null}
        title="อนุมัตินโยบายนี้?"
        description="นโยบายจะถูกอนุมัติ และคำขอแก้ไขที่รอดำเนินการจะถูกปิดอัตโนมัติ"
        confirmLabel="อนุมัติ"
        cancelLabel="ยังไม่อนุมัติ"
        onConfirm={() => {
          const goNext = confirmApprove?.goNext ?? false;
          setConfirmApprove(null);
          void submit(goNext, true);
        }}
        onCancel={() => setConfirmApprove(null)}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          className="portal-button"
          onClick={() => (dirty ? setConfirmLeave(true) : back())}
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปยังคิว
        </button>
        <div className="xl:hidden">
          <button
            className="portal-button"
            onClick={() =>
              document
                .getElementById("legal-decision")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            ไปที่ผลการพิจารณา
          </button>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-5">
        <section className="portal-panel flex-1 min-w-0">
          <div className="portal-panel-head">
            <div>
              <p className="text-xs text-gray-500">{draft.slug}</p>
              <h1 className="text-lg font-semibold mt-1">
                {draft.websiteName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="text-gray-600">กำหนดส่ง</span>
                  <Deadline row={draft} />
                </span>
                {draft.assignmentNote && (
                  <span className="text-gray-700">
                    หมายเหตุ: {draft.assignmentNote}
                  </span>
                )}
              </div>
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
                    <Languages className="w-4 h-4" />
                    {item === "th" ? "ภาษาไทย" : "English"}
                  </button>
                ))}
            </div>
            <Suspense
              fallback={
                <div className="legal-editor-loading" role="status" aria-label="กำลังโหลดตัวแก้ไข"><div className="skeleton-stack w-full"><div className="skeleton h-12" /><div className="skeleton h-96" /></div></div>
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
        <aside className="w-full xl:w-96 space-y-4 xl:sticky xl:top-24 xl:self-start xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
          <section id="legal-decision" className="portal-panel p-5">
            <h2 className="text-base font-semibold">ผลการพิจารณา</h2>
            <p className="mt-1 mb-3 text-xs leading-5 text-gray-600">
              บันทึกการแก้ไขเป็นฉบับร่าง หรือเลือกผลการพิจารณาของนโยบายทั้งฉบับ
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                {
                  id: "approved" as const,
                  label: "อนุมัติ",
                  Icon: ShieldCheck,
                },
                {
                  id: "rejected" as const,
                  label: "ไม่อนุมัติ",
                  Icon: XCircle,
                },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className="portal-filter justify-center px-1"
                  data-active={decision === id}
                  data-tone={id === "rejected" ? "danger" : undefined}
                  aria-pressed={decision === id}
                  onClick={() =>
                    setDecision((current) => (current === id ? null : id))
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <p
              className="mb-4 text-xs leading-5 text-gray-600"
              aria-live="polite"
            >
              {decision === "approved"
                ? "นโยบายจะถูกอนุมัติ และคำขอแก้ไขที่รอดำเนินการจะถูกปิดอัตโนมัติ"
                : decision === "rejected"
                  ? "ต้องกรอกความเห็นก่อนบันทึก"
                  : "ยังไม่ได้เลือกผลการพิจารณา ระบบจะบันทึกเฉพาะการแก้ไขเป็นฉบับร่าง"}
            </p>
            <label
              htmlFor="legal-review-comment"
              className="text-sm font-semibold text-gray-700"
            >
              ความเห็นของฝ่ายกฎหมาย{" "}
              {decision === "rejected" && (
                <span className="text-red-600">*</span>
              )}
            </label>
            <textarea
              id="legal-review-comment"
              className="w-full min-h-24 mt-2 border border-gray-300 rounded-[var(--radius-control)] p-3 text-sm"
              value={draft.reviewComment}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  reviewComment: event.target.value,
                }))
              }
              placeholder="เหตุผล ข้อสังเกตทางกฎหมาย หรือคำแนะนำถึงผู้ประกอบการ"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              className="portal-button primary w-full mt-4"
              disabled={saving}
              onClick={() => void submit()}
            >
              {saving
                ? "กำลังบันทึก..."
                : decision === "approved"
                  ? "อนุมัตินโยบาย"
                  : decision === "rejected"
                    ? "ไม่อนุมัตินโยบาย"
                    : "บันทึกฉบับร่าง"}
            </button>
            {decision && hasNext && (
              <button
                className="portal-button w-full mt-2"
                disabled={saving}
                onClick={() => void submit(true)}
              >
                {decision === "approved"
                  ? "อนุมัติและไปฉบับถัดไป"
                  : "ไม่อนุมัติและไปฉบับถัดไป"}
              </button>
            )}
            <p className="mt-3 text-xs text-gray-600">
              ลัด: กด Ctrl + S เพื่อบันทึก
            </p>
          </section>
          <section className="portal-panel p-5">
            <h2 className="text-base font-semibold mb-2">รายละเอียดคำขอ</h2>
            {[
              ["ผู้ประกอบการ", draft.ownerName],
              ["อีเมลติดต่อ", draft.ownerEmail],
              ["โดเมน", draft.domain],
              ["วันที่ส่ง", formatDate(draft.createdAt)],
            ].map((pair) => (
              <div
                className="py-2.5 border-b border-gray-100 last:border-0"
                key={pair[0]}
              >
                <p className="text-xs text-gray-500">{pair[0]}</p>
                <p className="text-sm mt-0.5 break-words">{pair[1]}</p>
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
  const [notice, setNotice] = useState("");
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
      else setLoadError(response.error?.message || "ไม่สามารถโหลดภาพรวมได้");
      setLoading(false);
    });
    void api.legal.listSubmissions().then((response) => {
      if (!active) return;
      if (response.success && response.data)
        setSubmissions(response.data.map(submissionFromApi));
      else {
        setSubmissions([]);
        setLoadError((current) => current || response.error?.message || "ไม่สามารถโหลดคิวตรวจสอบได้");
      }
    });
    void api.legal.listChangeRequests().then((response) => {
      if (!active) return;
      if (response.success && response.data)
        setChanges(response.data.map(changeFromApi));
      else {
        setChanges([]);
        setLoadError((current) => current || response.error?.message || "ไม่สามารถโหลดคำขอแก้ไขได้");
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const select = async (row: Submission) => {
    setLoadError("");
    const response = await api.legal.getSubmission(row.slug);
    if (!response.success || !response.data) {
      setLoadError(response.error?.message || "ไม่สามารถโหลดนโยบายนี้ได้");
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
      return response.error?.message || "ไม่สามารถโหลดเอกสารนโยบายได้";
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
  const save = async (
    row: Submission,
    decision: PolicyReviewStatus | null,
    goNext = false,
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
    const nextRow = goNext
      ? submissions
          .filter((r) => r.status === "pending_review" && r.id !== saved.id)
          .sort(byUrgency)[0]
      : undefined;
    // Saving a draft keeps the reviewer in the editor; a decision returns to the queue
    // (or opens the next pending policy).
    if (!nextRow && decision !== null) {
      setSelectedId(null);
      setView(selectedReturnView);
    }
    setNotice(
      decision === "approved"
        ? "อนุมัตินโยบายแล้ว"
        : decision === "rejected"
          ? "บันทึกผลไม่อนุมัติแล้ว"
          : "บันทึกฉบับร่างแล้ว",
    );
    if (nextRow) await select(nextRow);
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
    <div className="portal-shell portal-shell-legal">
      <ConfirmDialog
        open={confirmLogout}
        title="ออกจากระบบฝ่ายกฎหมาย?"
        description="คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อตรวจสอบนโยบายต่อ"
        confirmLabel="ออกจากระบบ"
        onConfirm={confirmSignOut}
        onCancel={() => setConfirmLogout(false)}
      />
      <TopNav
        view={view}
        changeView={changeView}
        pendingReviewCount={dashboard?.summary.pendingPolicies ?? 0}
        pendingChangeCount={dashboard?.summary.pendingChangeRequests ?? 0}
        open={menuOpen}
        setOpen={setMenuOpen}
        logout={logout}
        reviewer={dashboard?.reviewer}
      />
      <div className="portal-main">
        <main className="portal-content portal-content-legal">
          {notice && (
            <div
              role="status"
              className="mb-4 flex items-center gap-2 rounded-[var(--radius-control)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4" />
              {notice}
            </div>
          )}
          {loadError && (
            <div
              role="alert"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <span>
                {/[ก-๙]/.test(loadError)
                  ? loadError
                  : "เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้งในอีกสักครู่"}
              </span>
              <button
                className="portal-button"
                onClick={() => window.location.reload()}
              >
                ลองอีกครั้ง
              </button>
            </div>
          )}
          <div key={loading ? "loading" : selected ? `edit-${selected.id}` : view} className="motion-view">
          {loading ? (
            <div className="skeleton-stack" role="status" aria-label="กำลังโหลดข้อมูล">
              <div className="skeleton h-28" />
              <div className="skeleton h-14" />
              <div className="skeleton h-14" />
              <div className="skeleton h-14" />
            </div>
          ) : selected ? (
            <Editor
              key={selected.id}
              initial={selected}
              hasNext={submissions.some(
                (r) => r.status === "pending_review" && r.id !== selected.id,
              )}
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
              openChanges={() => setView("changes")}
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
          </div>
        </main>
      </div>
    </div>
  );
}
