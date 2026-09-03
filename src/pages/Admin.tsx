import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCopy,
  CreditCard,
  FileText,
  Gauge,
  Landmark,
  LogOut,
  Eye,
  ExternalLink,
  Loader2,
  Languages,
  Menu,
  Pencil,
  Plus,
  ReceiptText,
  Scale,
  Search,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { session } from "@/utils/storage";
import { api } from "@/services/api";
import type {
  AdminAnalytics,
  AdminAuditLog,
  AdminErrorLog,
  AdminLegalReview,
  AdminLegalStatus,
  AdminLegalUser,
  AdminLegalWorkload,
  AdminMerchant,
  AdminMerchantStatus,
  AdminOverview,
  AdminPayment,
  AdminPaymentDetail,
  AdminPolicy,
  AdminPolicyDetail,
  AdminPolicyStatus,
  AdminSubscription,
  DocumentTemplate,
  DocumentTemplateInput,
} from "@/services/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { marked } from "marked";
import { normalizePolicyMarkdown } from "@/utils/policyMarkdown";
import "./Portal.css";

type AdminView =
  | "overview"
  | "merchants"
  | "subscriptions"
  | "payments"
  | "policies"
  | "templates"
  | "assignments"
  | "legal"
  | "logs"
  | "audit"
  | "analytics";
type Merchant = AdminMerchant;
type Policy = AdminPolicy;
type LegalUser = AdminLegalUser;
type Subscription = AdminSubscription;
type Payment = AdminPayment;
type ErrorLog = AdminErrorLog;
type MerchantStatus = AdminMerchantStatus;
type PolicyStatus = AdminPolicyStatus;
type LegalStatus = AdminLegalStatus;

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
const money = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(amount / 100);

const badgeMeta: Record<string, { color: string; bg: string }> = {
  active: { color: "#087a5b", bg: "#e8f4ef" },
  paid: { color: "#087a5b", bg: "#e8f4ef" },
  approved: { color: "#087a5b", bg: "#e8f4ef" },
  pending: { color: "#a86207", bg: "#fff6e5" },
  pending_review: { color: "#a86207", bg: "#fff6e5" },
  past_due: { color: "#a86207", bg: "#fff6e5" },
  suspended: { color: "#b42318", bg: "#fdf0ef" },
  failed: { color: "#b42318", bg: "#fdf0ef" },
  rejected: { color: "#b42318", bg: "#fdf0ef" },
  critical: { color: "#b42318", bg: "#fdf0ef" },
  inactive: { color: "#667085", bg: "#f2f4f7" },
  archived: { color: "#667085", bg: "#f2f4f7" },
  free: { color: "#667085", bg: "#f2f4f7" },
  edited: { color: "#2457a6", bg: "#eaf0fa" },
  warning: { color: "#a86207", bg: "#fff6e5" },
  error: { color: "#c2410c", bg: "#fff0e8" },
};

function Badge({ value }: { value: string }) {
  const meta = badgeMeta[value] || { color: "#475467", bg: "#f2f4f7" };
  const labels: Record<string, string> = {
    active: "ใช้งานอยู่",
    paid: "ชำระแล้ว",
    approved: "อนุมัติแล้ว",
    pending: "รอดำเนินการ",
    pending_review: "รอตรวจสอบ",
    past_due: "เกินกำหนด",
    suspended: "ระงับการใช้งาน",
    failed: "ไม่สำเร็จ",
    rejected: "ไม่อนุมัติ",
    critical: "วิกฤต",
    inactive: "ไม่ใช้งาน",
    archived: "เก็บถาวร",
    free: "ฟรี",
    edited: "แก้ไขแล้ว",
    warning: "คำเตือน",
    error: "ข้อผิดพลาด",
    create: "สร้าง",
    update: "แก้ไข",
    delete: "ลบ",
    read: "อ่าน",
  };
  return (
    <span
      className="portal-badge"
      style={{ color: meta.color, background: meta.bg }}
    >
      {labels[value] || value.replaceAll("_", " ")}
    </span>
  );
}

const ADMIN_PAGE_SIZE = 10;

function usePagination<T>(rows: T[], pageSize = ADMIN_PAGE_SIZE) {
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

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium text-green-700 mb-2">{eyebrow}</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {action}
    </header>
  );
}

