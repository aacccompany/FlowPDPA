import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Filter, Search, X } from "lucide-react";

import { api } from "@/services/api";
import type { AdminAuditLog, AdminMerchant, AdminPolicy } from "@/services/api";
import { ExportRowsMenu, loadPagedRows } from "@/components/admin/ExportRowsMenu";

const ACTIONS: Record<string, string> = {
  login_success: "เข้าสู่ระบบสำเร็จ",
  login_failed: "เข้าสู่ระบบไม่สำเร็จ",
  oauth_login_success: "เข้าสู่ระบบด้วย Google สำเร็จ",
  oauth_login_failed: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ",
  password_reset: "ตั้งรหัสผ่านใหม่",
  merchant_created: "สร้างผู้ประกอบการ",
  merchant_updated: "แก้ไขผู้ประกอบการ",
  merchant_status_changed: "เปลี่ยนสถานะผู้ประกอบการ",
  legal_user_created: "สร้างผู้ใช้ฝ่ายกฎหมาย",
  legal_user_updated: "แก้ไขผู้ใช้ฝ่ายกฎหมาย",
  policy_created: "สร้างนโยบาย",
  policy_regenerated: "สร้างนโยบายใหม่",
  policy_archived: "จัดเก็บนโยบาย",
  privacy_notice_accepted: "รับทราบ Privacy Notice",
  terms_privacy_accepted: "ยอมรับข้อกำหนดและนโยบาย",
  "consent.form_created": "สร้างแบบฟอร์มความยินยอม",
  "consent.form_updated": "แก้ไขแบบฟอร์มความยินยอม",
  "consent.exported": "ส่งออกหลักฐานความยินยอม",
  "billing.payment_succeeded": "ชำระเงินสำเร็จ",
  "billing.payment_failed": "ชำระเงินไม่สำเร็จ",
  "auth.logout": "ออกจากระบบ",
};

const CATEGORIES: Record<string, string> = {
  authentication: "การเข้าสู่ระบบ",
  security: "ความปลอดภัย",
  merchant: "ผู้ประกอบการ",
  legal: "ฝ่ายกฎหมาย",
  document: "เอกสาร",
  consent: "ความยินยอม",
  billing: "การชำระเงิน",
  acknowledgement: "การรับทราบ",
  system: "ระบบ",
};
const ROLES = ["admin", "legal", "merchant", "public", "system"];
const RESULTS: Record<string, string> = { success: "สำเร็จ", failure: "ไม่สำเร็จ" };
const SOURCES = ["api", "oauth", "webhook", "worker", "system"];
const PAGE_SIZE = 20;

type Filters = {
  actions: string[];
  categories: string[];
  roles: string[];
  results: string[];
  sources: string[];
  merchantId: string;
  merchantLabel: string;
  documentId: string;
  documentLabel: string;
  requestId: string;
  dateFrom: string;
  dateTo: string;
};

const emptyFilters = (): Filters => ({
  actions: [], categories: [], roles: [], results: [], sources: [],
  merchantId: "", merchantLabel: "", documentId: "", documentLabel: "",
  requestId: "", dateFrom: "", dateTo: "",
});
const csv = (value: string | null) => value?.split(",").filter(Boolean) ?? [];
const fromParams = (params: URLSearchParams): Filters => ({
  actions: csv(params.get("auditActions")), categories: csv(params.get("auditCategories")),
  roles: csv(params.get("auditRoles")), results: csv(params.get("auditResults")),
  sources: csv(params.get("auditSources")), merchantId: params.get("auditMerchant") ?? "",
  merchantLabel: params.get("auditMerchantLabel") ?? "", documentId: params.get("auditDocument") ?? "",
  documentLabel: params.get("auditDocumentLabel") ?? "", requestId: params.get("auditRequest") ?? "",
  dateFrom: params.get("auditFrom") ?? "", dateTo: params.get("auditTo") ?? "",
});
const activeCount = (filters: Filters) =>
  [filters.actions, filters.categories, filters.roles, filters.results, filters.sources].filter((v) => v.length).length
  + [filters.merchantId, filters.documentId, filters.requestId, filters.dateFrom || filters.dateTo].filter(Boolean).length;
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString("th-TH", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
}) : "-";

