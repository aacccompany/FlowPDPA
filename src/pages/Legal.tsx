import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
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
  XCircle,
} from "lucide-react";
import { session } from "@/utils/storage";
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
type PolicyStatus =
  | "pending_review"
  | "approved"
  | "edited"
  | "rejected"
  | "archived";
type ChangeStatus = "pending_review" | "resolved" | "rejected";

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
  requesterName: request.requesterName || request.requesterEmail,
  status: request.status,
  createdAt: request.createdAt,
  legalComment: request.legalComment,
});


const statusMeta: Record<
  PolicyStatus | ChangeStatus,
  { label: string; color: string; bg: string }
> = {
  pending_review: { label: "รอตรวจสอบ", color: "#8a4f05", bg: "#fff6e5" },
  approved: { label: "อนุมัติแล้ว", color: "#066a4f", bg: "#e8f4ef" },
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
  if (!row.approvalDeadline)
    return (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        ไม่ได้กำหนด
      </span>
    );
  if (row.status !== "pending_review")
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

function Sidebar({
  view,
  changeView,
  open,
  close,
  logout,
  reviewer,
}: {
  view: LegalView;
  changeView: (view: LegalView) => void;
  open: boolean;
  close: () => void;
  logout: () => void;
  reviewer?: LegalDashboard["reviewer"];
}) {
  const items = [
    { id: "dashboard" as const, label: "ภาพรวม", Icon: BarChart3 },
    { id: "submissions" as const, label: "คิวตรวจสอบ", Icon: Inbox },
    { id: "changes" as const, label: "คำขอแก้ไข", Icon: MessageSquareText },
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
          </div>
        </div>
        <nav className="portal-nav">
          {items.map(({ id, label, Icon }) => (
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
              {label}
            </button>
          ))}
        </nav>
        <div className="portal-account">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-8 h-8 grid place-items-center rounded-[var(--radius-control)]"
              style={{
                backgroundColor: "rgba(8,122,91,0.25)",
                color: "#4ade80",
              }}
            >
              <UserRound className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "#e2e8f0" }}
              >
                {reviewer?.name || "ผู้ตรวจสอบฝ่ายกฎหมาย"}
              </p>
              {reviewer?.email && (
                <p className="text-xs truncate" style={{ color: "#94a3b8" }}>
                  {reviewer.email}
                </p>
              )}
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
  searching = false,
}: {
  rows: Submission[];
  select: (row: Submission) => void;
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
            <td data-label="ผู้ประกอบการ">
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
  const pending = submissions
    .filter((row) => row.status === "pending_review")
    .sort(byUrgency);
  const pendingChanges = changes.filter((row) => row.status === "pending_review");
  const stats = [
    {
      label: "รายการรอตรวจสอบ",
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
      label: "คำขอแก้ไข",
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
        description="นโยบายที่ได้รับมอบหมายและคำขอแก้ไขจากลูกค้า"
      />
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
  select,
}: {
  submissions: Submission[];
  select: (row: Submission) => void;
}) {
  const [filter, setFilter] = useState<"all" | PolicyStatus>("pending_review");
  const [query, setQuery] = useState("");
  const rows = submissions
    .filter(
      (row) =>
        (filter === "all" || row.status === filter) &&
        (row.websiteName + row.domain + row.ownerName)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(byUrgency);
  const countOf = (item: "all" | PolicyStatus) =>
    item === "all"
      ? submissions.length
      : submissions.filter((row) => row.status === item).length;
  const pagination = usePagination(rows);
  return (
    <>
      <PageTitle
        eyebrow="งานที่มอบหมายให้คุณ"
        title="คิวตรวจสอบนโยบาย"
        description="ตรวจสอบฉบับร่างจาก AI แก้ไขเนื้อหา และบันทึกผลการพิจารณาทางกฎหมาย"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          ["pending_review", "approved", "edited", "rejected", "all"] as const
        ).map((item) => (
          <button
            key={item}
            className="portal-filter"
            data-active={filter === item}
            onClick={() => setFilter(item)}
          >
            {item === "all" ? "ทั้งหมด" : statusMeta[item].label}
            <span className="portal-count">{countOf(item)}</span>
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
            searching={query.trim() !== ""}
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
        title="คำขอแก้ไข"
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
  changeRequests,
  updateChange,
}: {
  initial: Submission;
  hasNext: boolean;
  back: () => void;
  save: (
    row: Submission,
    decision: PolicyReviewStatus | null,
    goNext?: boolean,
  ) => Promise<string | null>;
  changeRequests: ChangeRequest[];
  updateChange: (
    id: string,
    status: "resolved" | "rejected",
    comment: string,
  ) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState(initial);
  const [language, setLanguage] = useState<"th" | "en">(
    initial.language === "en" ? "en" : "th",
  );
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [requestComments, setRequestComments] = useState<
    Record<string, string>
  >({});
  const [requestSavingId, setRequestSavingId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState<{
    goNext: boolean;
  } | null>(null);
  const [jumpNote, setJumpNote] = useState("");
  const [requestError, setRequestError] = useState("");
  const [baseline, setBaseline] = useState(initial);
  const dirty =
    draft.contentTh !== baseline.contentTh ||
    draft.contentEn !== baseline.contentEn ||
    draft.reviewComment !== baseline.reviewComment ||
    decision !== null;
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
    const message = await save(draft, decision, goNext);
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
  // Select the text a merchant asked to change, so the reviewer lands on it.
  const jumpToText = (request: ChangeRequest) => {
    const wanted = request.language === "en" ? "en" : request.language === "th" ? "th" : language;
    const run = () => {
      const snippet = (request.selectedText ?? "").replace(/\s+/g, " ").trim().slice(0, 24);
      const root = document.querySelector(".legal-editor-document");
      if (!snippet || !root) return setJumpNote("ไม่พบข้อความนี้ในเอกสาร");
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = (node.textContent ?? "").replace(/\s+/g, " ");
        const index = text.indexOf(snippet);
        if (index === -1) continue;
        const range = document.createRange();
        range.setStart(node, Math.min(index, node.textContent?.length ?? 0));
        range.setEnd(node, Math.min(index + snippet.length, node.textContent?.length ?? 0));
        const highlights = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
        const HighlightCtor = (window as unknown as { Highlight?: new (r: Range) => unknown }).Highlight;
        if (highlights && HighlightCtor) {
          highlights.set("legal-jump", new HighlightCtor(range));
          window.setTimeout(() => highlights.delete("legal-jump"), 8000);
        } else {
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        node.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
        return setJumpNote("");
      }
      setJumpNote("ไม่พบข้อความนี้ในเอกสารปัจจุบัน (อาจถูกแก้ไขไปแล้ว)");
    };
    const available = draft.language === "both" || draft.language === wanted;
    if (available && wanted !== language) {
      setLanguage(wanted);
      window.setTimeout(run, 700);
    } else run();
  };
  const declineChangeRequest = async (id: string) => {
    const comment = requestComments[id]?.trim() || "";
    if (!comment) {
      setRequestError(
        "กรุณากรอกเหตุผลก่อนไม่ดำเนินการตามคำขอ",
      );
      return;
    }
    setRequestSavingId(id);
    setRequestError("");
    const message = await updateChange(id, "rejected", comment);
    setRequestSavingId(null);
    if (message) setRequestError(message);
  };
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
            <StatusBadge status={draft.status} />
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
                <div className="legal-editor-loading">กำลังโหลดตัวแก้ไข...</div>
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
        <aside className="w-full xl:w-96 space-y-4 xl:sticky xl:top-20 xl:self-start xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
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
          {changeRequests.length > 0 && (
            <section className="portal-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">
                  คำขอแก้ไขจากผู้ประกอบการ
                </h2>
                <span className="text-xs text-gray-500">
                  {changeRequests.length}
                </span>
              </div>
              <p className="mt-1 mb-4 text-xs leading-5 text-gray-600">
                คำขอที่รอดำเนินการจะถูกปิดอัตโนมัติเมื่อคุณอนุมัตินโยบาย
              </p>
              {requestError && (
                <p role="alert" className="mb-3 rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {requestError}
                </p>
              )}
              {jumpNote && (
                <p role="status" className="mb-3 text-xs text-gray-700">
                  {jumpNote}
                </p>
              )}
              <div className="space-y-4">
                {changeRequests.map((request) => (
                  <article
                    key={request.id}
                    className="border-t border-gray-200 pt-4 first:border-0 first:pt-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500">หัวข้อ</p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {request.sectionTitle}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                      {request.requestedChange}
                    </p>
                    {request.selectedText && (
                      <>
                        <blockquote className="mt-2 border-l border-gray-300 pl-3 text-xs leading-5 text-gray-600 line-clamp-3">
                          {request.selectedText}
                        </blockquote>
                        <button
                          className="portal-button mt-2"
                          onClick={() => jumpToText(request)}
                        >
                          <Search className="w-4 h-4" />
                          ไปที่ข้อความนี้ในเอกสาร
                        </button>
                      </>
                    )}
                    {request.reason && (
                      <p className="mt-2 text-xs text-gray-600">
                        เหตุผล: {request.reason}
                      </p>
                    )}
                    <p
                      className="mt-2 text-xs font-semibold"
                      style={{
                        color: isHighPriority(request.priority) ? "#b42318" : "#4b5563",
                      }}
                    >
                      ความสำคัญ: {priorityLabel[request.priority]}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {request.requesterName} · {formatDate(request.createdAt)}
                    </p>
                    {request.status === "pending_review" ? (
                      <div className="mt-3">
                        <textarea
                          className="w-full min-h-20 border border-gray-300 rounded-[var(--radius-control)] p-2.5 text-sm"
                          value={requestComments[request.id] || ""}
                          onChange={(event) =>
                            setRequestComments((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          placeholder="ระบุเหตุผลที่ไม่ดำเนินการตามคำขอนี้ (จำเป็น)"
                        />
                        <button
                          className="portal-button danger justify-center w-full mt-2"
                          disabled={requestSavingId === request.id}
                          onClick={() => void declineChangeRequest(request.id)}
                        >
                          ไม่ดำเนินการตามคำขอ
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 border-l-2 border-gray-200 pl-3 text-xs text-gray-500">
                        {request.legalComment || "ไม่มีความเห็นจากฝ่ายกฎหมาย"}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
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
  const confirmSignOut = () => {
    session.logout();
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
      return response.error?.message || "ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง";
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
  const updateChange = async (
    id: string,
    status: "resolved" | "rejected",
    legalComment: string,
  ) => {
    const response = await api.legal.reviewChangeRequest(id, {
      status,
      legalComment,
    });
    if (!response.success || !response.data)
      return response.error?.message || "ไม่สามารถบันทึกผลคำขอแก้ไขได้";
    const saved = changeFromApi(response.data);
    setChanges((current) =>
      current.map((row) => (row.id === saved.id ? saved : row)),
    );
    setNotice("บันทึกผลคำขอแก้ไขแล้ว");
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
      <Sidebar
        view={view}
        changeView={changeView}
        open={menuOpen}
        close={() => setMenuOpen(false)}
        logout={logout}
        reviewer={dashboard?.reviewer}
      />
      <div className="portal-main">
        <header className="portal-topbar">
          <div className="flex items-center gap-3">
            <button
              className="portal-button portal-mobile-menu px-2"
              onClick={() => setMenuOpen(true)}
              aria-label="เปิดเมนูนำทาง"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-semibold">พื้นที่ตรวจสอบทางกฎหมาย</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-700" />
            ผู้ตรวจสอบ
          </span>
        </header>
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
          {loading ? (
            <div className="portal-empty">กำลังโหลดข้อมูล...</div>
          ) : selected ? (
            <Editor
              key={selected.id}
              initial={selected}
              hasNext={submissions.some(
                (r) => r.status === "pending_review" && r.id !== selected.id,
              )}
              back={() => setSelectedId(null)}
              save={save}
              changeRequests={changes.filter(
                (row) => row.policySlug === selected.slug,
              )}
              updateChange={updateChange}
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