function Sidebar({
  view,
  change,
  open,
  close,
  logout,
}: {
  view: AdminView;
  change: (view: AdminView) => void;
  open: boolean;
  close: () => void;
  logout: () => void;
}) {
  const groups = [
    {
      label: "แพลตฟอร์ม",
      items: [
        { id: "overview" as const, text: "ภาพรวม", Icon: Gauge },
        { id: "merchants" as const, text: "ผู้ประกอบการ", Icon: Users },
      ],
    },
    {
      label: "เนื้อหาและการกำกับดูแล",
      items: [
        { id: "policies" as const, text: "นโยบาย", Icon: FileText },
        {
          id: "templates" as const,
          text: "เทมเพลตเอกสาร",
          Icon: Languages,
        },
        {
          id: "assignments" as const,
          text: "มอบหมายการตรวจสอบ",
          Icon: FileText,
        },
        { id: "legal" as const, text: "จัดการฝ่ายกฎหมาย", Icon: Scale },
      ],
    },
    {
      label: "การเรียกเก็บเงิน",
      items: [
        {
          id: "subscriptions" as const,
          text: "การสมัครสมาชิก",
          Icon: WalletCards,
        },
        { id: "payments" as const, text: "การชำระเงิน", Icon: ReceiptText },
      ],
    },
    {
      label: "การติดตามระบบ",
      items: [
        { id: "audit" as const, text: "บันทึกกิจกรรม", Icon: Activity },
        { id: "logs" as const, text: "บันทึกระบบ", Icon: AlertTriangle },
        { id: "analytics" as const, text: "การวิเคราะห์", Icon: BarChart3 },
      ],
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
              ระบบผู้ดูแล
            </p>
          </div>
        </div>
        <nav className="portal-nav flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="portal-nav-label">{group.label}</p>
              {group.items.map(({ id, text, Icon }) => (
                <button
                  key={id}
                  className="portal-nav-item"
                  data-active={view === id}
                  onClick={() => {
                    change(id);
                    close();
                  }}
                >
                  <Icon />
                  {text}
                </button>
              ))}
            </div>
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
              <UserCog className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>
                ผู้ดูแลแพลตฟอร์ม
              </p>
              <p className="text-[11px]" style={{ color: "#475569" }}>
                admin@flowpdpa.co.th
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

function Overview({
  overview,
  legalUsers,
  change,
}: {
  overview: AdminOverview;
  legalUsers: LegalUser[];
  change: (view: AdminView) => void;
}) {
  const stats = [
    {
      label: "ผู้ประกอบการที่ใช้งานอยู่",
      value: overview.kpi.activeMerchants,
      Icon: Users,
      color: "#2457a6",
    },
    {
      label: "รายการรอตรวจสอบ",
      value: overview.kpi.pendingLegalReviews,
      Icon: FileText,
      color: "#a86207",
    },
    {
      label: "เจ้าหน้าที่กฎหมายที่ใช้งานอยู่",
      value: legalUsers.filter((row) => row.status === "active").length,
      Icon: Scale,
      color: "#087a5b",
    },
    {
      label: "ยอดรับชำระทั้งหมด",
      value: money(overview.kpi.totalRevenue),
      Icon: CircleDollarSign,
      color: "#087a5b",
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="การดำเนินงานแพลตฟอร์ม"
        title="ภาพรวมผู้ดูแลระบบ"
        description="ติดตามบัญชี นโยบาย การชำระเงิน และกระบวนการตรวจสอบด้านกฎหมาย"
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <h2 className="text-sm font-semibold">การชำระเงินล่าสุด</h2>
              <p className="text-xs text-gray-400 mt-1">
                รายการใบแจ้งหนี้ล่าสุดจาก Stripe
              </p>
            </div>
            <button
              className="portal-button"
              onClick={() => change("payments")}
            >
              ดูการชำระเงิน <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {overview.recentPayments.length ? (
            <div className="divide-y divide-gray-100">
              {overview.recentPayments.map((payment) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                  key={payment.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {payment.merchantName ||
                        payment.merchantEmail ||
                        "Unknown merchant"}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {payment.policyType || "Subscription"} ·{" "}
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold">
                      {money(payment.amountPaid)}
                    </span>
                    <Badge value={payment.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="portal-empty">ยังไม่มีรายการชำระเงิน</div>
          )}
        </section>
        <section className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <h2 className="text-sm font-semibold">รายการที่ต้องดำเนินการ</h2>
              <p className="text-xs text-gray-400 mt-1">
                Operational items needing action
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              {
                label: "Pending payments",
                value: overview.kpi.pendingPayments,
                Icon: CreditCard,
                view: "payments" as const,
              },
              {
                label: "Active system errors",
                value: overview.kpi.activeErrors,
                Icon: AlertTriangle,
                view: "logs" as const,
              },
              {
                label: "Unassigned legal reviews",
                value: overview.kpi.unassignedLegalReviews,
                Icon: Users,
                view: "policies" as const,
              },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50"
                onClick={() => change(item.view)}
              >
                <span className="flex items-center gap-3 text-sm">
                  <item.Icon className="w-4 h-4 text-gray-400" />
                  {item.label}
                </span>
                <span className="font-semibold">{item.value}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

const emptyMerchantDraft = {
  name: "",
  email: "",
  password: "",
  companyName: "",
  phone: "",
  website: "",
  status: "active" as MerchantStatus,
  plan: "Free",
};
type MerchantDraft = typeof emptyMerchantDraft;

function MerchantFormModal({
  title,
  draft,
  setDraft,
  close,
  submit,
  submitLabel,
  requirePassword = false,
}: {
  title: string;
  draft: MerchantDraft;
  setDraft: React.Dispatch<React.SetStateAction<MerchantDraft>>;
  close: () => void;
  submit: () => void;
  submitLabel: string;
  requirePassword?: boolean;
}) {
  const fields = [
    "name",
    "email",
    "companyName",
    "phone",
    "website",
    "password",
  ] as const;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
      <section className="portal-panel w-full max-w-lg">
        <div className="portal-panel-head">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            className="portal-button px-2"
            onClick={close}
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {fields.map((field) => (
            <label
              className={`block text-xs font-semibold text-gray-600 ${field === "website" || field === "password" ? "sm:col-span-2" : ""}`}
              key={field}
            >
              {field === "companyName"
                ? "Company name"
                : field === "password" && !requirePassword
                  ? "New password (optional)"
                  : field}
              <input
                required={
                  field === "name" ||
                  field === "email" ||
                  (field === "password" && requirePassword)
                }
                minLength={field === "password" ? 8 : undefined}
                className="mt-2 h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal"
                type={
                  field === "password"
                    ? "password"
                    : field === "email"
                      ? "email"
                      : field === "website"
                        ? "url"
                        : "text"
                }
                value={draft[field]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
          {!requirePassword ? (
            <>
              <label className="block text-xs font-semibold text-gray-600">
                Status
                <select
                  className="mt-2 h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as MerchantStatus,
                    }))
                  }
                >
                  {(["active", "pending", "suspended", "inactive"] as const).map(
                    (value) => (
                      <option key={value}>{value}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                Plan
                <input
                  className="mt-2 h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal"
                  value={draft.plan}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      plan: event.target.value,
                    }))
                  }
                />
              </label>
            </>
          ) : null}
          <button
            className="portal-button primary sm:col-span-2"
            onClick={submit}
          >
            {submitLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function MerchantView({
  rows,
  setRows,
}: {
  rows: Merchant[];
  setRows: React.Dispatch<React.SetStateAction<Merchant[]>>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MerchantStatus>(
    "all",
  );
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyMerchantDraft);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [editDraft, setEditDraft] = useState(emptyMerchantDraft);
  const [deleting, setDeleting] = useState<Merchant | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const visible = rows.filter((row) => {
    const matchesQuery = `${row.id} ${row.name} ${row.email} ${row.companyName || ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return (
      matchesQuery && (statusFilter === "all" || row.status === statusFilter)
    );
  });
  const pagination = usePagination(visible);
  const refresh = async () => {
    const response = await api.admin.listMerchants({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: query || undefined,
      limit: 200,
    });
    if (response.success && response.data) setRows(response.data.merchants);
  };
  const updateStatus = async (id: string, status: MerchantStatus) => {
    setError("");
    const response = await api.admin.updateMerchantStatus(id, status);
    if (!response.success) {
      setError(response.error?.message || "Unable to update merchant status.");
      return;
    }
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, status } : row)),
    );
  };
  const create = async () => {
    if (
      !draft.name.trim() ||
      !draft.email.trim() ||
      draft.password.length < 8
    ) {
      setError(
        "Name, email, and a password of at least 8 characters are required.",
      );
      return;
    }
    setError("");
    const response = await api.admin.createMerchant({
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim().toLowerCase(),
    });
    if (!response.success) {
      setError(response.error?.message || "Unable to create merchant.");
      return;
    }
    setDraft(emptyMerchantDraft);
    setCreating(false);
    await refresh();
  };
  const startEdit = (row: Merchant) => {
    setEditing(row);
    setError("");
    setEditDraft({
      name: row.name,
      email: row.email,
      password: "",
      companyName: row.companyName || "",
      phone: row.phone || "",
      website: "",
      status: row.status,
      plan: "Free",
    });
  };
  const saveEdit = async () => {
    if (!editing || !editDraft.name.trim() || !editDraft.email.trim()) return;
    const { password, ...fields } = editDraft;
    const response = await api.admin.updateMerchant(editing.id, {
      ...fields,
      ...(password ? { password } : {}),
    });
    if (!response.success || !response.data) {
      setError(response.error?.message || "Unable to update merchant.");
      return;
    }
    setRows((current) =>
      current.map((row) =>
        row.id === editing.id ? { ...row, ...response.data?.merchant } : row,
      ),
    );
    setEditing(null);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setError("");
    const response = await api.admin.deleteMerchant(deleting.id);
    setDeleteLoading(false);
    if (!response.success) {
      setError(response.error?.message || "Unable to delete merchant.");
      return;
    }
    setRows((current) => current.filter((row) => row.id !== deleting.id));
    setDeleting(null);
  };
  return (
    <>
      <PageTitle
        eyebrow="การจัดการบัญชี"
        title="ผู้ประกอบการ"
        description="ค้นหาบัญชีและควบคุมสิทธิ์การเข้าใช้แพลตฟอร์ม"
        action={
          <button
            className="portal-button primary"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-4 h-4" />
            Create merchant
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox
          value={query}
          setValue={setQuery}
          placeholder="ค้นหาผู้ประกอบการ"
        />
        <select
          className="portal-filter h-9"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | MerchantStatus)
          }
        >
          <option value="all">ทุกสถานะ</option>
          {(["active", "pending", "suspended", "inactive"] as const).map(
            (value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ),
          )}
        </select>
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
                <th>ผู้ประกอบการ</th>
                <th>บริษัท</th>
                <th>นโยบาย</th>
                <th>สมาชิกที่ใช้งานอยู่</th>
                <th>วันที่สมัคร</th>
                <th>เข้าสู่ระบบล่าสุด</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="shrink-0">รหัส:</span>
                      <code className="select-all break-all">{row.id}</code>
                      <button
                        type="button"
                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-emerald-700"
                        title="คัดลอก Merchant ID"
                        aria-label={`คัดลอก Merchant ID ของ ${row.name}`}
                        onClick={() => {
                          void navigator.clipboard.writeText(row.id).catch(() => {
                            setError("ไม่สามารถคัดลอก Merchant ID ได้");
                          });
                        }}
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td>{row.companyName || "-"}</td>
                  <td>{row.policyCount}</td>
                  <td>{row.activeSubscriptions}</td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>{formatDate(row.lastLoginAt)}</td>
                  <td>
                    <Badge value={row.status} />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="portal-button"
                        onClick={() => startEdit(row)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <select
                        className="portal-filter"
                        value={row.status}
                        onChange={(event) =>
                          void updateStatus(
                            row.id,
                            event.target.value as MerchantStatus,
                          )
                        }
                      >
                        {["active", "pending", "suspended", "inactive"].map(
                          (value) => (
                            <option key={value}>{value}</option>
                          ),
                        )}
                      </select>
                      <button
                        className="portal-button text-red-700"
                        onClick={() => setDeleting(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} total={visible.length} />
      </section>
      {creating && (
        <MerchantFormModal
          title="สร้างผู้ประกอบการ"
          draft={draft}
          setDraft={setDraft}
          close={() => setCreating(false)}
          submit={() => void create()}
          submitLabel="Create account"
          requirePassword
        />
      )}
      {editing && (
        <MerchantFormModal
          title="แก้ไขผู้ประกอบการ"
          draft={editDraft}
          setDraft={setEditDraft}
          close={() => setEditing(null)}
          submit={() => void saveEdit()}
          submitLabel="Save changes"
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="ลบผู้ประกอบการหรือไม่"
        description={`ระบบจะปิดใช้งาน ${deleting?.name || "ผู้ประกอบการรายนี้"} และเก็บนโยบายสาธารณะทั้งหมดเป็นรายการถาวร โดยยังคงประวัติการชำระเงินไว้เพื่อตรวจสอบ`}
        confirmLabel="ลบผู้ประกอบการ"
        tone="destructive"
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function PolicyView({
  rows,
  legalUsers,
  setRows,
}: {
  rows: Policy[];
  legalUsers: LegalUser[];
  setRows: React.Dispatch<React.SetStateAction<Policy[]>>;
}) {
  const [filter, setFilter] = useState<"all" | PolicyStatus>("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedPolicy, setSelectedPolicy] =
    useState<AdminPolicyDetail | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const visible = rows.filter((row) => {
    const matchesQuery =
      `${row.websiteName} ${row.slug} ${row.merchantName || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (filter === "all" || row.status === filter) &&
      (typeFilter === "all" || row.type === typeFilter)
    );
  });
  const pagination = usePagination(visible);
  const assign = async (id: string, legalId: string) => {
    if (!legalId) return;
    setError("");
    const response = await api.admin.assignLegal(id, legalId);
    if (!response.success) {
      setError(response.error?.message || "Unable to assign legal reviewer.");
      return;
    }
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, assignedLegalUserId: legalId } : row,
      ),
    );
  };
  const openContent = async (policyId: string) => {
    setSelectedPolicy(null);
    setContentOpen(true);
    setContentLoading(true);
    setError("");
    const response = await api.admin.getPolicy(policyId);
    setContentLoading(false);
    if (!response.success || !response.data) {
      setError(response.error?.message || "Unable to load policy content.");
      return;
    }
    setSelectedPolicy(response.data.policy);
  };
  return (
    <>
      <PageTitle
        eyebrow="การดำเนินงานด้านนโยบาย"
        title="นโยบายทั้งหมด"
        description="ตรวจสอบสถานะกระบวนการและปรับการมอบหมายฝ่ายกฎหมายได้"
      />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(
          [
            "all",
            "pending_review",
            "approved",
            "edited",
            "rejected",
            "archived",
          ] as const
        ).map((value) => (
          <button
            key={value}
            className="portal-filter"
            data-active={filter === value}
            onClick={() => setFilter(value)}
          >
            {value.replaceAll("_", " ")}
          </button>
        ))}
        <div className="sm:ml-auto">
          <SearchBox
            value={query}
            setValue={setQuery}
            placeholder="ค้นหานโยบาย"
          />
        </div>
        <select
          className="portal-filter h-9"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">ทุกประเภท</option>
          {Array.from(new Set(rows.map((row) => row.type))).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
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
                <th>เว็บไซต์ / นโยบาย</th>
                <th>ผู้ประกอบการ</th>
                <th>ภาษา</th>
                <th>สถานะ</th>
                <th>ผู้ตรวจสอบฝ่ายกฎหมาย</th>
                <th>แก้ไขล่าสุด</th>
                <th>เนื้อหา</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-semibold">{row.websiteName}</p>
                    <p className="text-xs text-gray-400">{row.slug}</p>
                  </td>
                  <td>{row.merchantName || "-"}</td>
                  <td>{row.language.toUpperCase()}</td>
                  <td>
                    <Badge value={row.status} />
                  </td>
                  <td>
                    <select
                      className="portal-filter"
                      value={row.assignedLegalUserId || ""}
                      onChange={(event) =>
                        void assign(row.id, event.target.value)
                      }
                    >
                      <option value="" disabled>
                        Unassigned
                      </option>
                      {legalUsers
                        .filter((user) => user.status === "active")
                        .map((user) => (
                          <option value={user.id} key={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>{formatDate(row.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="portal-button"
                      onClick={() => void openContent(row.id)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} total={visible.length} />
      </section>
      {contentOpen && (
        <PolicyContentModal
          policy={selectedPolicy}
          loading={contentLoading}
          close={() => {
            setContentOpen(false);
            setSelectedPolicy(null);
          }}
        />
      )}
    </>
  );
}

function BillingView({
  mode,
  subscriptions,
  payments,
}: {
  mode: "subscriptions" | "payments";
  subscriptions: Subscription[];
  payments: Payment[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentDetail, setPaymentDetail] = useState<AdminPaymentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const openPayment = async (paymentId: string) => {
    setDetailLoading(true);
    setDetailError("");
    const response = await api.admin.getPayment(paymentId);
    setDetailLoading(false);
    if (response.success && response.data?.payment) {
      setPaymentDetail(response.data.payment);
      return;
    }
    setDetailError(response.error?.message ?? "ไม่สามารถโหลดรายละเอียดการชำระเงินได้");
  };
  const visibleSubscriptions = subscriptions.filter((row) => {
    const matchesQuery =
      `${row.id} ${row.merchantName || ""} ${row.merchantEmail || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (statusFilter === "all" || row.status === statusFilter) &&
      (typeFilter === "all" || row.plan === typeFilter)
    );
  });
  const visiblePayments = payments.filter((row) => {
    const matchesQuery =
      `${row.id} ${row.stripeInvoiceId || ""} ${row.merchantName || ""} ${row.merchantEmail || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (statusFilter === "all" || row.status === statusFilter) &&
      (typeFilter === "all" || row.plan === typeFilter)
    );
  });
  const subscriptionPagination = usePagination(visibleSubscriptions);
  const paymentPagination = usePagination(visiblePayments);
  const source = mode === "subscriptions" ? subscriptions : payments;
  const statuses = Array.from(new Set(source.map((row) => row.status)));
  const policyTypes = Array.from(
    new Set(
      source
        .map((row) => row.plan)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  return (
    <>
      <PageTitle
        eyebrow="การติดตาม Stripe"
        title={mode === "subscriptions" ? "การสมัครสมาชิก" : "การชำระเงิน"}
        description="ข้อมูลการเรียกเก็บเงินแบบอ่านอย่างเดียวที่ซิงก์จาก Stripe"
      />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox
          value={query}
          setValue={setQuery}
          placeholder={
            mode === "subscriptions"
              ? "ค้นหาการสมัครสมาชิก"
              : "ค้นหาการชำระเงิน"
          }
        />
        <select
          className="portal-filter h-9"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">ทุกสถานะ</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="portal-filter h-9"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">ทุกแพ็กเกจ</option>
          {policyTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <section className="portal-panel">
        <div className="portal-table-wrap">
          {mode === "subscriptions" ? (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>การสมัครสมาชิก</th>
                  <th>ผู้ประกอบการ</th>
                  <th>แพ็กเกจ / รอบบิล</th>
                  <th>วันเริ่มรอบ</th>
                  <th>วันสิ้นสุดรอบ</th>
                  <th>การยกเลิก</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionPagination.pageRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs" title={row.stripeSubscriptionId || row.id}>{row.stripeSubscriptionId || row.id}</td>
                    <td>
                      <p className="font-semibold">{row.merchantName || "-"}</p>
                      <p className="text-xs text-gray-400">
                        {row.merchantEmail}
                      </p>
                    </td>
                    <td>
                      <p className="font-semibold capitalize">{row.plan || "-"}</p>
                      <p className="text-xs text-gray-400">{row.billingCycle === "annual" ? "รายปี" : row.billingCycle === "monthly" ? "รายเดือน" : "-"}</p>
                    </td>
                    <td>{formatDate(row.currentPeriodStart)}</td>
                    <td>{formatDate(row.currentPeriodEnd)}</td>
                    <td>{row.cancelAtPeriodEnd ? "At period end" : "-"}</td>
                    <td>
                      <Badge value={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>ใบแจ้งหนี้</th>
                  <th>ผู้ประกอบการ</th>
                  <th>แพ็กเกจ / รอบบิล</th>
                  <th>จำนวนเงิน</th>
                  <th>วันที่ชำระ</th>
                  <th>สถานะ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {paymentPagination.pageRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">
                      {row.stripeInvoiceId || row.id}
                    </td>
                    <td>{row.merchantName || "-"}</td>
                    <td>
                      <p className="font-semibold capitalize">{row.plan || "-"}</p>
                      <p className="text-xs text-gray-400">{row.billingCycle === "annual" ? "รายปี" : row.billingCycle === "monthly" ? "รายเดือน" : "-"}</p>
                    </td>
                    <td>
                      {money(row.amountPaid)} {row.currency.toUpperCase()}
                    </td>
                    <td>{formatDate(row.paidAt)}</td>
                    <td>
                      <Badge value={row.status} />
                    </td>
                    <td>
                      <button type="button" onClick={() => void openPayment(row.id)} className="portal-action-btn">
                        <Eye className="h-3.5 w-3.5" /> ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {mode === "subscriptions" ? (
          <Pagination
            {...subscriptionPagination}
            total={visibleSubscriptions.length}
          />
        ) : (
          <Pagination {...paymentPagination} total={visiblePayments.length} />
        )}
      </section>
      {(detailLoading || detailError || paymentDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={() => { if (!detailLoading) { setPaymentDetail(null); setDetailError(""); } }}>
          <section className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Stripe invoice</p><h2 className="mt-1 text-lg font-bold text-gray-900">รายละเอียดการชำระเงิน</h2></div>
              <button type="button" aria-label="ปิด" onClick={() => { setPaymentDetail(null); setDetailError(""); }} className="grid h-8 w-8 place-items-center rounded border border-gray-200"><X className="h-4 w-4" /></button>
            </header>
            {detailLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-700" /></div> : detailError ? <div className="m-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{detailError}</div> : paymentDetail ? (
              <div className="space-y-6 p-6">
                <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-3">
                  {[["ยอดรวม", `${money(paymentDetail.total)} ${paymentDetail.currency.toUpperCase()}`],["ชำระแล้ว", `${money(paymentDetail.amountPaid)} ${paymentDetail.currency.toUpperCase()}`],["ยอดคงเหลือ", `${money(paymentDetail.amountRemaining)} ${paymentDetail.currency.toUpperCase()}`]].map(([label,value]) => <div key={label} className="bg-white p-4"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 text-lg font-bold text-gray-900">{value}</p></div>)}
                </div>
                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {[["ผู้ประกอบการ", paymentDetail.merchantName || "-"],["อีเมล", paymentDetail.customerEmail || paymentDetail.merchantEmail || "-"],["เลข Invoice", paymentDetail.invoiceNumber || paymentDetail.stripeInvoiceId || "-"],["แพ็กเกจ", `${paymentDetail.plan || "-"} · ${paymentDetail.billingCycle === "annual" ? "รายปี" : "รายเดือน"}`],["สถานะ", paymentDetail.status],["วิธีเรียกเก็บ", paymentDetail.collectionMethod || "-"],["เริ่มรอบ", formatDate(paymentDetail.periodStart)],["สิ้นสุดรอบ", formatDate(paymentDetail.periodEnd)],["Stripe Customer", paymentDetail.stripeCustomerId || "-"],["Stripe Subscription", paymentDetail.stripeSubscriptionId || "-"]].map(([label,value]) => <div key={label}><p className="text-xs text-gray-400">{label}</p><p className="mt-1 break-all text-sm font-semibold text-gray-800">{value}</p></div>)}
                </div>
                <div><h3 className="mb-3 text-sm font-bold text-gray-900">รายการในใบแจ้งหนี้</h3><div className="divide-y divide-gray-100 rounded-lg border border-gray-200">{paymentDetail.lines.map((line) => <div key={line.id} className="flex items-start justify-between gap-4 p-4"><div><p className="text-sm font-semibold text-gray-800">{line.description || "รายการแพ็กเกจ"}</p><p className="mt-1 text-xs text-gray-400">จำนวน {line.quantity ?? 1} · {formatDate(line.periodStart)} – {formatDate(line.periodEnd)}</p></div><p className="shrink-0 text-sm font-bold">{money(line.amount)} {line.currency.toUpperCase()}</p></div>)}</div></div>
                <div className="flex flex-wrap gap-2">{paymentDetail.hostedInvoiceUrl ? <a href={paymentDetail.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="portal-action-btn"><ExternalLink className="h-3.5 w-3.5" /> เปิดใบแจ้งหนี้</a> : null}{paymentDetail.invoicePdf ? <a href={paymentDetail.invoicePdf} target="_blank" rel="noreferrer" className="portal-action-btn"><ExternalLink className="h-3.5 w-3.5" /> ดาวน์โหลด PDF</a> : null}</div>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}

function policyPreviewDocument(content: string) {
  const source = /<(?:!doctype|html|body|h[1-6]|p|div|ul|ol)\b/i.test(content)
    ? content
    : (marked.parse(normalizePolicyMarkdown(content), {
        async: false,
      }) as string);
  const parsed = new DOMParser().parseFromString(source, "text/html");
  parsed
    .querySelectorAll(
      "script, iframe, object, embed, form, meta[http-equiv], base",
    )
    .forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (
        attribute.name.toLowerCase().startsWith("on") ||
        /javascript:/i.test(attribute.value)
      )
        node.removeAttribute(attribute.name);
    });
  });
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:"><style>body{max-width:850px;margin:0 auto;padding:40px 48px;color:#172033;font:15px/1.75 Arial,'Noto Sans Thai',sans-serif}h1{font-size:30px}h2{font-size:22px;margin-top:32px;padding-top:18px;border-top:1px solid #dce1e8}h3{font-size:18px}a{color:#087a5b}li{margin:6px 0}blockquote{margin:18px 0;padding:12px 16px;border-left:3px solid #087a5b;background:#edf5f2}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dce1e8;padding:8px;text-align:left}@media(max-width:640px){body{padding:24px 18px}}</style></head><body>${parsed.body.innerHTML}</body></html>`;
}

function PolicyContentModal({
  policy,
  loading,
  close,
}: {
  policy: AdminPolicyDetail | null;
  loading: boolean;
  close: () => void;
}) {
  const availableLanguages = policy
    ? (
        [
          ["th", policy.contentTh],
          ["en", policy.contentEn],
        ] as const
      ).filter((entry): entry is readonly ["th" | "en", string] =>
        Boolean(entry[1]),
      )
    : [];
  const [language, setLanguage] = useState<"th" | "en">("th");
  const selectedLanguage = availableLanguages.some(
    ([value]) => value === language,
  )
    ? language
    : availableLanguages[0]?.[0];
  const content =
    selectedLanguage === "en" ? policy?.contentEn : policy?.contentTh;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="เนื้อหานโยบาย"
    >
      <section className="portal-panel flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden">
        <header className="portal-panel-head shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {policy?.websiteName || "Policy content"}
            </p>
            <p className="mt-1 truncate text-xs text-gray-400">
              {policy?.slug || "Loading document..."}
            </p>
          </div>
          <button
            type="button"
            className="portal-button px-2"
            onClick={close}
            aria-label="ปิดเนื้อหานโยบาย"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        {loading ? (
          <div className="portal-empty flex-1">กำลังโหลดเนื้อหานโยบาย...</div>
        ) : policy ? (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 px-5 py-3">
              <Badge value={policy.status} />
              <span className="text-xs text-gray-500">
                Version {policy.version}
              </span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                Reviewed {formatDate(policy.reviewedAt)}
              </span>
              <div className="ml-auto flex gap-2">
                {availableLanguages.map(([value]) => (
                  <button
                    type="button"
                    className="portal-filter"
                    data-active={selectedLanguage === value}
                    onClick={() => setLanguage(value)}
                    key={value}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {value === "th" ? "Thai" : "English"}
                  </button>
                ))}
              </div>
            </div>
            {content ? (
              <iframe
                className="min-h-0 flex-1 w-full bg-white"
                sandbox=""
                srcDoc={policyPreviewDocument(content)}
                title={`${policy.websiteName} ${selectedLanguage || ""} policy`}
              />
            ) : (
              <div className="portal-empty flex-1">
                No policy content is available.
              </div>
            )}
          </>
        ) : (
          <div className="portal-empty flex-1">
            Unable to load policy content.
          </div>
        )}
      </section>
    </div>
  );
}

function LegalAssignments({
  users,
  policies,
}: {
  users: LegalUser[];
  policies: Policy[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedPolicy, setSelectedPolicy] =
    useState<AdminPolicyDetail | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const visible = policies.filter((row) => {
    if (!row.assignedLegalUserId) return false;
    const reviewer = users.find((user) => user.id === row.assignedLegalUserId);
    const matchesQuery =
      `${row.websiteName} ${row.slug} ${row.merchantName || ""} ${reviewer?.name || ""} ${reviewer?.email || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (statusFilter === "all" || row.status === statusFilter) &&
      (reviewerFilter === "all" || row.assignedLegalUserId === reviewerFilter)
    );
  });
  const pagination = usePagination(visible);
  const openContent = async (policyId: string) => {
    setSelectedPolicy(null);
    setContentOpen(true);
    setContentLoading(true);
    setError("");
    const response = await api.admin.getPolicy(policyId);
    setContentLoading(false);
    if (!response.success || !response.data) {
      setError(response.error?.message || "Unable to load policy content.");
      return;
    }
    setSelectedPolicy(response.data.policy);
  };

  return (
    <>
      <PageTitle
        eyebrow="การดำเนินงานฝ่ายกฎหมาย"
        title="การมอบหมายตรวจสอบ"
        description="ติดตามนโยบายที่มอบหมายตามผู้ตรวจสอบและสถานะการตรวจสอบ"
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "pending_review", "approved", "rejected"] as const).map(
          (value) => (
            <button
              key={value}
              className="portal-filter"
              data-active={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {value === "all" ? "All reviews" : value.replaceAll("_", " ")}
            </button>
          ),
        )}
        <div className="sm:ml-auto">
          <SearchBox
            value={query}
            setValue={setQuery}
            placeholder="ค้นหานโยบายที่มอบหมาย"
          />
        </div>
        <select
          className="portal-filter h-9"
          value={reviewerFilter}
          onChange={(event) => setReviewerFilter(event.target.value)}
          aria-label="กรองตามผู้ตรวจสอบฝ่ายกฎหมาย"
        >
          <option value="all">ผู้ตรวจสอบฝ่ายกฎหมายทั้งหมด</option>
          {users.map((user) => (
            <option value={user.id} key={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
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
                <th>ผู้ตรวจสอบฝ่ายกฎหมาย</th>
                <th>ผู้ประกอบการ</th>
                <th>สถานะ</th>
                <th>กำหนดส่ง</th>
                <th>เนื้อหา</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageRows.map((row) => {
                const reviewer = users.find(
                  (user) => user.id === row.assignedLegalUserId,
                );
                return (
                  <tr key={row.id}>
                    <td>
                      <p className="font-semibold">{row.websiteName}</p>
                      <p className="text-xs text-gray-400">{row.slug}</p>
                    </td>
                    <td>
                      <p className="font-semibold">
                        {reviewer?.name || "Unknown reviewer"}
                      </p>
                      <p className="text-xs text-gray-400">{reviewer?.email}</p>
                    </td>
                    <td>{row.merchantName || row.merchantEmail || "-"}</td>
                    <td>
                      <Badge value={row.status} />
                    </td>
                    <td>{formatDate(row.approvalDeadline)}</td>
                    <td>
                      <button
                        type="button"
                        className="portal-button"
                        onClick={() => void openContent(row.id)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} total={visible.length} />
      </section>
      {contentOpen && (
        <PolicyContentModal
          policy={selectedPolicy}
          loading={contentLoading}
          close={() => {
            setContentOpen(false);
            setSelectedPolicy(null);
          }}
        />
      )}
    </>
  );
}

function LegalManagement({
  users,
  setUsers,
  workload,
  reviews,
}: {
  users: LegalUser[];
  setUsers: React.Dispatch<React.SetStateAction<LegalUser[]>>;
  workload: AdminLegalWorkload[];
  reviews: AdminLegalReview[];
}) {
  const [tab, setTab] = useState<"users" | "workload" | "history">("users");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [editing, setEditing] = useState<LegalUser | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [deleting, setDeleting] = useState<LegalUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPolicy, setSelectedPolicy] =
    useState<AdminPolicyDetail | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const visibleUsers = users.filter(
    (row) =>
      `${row.name} ${row.email} ${row.phone || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (statusFilter === "all" || row.status === statusFilter),
  );
  const visibleWorkload = workload.filter(
    (row) =>
      row.name.toLowerCase().includes(query.toLowerCase()) &&
      (statusFilter !== "overdue" || row.overdue > 0),
  );
  const visibleReviews = reviews.filter(
    (row) =>
      `${row.legalUserEmail} ${row.websiteName} ${row.policySlug} ${row.comment || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (statusFilter === "all" || row.status === statusFilter),
  );
  const userPagination = usePagination(visibleUsers);
  const workloadPagination = usePagination(visibleWorkload);
  const reviewPagination = usePagination(visibleReviews);
  const refreshUsers = async () => {
    const response = await api.admin.listLegalUsers();
    if (response.success && response.data) setUsers(response.data.legalUsers);
  };
  const create = async () => {
    if (!draft.name || !draft.email || draft.password.length < 8) {
      setError(
        "Name, email, and a password of at least 8 characters are required.",
      );
      return;
    }
    setError("");
    const response = await api.admin.createLegalUser({
      ...draft,
      status: "active",
    });
    if (!response.success) {
      setError(response.error?.message || "Unable to create legal user.");
      return;
    }
    await refreshUsers();
    setDraft({ name: "", email: "", password: "", phone: "" });
    setCreating(false);
  };
  const startEdit = (row: LegalUser) => {
    setError("");
    setEditing(row);
    setEditDraft({ name: row.name, email: row.email, phone: row.phone || "" });
  };
  const saveEdit = async () => {
    if (!editing) return;
    if (!editDraft.name.trim() || !editDraft.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    const response = await api.admin.updateLegalUser(editing.id, {
      name: editDraft.name,
      email: editDraft.email,
      phone: editDraft.phone,
    });
    if (!response.success || !response.data) {
      setError(response.error?.message || "Unable to update legal user.");
      return;
    }
    setUsers((current) =>
      current.map((row) =>
        row.id === editing.id ? { ...row, ...response.data } : row,
      ),
    );
    setEditing(null);
  };
  const updateStatus = async (id: string, status: LegalStatus) => {
    setError("");
    const response = await api.admin.updateLegalUserStatus(id, status);
    if (!response.success) {
      setError(response.error?.message || "Unable to update legal user.");
      return;
    }
    setUsers((current) =>
      current.map((row) => (row.id === id ? { ...row, status } : row)),
    );
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setError("");
    const response = await api.admin.deleteLegalUser(deleting.id);
    setDeleteLoading(false);
    if (!response.success) {
      setError(response.error?.message || "Unable to delete legal user.");
      return;
    }
    setUsers((current) => current.filter((row) => row.id !== deleting.id));
    setDeleting(null);
  };
  const openContent = async (policyId: string) => {
    setSelectedPolicy(null);
    setContentOpen(true);
    setContentLoading(true);
    setError("");
    const response = await api.admin.getPolicy(policyId);
    setContentLoading(false);
    if (!response.success || !response.data) {
      setError(response.error?.message || "Unable to load policy content.");
      return;
    }
    setSelectedPolicy(response.data.policy);
  };
  return (
    <>
      <PageTitle
        eyebrow="การจัดการฝ่ายกฎหมาย"
        title="ทีมกฎหมาย"
        description="จัดการผู้ตรวจสอบ ภาระงาน การมอบหมาย และประวัติการตรวจสอบ"
        action={
          <button
            className="portal-button primary"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-4 h-4" />
            Create legal user
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["users", "workload", "history"] as const).map((value) => (
          <button
            key={value}
            className="portal-filter"
            data-active={tab === value}
            onClick={() => {
              setTab(value);
              setStatusFilter("all");
            }}
          >
            {value}
          </button>
        ))}
        <div className="sm:ml-auto">
          <SearchBox
            value={query}
            setValue={setQuery}
            placeholder={
              tab === "history" ? "Search review history" : "Search legal team"
            }
          />
        </div>
        <select
          className="portal-filter h-9"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">
            All{" "}
            {tab === "history"
              ? "actions"
              : tab === "workload"
                ? "workload"
                : "statuses"}
          </option>
          {tab === "users" ? (
            (["active", "suspended", "inactive"] as const).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))
          ) : tab === "workload" ? (
            <option value="overdue">เฉพาะรายการเกินกำหนด</option>
          ) : (
            (["approved", "rejected", "edited"] as const).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))
          )}
        </select>
      </div>
      {error && (
        <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <section className="portal-panel">
        <div className="portal-table-wrap">
          {tab === "users" ? (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>เจ้าหน้าที่กฎหมาย</th>
                  <th>โทรศัพท์</th>
                  <th>รอดำเนินการ</th>
                  <th>อนุมัติแล้ว</th>
                  <th>ไม่อนุมัติ</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {userPagination.pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-xs text-gray-400">{row.email}</p>
                    </td>
                    <td>{row.phone || "-"}</td>
                    <td>{row.pendingReviews}</td>
                    <td>{row.approvedCount}</td>
                    <td>{row.rejectedCount}</td>
                    <td>
                      <Badge value={row.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="portal-button"
                          onClick={() => startEdit(row)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <select
                          className="portal-filter"
                          value={row.status}
                          onChange={(event) =>
                            void updateStatus(
                              row.id,
                              event.target.value as LegalStatus,
                            )
                          }
                          aria-label={`อัปเดตสถานะของ ${row.name}`}
                        >
                          {["active", "suspended", "inactive"].map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="portal-button text-red-700"
                          onClick={() => setDeleting(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "workload" ? (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>ผู้ตรวจสอบ</th>
                  <th>รอดำเนินการ</th>
                  <th>เกินกำหนด</th>
                  <th>อนุมัติเดือนนี้</th>
                  <th>เวลาตรวจเฉลี่ย</th>
                  <th>ภาระงาน</th>
                </tr>
              </thead>
              <tbody>
                {workloadPagination.pageRows.map((row) => (
                  <tr key={row.legalUserId}>
                    <td className="font-semibold">{row.name}</td>
                    <td>{row.pending}</td>
                    <td>{row.overdue}</td>
                    <td>{row.approvedThisMonth}</td>
                    <td>{row.averageReviewHours}h</td>
                    <td>
                      <div className="w-32 h-1.5 bg-gray-100">
                        <div
                          className="h-full bg-green-700"
                          style={{
                            width: Math.min(100, row.pending * 12) + "%",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>ผู้ตรวจสอบ</th>
                  <th>นโยบาย</th>
                  <th>การดำเนินการ</th>
                  <th>ความคิดเห็น</th>
                  <th>วันที่ตรวจสอบ</th>
                  <th>เนื้อหา</th>
                </tr>
              </thead>
              <tbody>
                {reviewPagination.pageRows.map((row) => (
                  <tr key={row.reviewId}>
                    <td>{row.legalUserEmail}</td>
                    <td>
                      <p className="font-semibold">{row.websiteName}</p>
                      <p className="text-xs text-gray-400">{row.policySlug}</p>
                    </td>
                    <td>
                      <Badge value={row.status} />
                    </td>
                    <td>{row.comment || "-"}</td>
                    <td>{formatDate(row.reviewedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="portal-button"
                        onClick={() => void openContent(row.policyId)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {tab === "users" ? (
          <Pagination {...userPagination} total={visibleUsers.length} />
        ) : tab === "workload" ? (
          <Pagination {...workloadPagination} total={visibleWorkload.length} />
        ) : (
          <Pagination {...reviewPagination} total={visibleReviews.length} />
        )}
      </section>
      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
          <div className="portal-panel w-full max-w-md">
            <div className="portal-panel-head">
              <h2 className="text-sm font-semibold">สร้างเจ้าหน้าที่กฎหมาย</h2>
              <button
                className="portal-button px-2"
                onClick={() => setCreating(false)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {(["name", "email", "password", "phone"] as const).map(
                (field) => (
                  <label
                    className="block text-xs font-semibold text-gray-600 capitalize"
                    key={field}
                  >
                    {field}
                    <input
                      className="mt-2 w-full h-10 border border-gray-300 rounded px-3 text-sm font-normal"
                      type={
                        field === "password"
                          ? "password"
                          : field === "email"
                            ? "email"
                            : "text"
                      }
                      value={draft[field]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ),
              )}
              <button
                className="portal-button primary w-full"
                onClick={() => void create()}
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
          <div className="portal-panel w-full max-w-md">
            <div className="portal-panel-head">
              <h2 className="text-sm font-semibold">แก้ไขเจ้าหน้าที่กฎหมาย</h2>
              <button
                className="portal-button px-2"
                onClick={() => setEditing(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {(["name", "email", "phone"] as const).map((field) => (
                <label
                  className="block text-xs font-semibold text-gray-600 capitalize"
                  key={field}
                >
                  {field}
                  <input
                    className="mt-2 w-full h-10 border border-gray-300 rounded px-3 text-sm font-normal"
                    type={field === "email" ? "email" : "text"}
                    value={editDraft[field]}
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
              <button
                className="portal-button primary w-full"
                onClick={() => void saveEdit()}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="ลบเจ้าหน้าที่กฎหมายหรือไม่"
        description={`ระบบจะปิดใช้งาน ${deleting?.name || "เจ้าหน้าที่กฎหมายรายนี้"} และมอบหมายนโยบายที่ค้างอยู่ให้ผู้อื่น`}
        confirmLabel="ลบเจ้าหน้าที่กฎหมาย"
        tone="destructive"
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
      {contentOpen && (
        <PolicyContentModal
          policy={selectedPolicy}
          loading={contentLoading}
          close={() => {
            setContentOpen(false);
            setSelectedPolicy(null);
          }}
        />
      )}
    </>
  );
}

type AdminLogType =
  | "all"
  | "error"
  | "document_acknowledged"
  | "customer_consent"
  | "merchant_change_requested"
  | "legal_document_updated";

const adminLogType = (log: ErrorLog): Exclude<AdminLogType, "all"> => {
  const value = String(log.context?.type || log.context?.eventType || "");
  if (
    value === "document_acknowledged" ||
    value === "customer_consent" ||
    value === "merchant_change_requested" ||
    value === "legal_document_updated"
  )
    return value;
  return "error";
};

const adminLogLabel: Record<Exclude<AdminLogType, "all">, string> = {
  error: "ข้อผิดพลาดของระบบ",
  document_acknowledged: "การรับทราบเอกสาร",
  customer_consent: "ความยินยอมของลูกค้า",
  merchant_change_requested: "คำขอแก้ไขจากผู้ประกอบการ",
  legal_document_updated: "การแก้ไขเอกสารโดยฝ่ายกฎหมาย",
};

function LogsView({ logs }: { logs: ErrorLog[] }) {
  const [type, setType] = useState<AdminLogType>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return logs.filter((log) => {
      const logType = adminLogType(log);
      if (type !== "all" && logType !== type) return false;
      if (!normalized) return true;
      return [
        log.id,
        log.service,
        log.message,
        log.level,
        log.context?.method,
        log.context?.path,
        log.context?.relatedField,
        log.context?.policyId,
        adminLogLabel[logType],
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase()
          .includes(normalized),
      );
    });
  }, [logs, query, type]);
  const pagination = usePagination(visible);
  return (
    <>
      <PageTitle
        eyebrow="การติดตามแพลตฟอร์ม"
        title="บันทึกระบบ"
        description="ข้อผิดพลาด คำเตือน บริการขัดข้อง และข้อมูลสำหรับวิเคราะห์ปัญหา"
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox
          value={query}
          setValue={setQuery}
          placeholder="ค้นหาบันทึก"
        />
        <select
          className="portal-filter h-9"
          value={type}
          onChange={(event) => setType(event.target.value as AdminLogType)}
        >
          <option value="all">บันทึกทุกประเภท</option>
          <option value="error">ข้อผิดพลาดของระบบ</option>
          <option value="document_acknowledged">การรับทราบเอกสาร</option>
          <option value="customer_consent">ความยินยอมของลูกค้า</option>
          <option value="merchant_change_requested">
            คำขอแก้ไขจากผู้ประกอบการ
          </option>
          <option value="legal_document_updated">
            การแก้ไขเอกสารโดยฝ่ายกฎหมาย
          </option>
        </select>
        <span className="text-xs text-gray-400">
          {visible.length} of {logs.length} logs
        </span>
      </div>
      <section className="portal-panel">
        {visible.length === 0 ? (
          <div className="portal-empty">ไม่พบบันทึกที่ตรงกับตัวกรอง</div>
        ) : (
          <>
            <div className="portal-table-wrap">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>ประเภท</th>
                    <th>ระดับ</th>
                    <th>บริการ / ข้อมูลที่เกี่ยวข้อง</th>
                    <th>คำขอ / ID ที่เกี่ยวข้อง</th>
                    <th>รายละเอียด</th>
                    <th>เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageRows.map((row) => {
                    const logType = adminLogType(row);
                    return (
                      <tr key={row.id}>
                        <td>
                          <Badge value={adminLogLabel[logType]} />
                        </td>
                        <td>
                          <Badge value={row.level} />
                        </td>
                        <td>
                          {String(
                            row.context?.relatedField || row.service || "-",
                          )}
                        </td>
                        <td className="font-mono text-xs">
                          {String(row.context?.method || "")}{" "}
                          {String(
                            row.context?.path ||
                              row.context?.relatedId ||
                              row.context?.policyId ||
                              "-",
                          )}
                        </td>
                        <td>{row.message}</td>
                        <td>{formatDate(row.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} total={visible.length} />
          </>
        )}
      </section>
    </>
  );
}

function AuditLogsView() {
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);
  useEffect(() => {
    void api.admin.listActivityLogs({ limit: 500 }).then((response) => {
      if (response.success && response.data) setRows(response.data.logs);
      else setError(response.error?.message || "ไม่สามารถโหลดบันทึกกิจกรรมได้");
      setLoading(false);
    });
  }, []);
  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (action === "all" || row.action === action) &&
          (!query.trim() ||
            `${row.actorEmail || "public"} ${row.actorRole || ""} ${row.method} ${row.path} ${row.statusCode} ${row.ipAddress || ""}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [rows, query, action],
  );
  const pagination = usePagination(visible);
  return (
    <>
      <PageTitle
        eyebrow="หลักฐานการตรวจสอบย้อนหลัง"
        title="บันทึกกิจกรรม"
        description="ประวัติการดำเนินการที่ระบุผู้กระทำ รายการที่ทำ และผลลัพธ์ โดยระบบไม่จัดเก็บเนื้อหาคำขอ รหัสผ่าน โทเคน หรือคุกกี้"
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox
          value={query}
          setValue={setQuery}
          placeholder="ค้นหาผู้ดำเนินการ เส้นทาง หรือ IP"
        />
        <select
          className="portal-filter h-9"
          value={action}
          onChange={(event) => setAction(event.target.value)}
        >
          <option value="all">การดำเนินการทั้งหมด</option>
          <option value="create">สร้าง</option>
          <option value="update">แก้ไข</option>
          <option value="delete">ลบ</option>
        </select>
        <span className="text-xs text-gray-400">
          {visible.length} of {rows.length} events
        </span>
      </div>
      {error && (
        <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <section className="portal-panel">
        {loading ? (
          <div className="portal-empty">กำลังโหลดบันทึกกิจกรรม...</div>
        ) : visible.length === 0 ? (
          <div className="portal-empty">ไม่พบกิจกรรมที่ตรงกับตัวกรอง</div>
        ) : (
          <>
            <div className="portal-table-wrap">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>ผู้ดำเนินการ</th>
                    <th>การดำเนินการ</th>
                    <th>คำขอ</th>
                    <th>ผลลัพธ์</th>
                    <th>IP / เบราว์เซอร์</th>
                    <th>เวลา</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <p className="font-semibold">
                          {row.actorEmail || "ผู้เข้าชมทั่วไป"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {row.actorRole || "anonymous"}
                        </p>
                      </td>
                      <td>
                        <Badge value={row.action} />
                      </td>
                      <td>
                        <p className="font-mono text-xs">
                          {row.method} {row.path}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {row.durationMs ?? "-"} ms
                        </p>
                      </td>
                      <td>
                        <Badge
                          value={
                            row.statusCode < 400
                              ? `Success ${row.statusCode}`
                              : `Failed ${row.statusCode}`
                          }
                        />
                      </td>
                      <td>
                        <p className="font-mono text-xs">
                          {row.ipAddress || "-"}
                        </p>
                        <p
                          className="mt-1 max-w-xs truncate text-[11px] text-gray-400"
                          title={row.userAgent || ""}
                        >
                          {row.userAgent || "-"}
                        </p>
                      </td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="portal-button"
                          onClick={() => setSelected(row)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} total={visible.length} />
          </>
        )}
      </section>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section className="portal-panel flex max-h-[92vh] w-full max-w-2xl flex-col">
            <div className="portal-panel-head shrink-0">
              <div>
                <h2 className="text-sm font-semibold">รายละเอียดกิจกรรม</h2>
                <p className="mt-1 font-mono text-[11px] text-gray-400">
                  {selected.id}
                </p>
              </div>
              <button
                type="button"
                className="portal-button px-2"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["ผู้ดำเนินการ", selected.actorEmail || "ผู้เข้าชมทั่วไป"],
                  ["Role", selected.actorRole || "anonymous"],
                  ["Action", selected.action],
                  ["Timestamp", formatDate(selected.createdAt)],
                  ["Request", `${selected.method} ${selected.path}`],
                  [
                    "Result",
                    `${selected.statusCode < 400 ? "Success" : "Failed"} ${selected.statusCode}`,
                  ],
                  ["IP address", selected.ipAddress || "-"],
                  ["Duration", `${selected.durationMs ?? "-"} ms`],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-gray-100 pb-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {label}
                    </dt>
                    <dd className="mt-1 break-all text-sm text-gray-800">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  เบราว์เซอร์ / User Agent
                </p>
                <p className="mt-2 break-all rounded bg-gray-50 p-3 text-xs text-gray-700">
                  {selected.userAgent || "-"}
                </p>
              </div>
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  ข้อมูลประกอบที่ปลอดภัย
                </p>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-900 p-4 text-xs text-slate-100">
                  {JSON.stringify(selected.metadata || {}, null, 2)}
                </pre>
              </div>
              <p className="mt-4 border-l-2 border-emerald-600 pl-3 text-xs text-gray-500">
                ระบบตั้งใจไม่จัดเก็บเนื้อหาคำขอ รหัสผ่าน โทเคน คุกกี้ และส่วนหัว
                Authorization
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function AnalyticsView({ analytics }: { analytics: AdminAnalytics }) {
  const metrics = [
    {
      label: "รายรับเดือนนี้",
      value: money(analytics.revenue.currentMonth),
      hint: analytics.revenue.currencyUnit,
    },
    {
      label: "การเติบโตของผู้ประกอบการ",
      value: `${analytics.merchantGrowth.monthOverMonthPercent}%`,
      hint: "เทียบกับเดือนก่อน",
    },
    {
      label: "ผู้ประกอบการใหม่",
      value: analytics.merchantGrowth.newThisMonth,
      hint: "เดือนปัจจุบัน",
    },
    {
      label: "อัตราการยกเลิกสมาชิก",
      value: analytics.merchantGrowth.churnedSubscriptionsThisMonth,
      hint: "เดือนปัจจุบัน",
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="ข้อมูลเชิงลึกของแพลตฟอร์ม"
        title="การวิเคราะห์"
        description="ตัวชี้วัดด้านรายรับ การเติบโต นโยบาย และความเสี่ยงในการดำเนินงาน"
      />
      <section className="portal-kpis">
        {metrics.map((row) => (
          <div className="portal-kpi" key={row.label}>
            <Activity className="w-4 h-4 text-blue-700 mb-4" />
            <p className="text-2xl font-semibold">{row.value}</p>
            <p className="text-xs text-gray-600 mt-1">{row.label}</p>
            <p className="text-[11px] text-gray-400 mt-1">{row.hint}</p>
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="portal-panel p-5">
          <h2 className="text-sm font-semibold mb-5">รายรับตามประเภทนโยบาย</h2>
          {Object.entries(analytics.revenue.byPolicyType).map(
            ([type, value]) => (
              <MetricBar
                key={type}
                label={type}
                value={value}
                max={analytics.revenue.total}
              />
            ),
          )}
        </section>
        <section className="portal-panel p-5">
          <h2 className="text-sm font-semibold mb-5">สถานะนโยบาย</h2>
          {Object.entries(analytics.policies.byStatus).map(
            ([status, count]) => (
              <MetricBar
                key={status}
                label={status.replaceAll("_", " ")}
                value={count}
                max={Object.values(analytics.policies.byStatus).reduce(
                  (sum, value) => sum + value,
                  0,
                )}
              />
            ),
          )}
        </section>
      </div>
    </>
  );
}

const emptyTemplate: DocumentTemplateInput = {
  title: "",
  category: "consent-form",
  purpose: "",
  content: "",
  disclaimer:
    "เอกสารนี้เป็นเทมเพลตเริ่มต้นสำหรับนำไปปรับใช้ ไม่ใช่คำแนะนำทางกฎหมาย และไม่รับรองความถูกต้องตามกฎหมาย 100%",
  fields: [],
  status: "active",
};

function TemplateManagement() {
  const [rows, setRows] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<DocumentTemplateInput>(emptyTemplate);
  const [deleting, setDeleting] = useState<DocumentTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await api.templates.adminList();
    if (response.success && response.data) setRows(response.data);
    else setError(response.error?.message || "ไม่สามารถโหลดเทมเพลตได้");
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);
  const openCreate = () => {
    setEditing(null);
    setDraft(emptyTemplate);
    setFormOpen(true);
    setError("");
  };
  const openEdit = (row: DocumentTemplate) => {
    setEditing(row);
    setDraft({
      title: row.title,
      category: row.category,
      purpose: row.purpose,
      content: row.content,
      disclaimer: row.disclaimer,
      fields: row.fields || [],
      status: row.status,
    });
    setFormOpen(true);
    setError("");
  };
  const save = async () => {
    if (
      !draft.title.trim() ||
      !draft.category.trim() ||
      !draft.purpose.trim() ||
      !draft.content.trim() ||
      !draft.disclaimer.trim()
    ) {
      setError("กรุณากรอกข้อมูลเทมเพลตให้ครบถ้วน");
      return;
    }
    setSaving(true);
    setError("");
    const response = editing
      ? await api.templates.update(editing.id, draft)
      : await api.templates.create(draft);
    setSaving(false);
    if (!response.success) {
      setError(response.error?.message || "ไม่สามารถบันทึกเทมเพลตได้");
      return;
    }
    setEditing(null);
    setDraft(emptyTemplate);
    setFormOpen(false);
    await load();
  };
  const remove = async () => {
    if (!deleting) return;
    const response = await api.templates.delete(deleting.id);
    if (!response.success) {
      setError(response.error?.message || "ไม่สามารถลบเทมเพลตได้");
      return;
    }
    setRows((current) => current.filter((row) => row.id !== deleting.id));
    setDeleting(null);
  };
  return (
    <>
      <PageTitle
        eyebrow="การกำกับดูแลเนื้อหา"
        title="เทมเพลตเอกสาร"
        description="จัดการเอกสารเริ่มต้นที่ผู้ประกอบการสามารถนำไปใช้งานได้"
        action={
          <button className="portal-button primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            สร้างเทมเพลต
          </button>
        }
      />
      {error && (
        <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <section className="portal-panel">
        {loading ? (
          <div className="portal-empty">กำลังโหลดเทมเพลต...</div>
        ) : rows.length === 0 ? (
          <div className="portal-empty">
            ยังไม่มีเทมเพลตที่จัดการโดยผู้ดูแล กรุณาสร้างเทมเพลตแรกเพื่อใช้แทน
            ตัวอย่างเริ่มต้นของระบบ
          </div>
        ) : (
          <div className="portal-table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>เทมเพลต</th>
                  <th>หมวดหมู่</th>
                  <th>สถานะ</th>
                  <th>แก้ไขล่าสุด</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-semibold">{row.title}</p>
                      <p className="mt-1 max-w-xl truncate text-xs text-gray-400">
                        {row.purpose}
                      </p>
                    </td>
                    <td>{row.category}</td>
                    <td>
                      <Badge value={row.status} />
                    </td>
                    <td>{formatDate(row.updatedAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="portal-button"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          className="portal-button text-red-700"
                          onClick={() => setDeleting(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <section className="portal-panel flex h-[calc(100dvh-2rem)] max-h-[92vh] w-full max-w-3xl flex-col">
            <div className="portal-panel-head shrink-0">
              <div>
                <h2 className="text-sm font-semibold">
                  {editing ? "แก้ไขเทมเพลต" : "สร้างเทมเพลต"}
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  เอกสารที่ผู้ประกอบการส่งออกจะแนบข้อความสงวนสิทธิ์โดยอัตโนมัติ
                </p>
              </div>
              <button
                className="portal-button px-2"
                onClick={() => {
                  setEditing(null);
                  setDraft(emptyTemplate);
                  setFormOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain p-5 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-600">
                Title
                <input
                  className="mt-2 h-10 w-full rounded border px-3 font-normal"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-gray-600">
                Category
                <input
                  className="mt-2 h-10 w-full rounded border px-3 font-normal"
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 sm:col-span-2">
                Purpose
                <textarea
                  className="mt-2 min-h-20 w-full rounded border p-3 font-normal"
                  value={draft.purpose}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      purpose: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 sm:col-span-2">
                เนื้อหาเทมเพลต
                <textarea
                  className="mt-2 min-h-72 w-full rounded border p-3 font-mono text-xs font-normal"
                  value={draft.content}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 sm:col-span-2">
                ข้อความสงวนสิทธิ์ทางกฎหมาย
                <textarea
                  className="mt-2 min-h-24 w-full rounded border p-3 font-normal"
                  value={draft.disclaimer}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      disclaimer: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">
                      ช่องข้อมูลในแบบฟอร์ม
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      แสดงเมื่อผู้ประกอบการใช้เทมเพลตนี้สร้างแบบฟอร์มความยินยอม
                    </p>
                  </div>
                  <button
                    type="button"
                    className="portal-button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        fields: [
                          ...current.fields,
                          {
                            id: `field-${Date.now()}`,
                            type: "text",
                            label: "ช่องข้อมูลใหม่",
                            placeholder: "",
                            required: false,
                            options: [],
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มช่องข้อมูล
                  </button>
                </div>
                <div className="space-y-2">
                  {draft.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid gap-2 border border-gray-200 bg-gray-50 p-3 sm:grid-cols-12"
                    >
                      <input
                        aria-label="ชื่อช่องข้อมูล"
                        className="h-9 rounded border px-2 text-xs sm:col-span-4"
                        value={field.label}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            fields: current.fields.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          }))
                        }
                      />
                      <select
                        aria-label="ประเภทช่องข้อมูล"
                        className="h-9 rounded border px-2 text-xs sm:col-span-2"
                        value={field.type}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            fields: current.fields.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    type: event.target
                                      .value as typeof item.type,
                                  }
                                : item,
                            ),
                          }))
                        }
                      >
                        {[
                          "text",
                          "email",
                          "textarea",
                          "checkbox",
                          "select",
                        ].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                      <input
                        aria-label={
                          field.type === "select"
                            ? "ตัวเลือกคั่นด้วยเครื่องหมายจุลภาค"
                            : "Placeholder"
                        }
                        className="h-9 rounded border px-2 text-xs sm:col-span-3"
                        placeholder={
                          field.type === "select"
                            ? "Option A, Option B"
                            : "Placeholder"
                        }
                        value={
                          field.type === "select"
                            ? field.options.join(", ")
                            : field.placeholder || ""
                        }
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            fields: current.fields.map((item, itemIndex) =>
                              itemIndex === index
                                ? field.type === "select"
                                  ? {
                                      ...item,
                                      options: event.target.value
                                        .split(",")
                                        .map((value) => value.trim())
                                        .filter(Boolean),
                                    }
                                  : { ...item, placeholder: event.target.value }
                                : item,
                            ),
                          }))
                        }
                      />
                      <label className="flex h-9 items-center gap-1 text-[11px] sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              fields: current.fields.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, required: event.target.checked }
                                  : item,
                              ),
                            }))
                          }
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        aria-label="ลบช่องข้อมูล"
                        className="grid h-9 place-items-center text-red-600"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            fields: current.fields.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <label className="text-xs font-semibold text-gray-600">
                Status
                <select
                  className="mt-2 h-10 w-full rounded border px-3 font-normal"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target
                        .value as DocumentTemplateInput["status"],
                    }))
                  }
                >
                  <option value="active">ใช้งานอยู่</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                </select>
              </label>
              <div className="flex items-end justify-end">
                <button
                  className="portal-button primary"
                  disabled={saving}
                  onClick={() => void save()}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกเทมเพลต"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="ลบเทมเพลตหรือไม่"
        description={`${deleting?.title || "เทมเพลตนี้"} จะหายออกจากคลังเทมเพลตของผู้ประกอบการทันที`}
        confirmLabel="ลบเทมเพลต"
        tone="destructive"
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function MetricBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = max > 0 && value > 0 ? Math.max(5, (value / max) * 100) : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs mb-2">
        <span className="capitalize">{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="h-2 bg-gray-100">
        <div className="h-full bg-blue-700" style={{ width: width + "%" }} />
      </div>
    </div>
  );
}

function SearchBox({
  value,
  setValue,
  placeholder,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
      <input
        className="portal-search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [view, setView] = useState<AdminView>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [legalUsers, setLegalUsers] = useState<LegalUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [workload, setWorkload] = useState<AdminLegalWorkload[]>([]);
  const [reviews, setReviews] = useState<AdminLegalReview[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.all([
      api.admin.overview(),
      api.admin.listMerchants({ limit: 200 }),
      api.admin.listPolicies({ limit: 200 }),
      api.admin.listLegalUsers(),
      api.admin.listSubscriptions({ limit: 200 }),
      api.admin.listPayments({ limit: 200 }),
      api.admin.listLogs({ limit: 200 }),
      api.admin.analytics(),
      api.admin.legalWorkload(),
      api.admin.legalReviews({ limit: 200 }),
    ]).then(
      ([
        overviewResponse,
        merchantsResponse,
        policiesResponse,
        legalUsersResponse,
        subscriptionsResponse,
        paymentsResponse,
        logsResponse,
        analyticsResponse,
        workloadResponse,
        reviewsResponse,
      ]) => {
        if (!active) return;
        if (overviewResponse.success && overviewResponse.data)
          setOverview(overviewResponse.data);
        if (merchantsResponse.success && merchantsResponse.data)
          setMerchants(merchantsResponse.data.merchants);
        if (policiesResponse.success && policiesResponse.data)
          setPolicies(policiesResponse.data.policies);
        if (legalUsersResponse.success && legalUsersResponse.data)
          setLegalUsers(legalUsersResponse.data.legalUsers);
        if (subscriptionsResponse.success && subscriptionsResponse.data)
          setSubscriptions(subscriptionsResponse.data.subscriptions);
        if (paymentsResponse.success && paymentsResponse.data)
          setPayments(paymentsResponse.data.payments);
        if (logsResponse.success && logsResponse.data)
          setLogs(logsResponse.data.logs);
        if (analyticsResponse.success && analyticsResponse.data)
          setAnalytics(analyticsResponse.data);
        if (workloadResponse.success && workloadResponse.data)
          setWorkload(workloadResponse.data.workload);
        if (reviewsResponse.success && reviewsResponse.data)
          setReviews(reviewsResponse.data.reviews);
        const failed = [
          overviewResponse,
          merchantsResponse,
          policiesResponse,
          legalUsersResponse,
          subscriptionsResponse,
          paymentsResponse,
          logsResponse,
          analyticsResponse,
          workloadResponse,
          reviewsResponse,
        ].find((response) => !response.success);
        setLoadError(failed?.error?.message || "");
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  const activeTitle = useMemo(
    () => view.charAt(0).toUpperCase() + view.slice(1),
    [view],
  );
  const logout = () => setConfirmLogout(true);
  const confirmSignOut = () => {
    session.logout();
    navigate("/login", { replace: true });
  };
  let content: React.ReactNode;
  if (loading)
    content = <div className="portal-empty">กำลังโหลดระบบผู้ดูแล...</div>;
  else if (view === "overview" && overview)
    content = (
      <Overview overview={overview} legalUsers={legalUsers} change={setView} />
    );
  else if (view === "merchants")
    content = <MerchantView rows={merchants} setRows={setMerchants} />;
  else if (view === "policies")
    content = (
      <PolicyView
        rows={policies}
        legalUsers={legalUsers}
        setRows={setPolicies}
      />
    );
  else if (view === "templates") content = <TemplateManagement />;
  else if (view === "subscriptions" || view === "payments")
    content = (
      <BillingView
        mode={view}
        subscriptions={subscriptions}
        payments={payments}
      />
    );
  else if (view === "assignments")
    content = <LegalAssignments users={legalUsers} policies={policies} />;
  else if (view === "legal")
    content = (
      <LegalManagement
        users={legalUsers}
        setUsers={setLegalUsers}
        workload={workload}
        reviews={reviews}
      />
    );
  else if (view === "logs") content = <LogsView logs={logs} />;
  else if (view === "audit") content = <AuditLogsView />;
  else if (view === "analytics" && analytics)
    content = <AnalyticsView analytics={analytics} />;
  else
    content = (
      <div className="portal-empty">ไม่สามารถโหลดหน้าผู้ดูแลนี้ได้</div>
    );
  return (
    <div className="portal-shell">
      <ConfirmDialog
        open={confirmLogout}
        title="ออกจากระบบผู้ดูแลหรือไม่"
        description="คุณต้องเข้าสู่ระบบอีกครั้งเพื่อเข้าถึงการจัดการแพลตฟอร์ม"
        confirmLabel="ออกจากระบบ"
        onConfirm={confirmSignOut}
        onCancel={() => setConfirmLogout(false)}
      />
      <Sidebar
        view={view}
        change={setView}
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
              aria-label="เปิดเมนูนำทาง"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-semibold">{activeTitle}</p>
              <p className="text-[11px] text-gray-400">การจัดการแพลตฟอร์ม</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Landmark className="w-4 h-4 text-green-700" />
            Administrator
          </span>
        </header>
        <main className="portal-content portal-content-admin">
          {loadError && (
            <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loadError}
            </p>
          )}
          {content}
        </main>
      </div>
    </div>
  );
}