function ToggleGroup({ title, values, options, onChange }: {
  title: string; values: string[]; options: Record<string, string>; onChange: (values: string[]) => void;
}) {
  return <fieldset className="audit-filter-group">
    <legend>{title}</legend>
    <div className="audit-check-grid">
      {Object.entries(options).map(([value, label]) => <label key={value}>
        <input type="checkbox" checked={values.includes(value)} onChange={() => onChange(
          values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
        )} />
        <span>{label}</span>
      </label>)}
    </div>
  </fieldset>;
}

export function AuditExplorer() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => fromParams(params));
  const [draft, setDraft] = useState<Filters>(() => fromParams(params));
  const [search, setSearch] = useState(() => params.get("auditSearch") ?? "");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(() => Number(params.get("auditPage")) || 1);
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);
  const [merchantSearch, setMerchantSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [documents, setDocuments] = useState<AdminPolicy[]>([]);
  const requestSequence = useRef(0);

  useEffect(() => {
    const next = new URLSearchParams(params);
    const put = (key: string, value: string) => value ? next.set(key, value) : next.delete(key);
    put("auditSearch", search); put("auditPage", page > 1 ? String(page) : "");
    put("auditActions", filters.actions.join(",")); put("auditCategories", filters.categories.join(","));
    put("auditRoles", filters.roles.join(",")); put("auditResults", filters.results.join(","));
    put("auditSources", filters.sources.join(",")); put("auditMerchant", filters.merchantId);
    put("auditMerchantLabel", filters.merchantLabel); put("auditDocument", filters.documentId);
    put("auditDocumentLabel", filters.documentLabel); put("auditRequest", filters.requestId);
    put("auditFrom", filters.dateFrom); put("auditTo", filters.dateTo);
    setParams(next, { replace: true });
    // URL synchronization intentionally follows applied state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, search, page, setParams]);

  useEffect(() => {
    const sequence = ++requestSequence.current;
    setLoading(true); setError("");
    void api.admin.listActivityLogs({
      search: deferredSearch || undefined, action: filters.actions.join(",") || undefined,
      category: filters.categories.join(",") || undefined, role: filters.roles.join(",") || undefined,
      result: filters.results.join(",") || undefined, source: filters.sources.join(",") || undefined,
      merchantId: filters.merchantId || undefined, targetId: filters.documentId || undefined,
      requestId: filters.requestId || undefined, dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined, page, limit: PAGE_SIZE,
    }).then((response) => {
      if (sequence !== requestSequence.current) return;
      if (response.success && response.data) {
        setRows(response.data.logs); setPages(Math.max(1, response.data.pagination.pages ?? Math.ceil(response.data.pagination.total / PAGE_SIZE)));
        setTotal(response.data.pagination.total);
      } else setError(response.error?.message || "ไม่สามารถโหลดบันทึกกิจกรรมได้");
      setLoading(false);
    });
  }, [deferredSearch, filters, page]);

  const deferredMerchantSearch = useDeferredValue(merchantSearch);
  const deferredDocumentSearch = useDeferredValue(documentSearch);
  useEffect(() => {
    if (!filterOpen || deferredMerchantSearch.trim().length < 2) return setMerchants([]);
    void api.admin.listMerchants({ search: deferredMerchantSearch.trim(), limit: 10 }).then((r) =>
      setMerchants(r.success && r.data ? r.data.merchants : []));
  }, [deferredMerchantSearch, filterOpen]);
  useEffect(() => {
    if (!filterOpen || deferredDocumentSearch.trim().length < 2) return setDocuments([]);
    void api.admin.listPolicies({ search: deferredDocumentSearch.trim(), limit: 10 }).then((r) =>
      setDocuments(r.success && r.data ? r.data.policies : []));
  }, [deferredDocumentSearch, filterOpen]);

  const chips = useMemo(() => {
    const result: Array<{ key: string; label: string; clear: () => void }> = [];
    const addMany = (key: keyof Filters, values: string[], labels: Record<string, string>) => values.forEach((value) =>
      result.push({ key: `${String(key)}-${value}`, label: labels[value] || value, clear: () => {
        setFilters((current) => ({ ...current, [key]: (current[key] as string[]).filter((item) => item !== value) })); setPage(1);
      }}));
    addMany("categories", filters.categories, CATEGORIES); addMany("actions", filters.actions, ACTIONS);
    addMany("roles", filters.roles, {}); addMany("results", filters.results, RESULTS); addMany("sources", filters.sources, {});
    if (filters.merchantId) result.push({ key: "merchant", label: filters.merchantLabel || filters.merchantId, clear: () => { setFilters((v) => ({ ...v, merchantId: "", merchantLabel: "" })); setPage(1); } });
    if (filters.documentId) result.push({ key: "document", label: filters.documentLabel || filters.documentId, clear: () => { setFilters((v) => ({ ...v, documentId: "", documentLabel: "" })); setPage(1); } });
    if (filters.requestId) result.push({ key: "request", label: `Request: ${filters.requestId}`, clear: () => { setFilters((v) => ({ ...v, requestId: "" })); setPage(1); } });
    if (filters.dateFrom || filters.dateTo) result.push({ key: "date", label: filters.dateFrom && filters.dateTo ? `${filters.dateFrom} – ${filters.dateTo}` : filters.dateFrom || filters.dateTo, clear: () => { setFilters((v) => ({ ...v, dateFrom: "", dateTo: "" })); setPage(1); } });
    return result;
  }, [filters]);

  const clearAll = () => { const clean = emptyFilters(); setFilters(clean); setDraft(clean); setSearch(""); setPage(1); };
  const openFilters = () => { setDraft(filters); setMerchantSearch(filters.merchantLabel); setDocumentSearch(filters.documentLabel); setFilterOpen(true); };
  const applyFilters = () => { setFilters(draft); setPage(1); setFilterOpen(false); };
  const exportRows = (count: 10 | 50 | 100 | "all") => loadPagedRows(count, async (exportPage, limit) => {
    const response = await api.admin.listActivityLogs({
      search: deferredSearch || undefined, action: filters.actions.join(",") || undefined,
      category: filters.categories.join(",") || undefined, role: filters.roles.join(",") || undefined,
      result: filters.results.join(",") || undefined, source: filters.sources.join(",") || undefined,
      merchantId: filters.merchantId || undefined, targetId: filters.documentId || undefined,
      requestId: filters.requestId || undefined, dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined, page: exportPage, limit,
    });
    if (!response.success || !response.data) throw new Error(response.error?.message || "ไม่สามารถส่งออก Audit Log ได้");
    return { rows: response.data.logs, total: response.data.pagination.total };
  });

  return <>
    <header className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Evidence ledger</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Audit Explorer</h1>
      <p className="mt-1 text-sm text-slate-500">ค้นหาหลักฐานว่าใครดำเนินการอะไร เมื่อไร และมีผลอย่างไร</p>
    </header>
    <div className="audit-toolbar">
      <label className="audit-search"><Search /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหากิจกรรม ผู้ดำเนินการ เอกสาร หรือ IP..." /></label>
      <button type="button" className="audit-filter-trigger" data-active={activeCount(filters) > 0} onClick={openFilters}>
        <Filter /> ตัวกรอง {activeCount(filters) ? <b>{activeCount(filters)}</b> : null}
      </button>
    </div>
    {chips.length ? <div className="audit-chips">
      {chips.map((chip) => <button key={chip.key} type="button" onClick={chip.clear}>{chip.label}<X /></button>)}
      <button type="button" className="audit-clear" onClick={clearAll}>ล้างทั้งหมด</button>
    </div> : null}
    <div className="audit-ledger-head">
      <div><h2>ลำดับกิจกรรม</h2><p>แสดง {total.toLocaleString("th-TH")} รายการที่ตรงกัน · ใหม่สุดก่อน</p></div>
      <div className="flex items-center gap-2">
        {(filters.dateFrom || filters.dateTo) ? <span><CalendarDays /> ช่วงเวลาที่เลือก</span> : <span><CalendarDays /> ทุกช่วงเวลา</span>}
        <ExportRowsMenu filename="flowpdpa-audit-log" total={total} loadRows={exportRows} columns={[
          { header: "ผู้ดำเนินการ", value: (row) => row.actorEmail || "ระบบ" },
          { header: "บทบาท", value: (row) => row.actorRole || row.actorType || "system" },
          { header: "กิจกรรม", value: (row) => ACTIONS[row.action] || row.action },
          { header: "หมวด", value: (row) => CATEGORIES[row.category || ""] || row.category || "ระบบ" },
          { header: "ประเภทเป้าหมาย", value: (row) => row.targetType },
          { header: "รหัสเป้าหมาย", value: (row) => row.targetId },
          { header: "ผลลัพธ์", value: (row) => row.result || (row.statusCode < 400 ? "success" : "failure") },
          { header: "แหล่งที่มา", value: (row) => row.source },
          { header: "Request ID", value: (row) => row.requestId },
          { header: "IP Address", value: (row) => row.ipAddress },
          { header: "วันที่บันทึก", value: (row) => row.createdAt },
        ]} />
      </div>
    </div>
    <section className="audit-table-shell" aria-busy={loading}>
      {error ? <div className="audit-empty text-red-700">{error}</div> : loading ? <div className="audit-empty">กำลังค้นหาหลักฐาน...</div> : rows.length === 0 ? <div className="audit-empty">ไม่พบกิจกรรมที่ตรงกับตัวกรอง</div> : <div className="audit-table-scroll">
        <table className="audit-table">
          <thead><tr><th>ผู้ดำเนินการ</th><th>กิจกรรม</th><th>หมวด / เป้าหมาย</th><th>ผลลัพธ์</th><th>วันเวลาที่บันทึก</th><th aria-label="รายละเอียด" /></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}>
            <td><strong>{row.actorEmail || "ระบบ"}</strong><small>{row.actorRole || row.actorType || "system"}</small></td>
            <td><strong>{ACTIONS[row.action] || row.action}</strong><small>{row.source || "api"}{row.requestId ? ` · ${row.requestId}` : ""}</small></td>
            <td><span>{CATEGORIES[row.category || ""] || row.category || "ระบบ"}</span><small>{row.targetType || "-"}{row.targetId ? ` · ${row.targetId}` : ""}</small></td>
            <td><span className={`audit-result ${row.result === "failure" || row.statusCode >= 400 ? "failed" : "success"}`}>{row.result || (row.statusCode < 400 ? "success" : "failure")}</span></td>
            <td className="audit-date-cell">{formatDate(row.createdAt)}</td>
            <td><button type="button" className="audit-view" onClick={() => setSelected(row)} aria-label="ดูรายละเอียด"><Eye /></button></td>
          </tr>)}</tbody>
        </table>
      </div>}
      {!loading && pages > 1 ? <footer className="audit-pagination"><span>หน้า {page} จาก {pages}</span><div><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}><ChevronLeft /></button><button disabled={page >= pages} onClick={() => setPage((v) => v + 1)}><ChevronRight /></button></div></footer> : null}
    </section>

    {filterOpen ? <div className="audit-filter-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) setFilterOpen(false); }}>
      <aside className="audit-filter-popover" role="dialog" aria-modal="true" aria-label="ตัวกรอง Audit Explorer">
        <header><div><h2>ตัวกรอง</h2><p>เลือกหลายเงื่อนไขแล้วใช้พร้อมกัน</p></div><button onClick={() => setFilterOpen(false)} aria-label="ปิด"><X /></button></header>
        <div className="audit-filter-body">
          <div className="audit-date-grid"><label>จาก<input type="date" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} /></label><label>ถึง<input type="date" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} /></label></div>
          <ToggleGroup title="หมวดกิจกรรม" values={draft.categories} options={CATEGORIES} onChange={(categories) => setDraft({ ...draft, categories })} />
          <ToggleGroup title="ประเภทเหตุการณ์" values={draft.actions} options={ACTIONS} onChange={(actions) => setDraft({ ...draft, actions })} />
          <ToggleGroup title="บทบาทผู้ดำเนินการ" values={draft.roles} options={Object.fromEntries(ROLES.map((v) => [v, v]))} onChange={(roles) => setDraft({ ...draft, roles })} />
          <ToggleGroup title="ผลลัพธ์" values={draft.results} options={RESULTS} onChange={(results) => setDraft({ ...draft, results })} />
          <div className="audit-filter-group"><label className="audit-field">ผู้ประกอบการ<input value={merchantSearch} onChange={(e) => setMerchantSearch(e.target.value)} placeholder="พิมพ์ชื่อหรืออีเมลอย่างน้อย 2 ตัวอักษร" /></label>{merchants.length ? <div className="audit-suggestions">{merchants.map((m) => <button key={m.id} onClick={() => { setDraft({ ...draft, merchantId: m.id, merchantLabel: `${m.name} · ${m.email}` }); setMerchantSearch(`${m.name} · ${m.email}`); setMerchants([]); }}>{m.name}<small>{m.email}</small></button>)}</div> : null}</div>
          <div className="audit-filter-group"><label className="audit-field">เอกสาร<input value={documentSearch} onChange={(e) => setDocumentSearch(e.target.value)} placeholder="พิมพ์ชื่อเว็บไซต์ นโยบาย หรือ slug" /></label>{documents.length ? <div className="audit-suggestions">{documents.map((d) => <button key={d.id} onClick={() => { setDraft({ ...draft, documentId: d.id, documentLabel: d.websiteName }); setDocumentSearch(d.websiteName); setDocuments([]); }}>{d.websiteName}<small>{d.slug}</small></button>)}</div> : null}</div>
          <ToggleGroup title="แหล่งที่มา" values={draft.sources} options={Object.fromEntries(SOURCES.map((v) => [v, v]))} onChange={(sources) => setDraft({ ...draft, sources })} />
          <label className="audit-field">Request ID<input value={draft.requestId} onChange={(e) => setDraft({ ...draft, requestId: e.target.value })} placeholder="ค้นหา Request ID" /></label>
        </div>
        <footer><button type="button" onClick={() => setDraft(emptyFilters())}>ล้างทั้งหมด</button><button type="button" className="primary" onClick={applyFilters}>ใช้ตัวกรอง {activeCount(draft) ? `(${activeCount(draft)})` : ""}</button></footer>
      </aside>
    </div> : null}

    {selected ? <div className="audit-detail-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><section className="audit-detail" role="dialog" aria-modal="true"><header><div><h2>{ACTIONS[selected.action] || selected.action}</h2><code>{selected.id}</code></div><button onClick={() => setSelected(null)}><X /></button></header><dl>{[
      ["ผู้ดำเนินการ", selected.actorEmail || "ระบบ"], ["บทบาท", selected.actorRole || selected.actorType || "system"], ["หมวด", selected.category || "system"], ["ผลลัพธ์", selected.result || String(selected.statusCode)], ["เป้าหมาย", `${selected.targetType || "-"} · ${selected.targetId || "-"}`], ["Request ID", selected.requestId || "-"], ["แหล่งที่มา", selected.source || "-"], ["IP address", selected.ipAddress || "-"], ["เวลา", formatDate(selected.createdAt)],
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{selected.reason ? <div className="audit-reason"><b>เหตุผล</b><p>{selected.reason}</p></div> : null}</section></div> : null}
  </>;
}
