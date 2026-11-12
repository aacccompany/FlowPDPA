import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Filter, Search, X } from "lucide-react";

import { api } from "@/services/api";
import type { AdminMerchant, AdminMerchantActivity, AdminPolicy } from "@/services/api";
import { ExportRowsMenu, loadPagedRows } from "@/components/admin/ExportRowsMenu";

const TYPES: Record<string, string> = {
  "document.acknowledged": "รับทราบเอกสารแล้ว",
  "document.acknowledgement_dismissed": "ปิดข้อความโดยไม่รับทราบ",
  document_acknowledged: "รับทราบเอกสารแล้ว",
  document_acknowledgement_dismissed: "ปิดข้อความโดยไม่รับทราบ",
  merchant_submitted_to_legal: "ลูกค้าส่งให้ฝ่ายกฎหมาย",
  legal_submitted_to_admin: "ฝ่ายกฎหมายส่งให้ Admin",
  admin_changes_requested: "Admin ส่งกลับแก้ไข",
  admin_approved: "Admin อนุมัติและส่งลูกค้า",
  customer_consent: "ลูกค้าให้ความยินยอม",
  merchant_change_requested: "คำขอแก้ไขจากลูกค้า",
  legal_document_updated: "ฝ่ายกฎหมายแก้ไขเอกสาร",
  consent_granted: "ให้ความยินยอม",
  consent_rejected: "ปฏิเสธความยินยอม",
  consent_withdrawn: "ถอนความยินยอม",
};
const KINDS: Record<string, string> = { policy: "เอกสารนโยบาย", consent: "ความยินยอม" };
const RELATED_FIELDS: Record<string, string> = {
  document: "เอกสารสาธารณะ",
  policy: "นโยบาย",
  consent: "ความยินยอม",
};
const DESCRIPTIONS: Record<string, string> = {
  "Customer dismissed the document acknowledgement prompt without acknowledging.": "ลูกค้าปิดข้อความแจ้งเตือนโดยไม่ได้กดยืนยันการรับทราบเอกสาร",
  "Customer acknowledged reviewing the public document.": "ลูกค้ายืนยันว่าได้อ่านและรับทราบเอกสารสาธารณะแล้ว",
  "Admin approved Legal's revision and released the final document to the merchant.": "Admin อนุมัติฉบับแก้ไขจากฝ่ายกฎหมายและส่งเอกสารฉบับสมบูรณ์ให้ลูกค้าแล้ว",
  "Legal completed the revision and submitted it to Admin for final review.": "ฝ่ายกฎหมายแก้ไขเอกสารเสร็จและส่งให้ Admin ตรวจสอบขั้นสุดท้าย",
  "Legal completed a requested revision and submitted it to Admin for final review.": "ฝ่ายกฎหมายดำเนินการแก้ไขตามคำขอและส่งให้ Admin ตรวจสอบขั้นสุดท้าย",
  "Admin returned Legal's revision with required changes.": "Admin ส่งเอกสารกลับให้ฝ่ายกฎหมายแก้ไขเพิ่มเติม",
  "Merchant submitted the policy to Legal for review.": "ลูกค้าส่งนโยบายให้ฝ่ายกฎหมายตรวจสอบ",
};
const thaiDescription = (value: string) => DESCRIPTIONS[value] || value;
const thaiPolicyName = (value: string) => value
  .replace(/Privacy \+ Cookies Policy/gi, "นโยบายความเป็นส่วนตัวและคุกกี้")
  .replace(/Privacy Policy/gi, "นโยบายความเป็นส่วนตัว");
const relatedLabel = (row: AdminMerchantActivity) => RELATED_FIELDS[row.relatedField || ""] || RELATED_FIELDS[row.relatedType] || row.relatedField || row.relatedType;
const PAGE_SIZE = 20;
type Filters = { types: string[]; kinds: string[]; merchantId: string; merchantLabel: string; policyId: string; policyLabel: string; dateFrom: string; dateTo: string };
const emptyFilters = (): Filters => ({ types: [], kinds: [], merchantId: "", merchantLabel: "", policyId: "", policyLabel: "", dateFrom: "", dateTo: "" });
const split = (value: string | null) => value?.split(",").filter(Boolean) ?? [];
const fromParams = (params: URLSearchParams): Filters => ({
  types: split(params.get("merchantTypes")), kinds: split(params.get("merchantKinds")),
  merchantId: params.get("merchantOwner") ?? "", merchantLabel: params.get("merchantOwnerLabel") ?? "",
  policyId: params.get("merchantPolicy") ?? "", policyLabel: params.get("merchantPolicyLabel") ?? "",
  dateFrom: params.get("merchantFrom") ?? "", dateTo: params.get("merchantTo") ?? "",
});
const countFilters = (value: Filters) => [value.types.length, value.kinds.length, value.merchantId, value.policyId, value.dateFrom || value.dateTo].filter(Boolean).length;
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

function Checks({ title, options, values, onChange }: { title: string; options: Record<string, string>; values: string[]; onChange: (value: string[]) => void }) {
  return <fieldset className="audit-filter-group"><legend>{title}</legend><div className="audit-check-grid">{Object.entries(options).map(([value, label]) => <label key={value}><input type="checkbox" checked={values.includes(value)} onChange={() => onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])} /><span>{label}</span></label>)}</div></fieldset>;
}

export function MerchantActivityExplorer() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => fromParams(params));
  const [draft, setDraft] = useState(() => fromParams(params));
  const [search, setSearch] = useState(() => params.get("merchantSearch") ?? "");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(() => Number(params.get("merchantPage")) || 1);
  const [rows, setRows] = useState<AdminMerchantActivity[]>([]);
  const [total, setTotal] = useState(0); const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [open, setOpen] = useState(false); const [selected, setSelected] = useState<AdminMerchantActivity | null>(null);
  const [merchantSearch, setMerchantSearch] = useState(""); const [policySearch, setPolicySearch] = useState("");
  const deferredMerchantSearch = useDeferredValue(merchantSearch); const deferredPolicySearch = useDeferredValue(policySearch);
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]); const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const requestSequence = useRef(0);

  useEffect(() => {
    const next = new URLSearchParams(params); const put = (key: string, value: string) => value ? next.set(key, value) : next.delete(key);
    put("merchantSearch", search); put("merchantPage", page > 1 ? String(page) : ""); put("merchantTypes", filters.types.join(",")); put("merchantKinds", filters.kinds.join(","));
    put("merchantOwner", filters.merchantId); put("merchantOwnerLabel", filters.merchantLabel); put("merchantPolicy", filters.policyId); put("merchantPolicyLabel", filters.policyLabel); put("merchantFrom", filters.dateFrom); put("merchantTo", filters.dateTo);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, search, page, setParams]);

  useEffect(() => {
    const sequence = ++requestSequence.current; setLoading(true); setError("");
    void api.admin.listMerchantActivity({ search: deferredSearch || undefined, type: filters.types.join(",") || undefined, kind: filters.kinds.length === 1 ? filters.kinds[0] : undefined, merchantId: filters.merchantId || undefined, policyId: filters.policyId || undefined, dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined, page, limit: PAGE_SIZE }).then((response) => {
      if (sequence !== requestSequence.current) return;
      if (response.success && response.data) { setRows(response.data.logs); setTotal(response.data.pagination.total); setPages(Math.max(1, response.data.pagination.pages ?? Math.ceil(response.data.pagination.total / PAGE_SIZE))); }
      else setError(response.error?.message || "ไม่สามารถโหลดกิจกรรมผู้ประกอบการได้"); setLoading(false);
    });
  }, [deferredSearch, filters, page]);

  useEffect(() => { if (!open || deferredMerchantSearch.trim().length < 2) return setMerchants([]); void api.admin.listMerchants({ search: deferredMerchantSearch.trim(), limit: 10 }).then((r) => setMerchants(r.success && r.data ? r.data.merchants : [])); }, [deferredMerchantSearch, open]);
  useEffect(() => { if (!open || deferredPolicySearch.trim().length < 2) return setPolicies([]); void api.admin.listPolicies({ search: deferredPolicySearch.trim(), merchantId: draft.merchantId || undefined, limit: 10 }).then((r) => setPolicies(r.success && r.data ? r.data.policies : [])); }, [deferredPolicySearch, draft.merchantId, open]);

  const chips = useMemo(() => {
    const values: Array<{ key: string; label: string; clear: () => void }> = [];
    filters.types.forEach((type) => values.push({ key: type, label: TYPES[type] || type, clear: () => { setFilters((v) => ({ ...v, types: v.types.filter((item) => item !== type) })); setPage(1); } }));
    filters.kinds.forEach((kind) => values.push({ key: kind, label: KINDS[kind] || kind, clear: () => { setFilters((v) => ({ ...v, kinds: v.kinds.filter((item) => item !== kind) })); setPage(1); } }));
    if (filters.merchantId) values.push({ key: "owner", label: filters.merchantLabel || filters.merchantId, clear: () => { setFilters((v) => ({ ...v, merchantId: "", merchantLabel: "" })); setPage(1); } });
    if (filters.policyId) values.push({ key: "policy", label: filters.policyLabel || filters.policyId, clear: () => { setFilters((v) => ({ ...v, policyId: "", policyLabel: "" })); setPage(1); } });
    if (filters.dateFrom || filters.dateTo) values.push({ key: "date", label: `${filters.dateFrom || "…"} – ${filters.dateTo || "…"}`, clear: () => { setFilters((v) => ({ ...v, dateFrom: "", dateTo: "" })); setPage(1); } });
    return values;
  }, [filters]);
  const clearAll = () => { const clean = emptyFilters(); setFilters(clean); setDraft(clean); setSearch(""); setPage(1); };
  const openFilters = () => { setDraft(filters); setMerchantSearch(filters.merchantLabel); setPolicySearch(filters.policyLabel); setOpen(true); };
  const exportRows = (count: 10 | 50 | 100 | "all") => loadPagedRows(count, async (exportPage, limit) => {
    const response = await api.admin.listMerchantActivity({ search: deferredSearch || undefined, type: filters.types.join(",") || undefined, kind: filters.kinds.length === 1 ? filters.kinds[0] : undefined, merchantId: filters.merchantId || undefined, policyId: filters.policyId || undefined, dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined, page: exportPage, limit });
    if (!response.success || !response.data) throw new Error(response.error?.message || "ไม่สามารถส่งออกกิจกรรมผู้ประกอบการได้");
    return { rows: response.data.logs, total: response.data.pagination.total };
  });

  return <>
    <header className="mb-5"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">ประวัติทางธุรกิจ</p><h1 className="mt-2 text-2xl font-bold text-slate-900">กิจกรรมผู้ประกอบการ</h1><p className="mt-1 text-sm text-slate-500">ติดตามการรับทราบ ความยินยอม และขั้นตอนการดำเนินงานของเอกสาร</p></header>
    <div className="audit-toolbar"><label className="audit-search"><Search /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหาผู้ประกอบการ อีเมล นโยบาย หรือรายละเอียด..." /></label><button className="audit-filter-trigger" data-active={countFilters(filters) > 0} onClick={openFilters}><Filter /> ตัวกรอง {countFilters(filters) ? <b>{countFilters(filters)}</b> : null}</button></div>
    {chips.length ? <div className="audit-chips">{chips.map((chip) => <button key={chip.key} onClick={chip.clear}>{chip.label}<X /></button>)}<button className="audit-clear" onClick={clearAll}>ล้างทั้งหมด</button></div> : null}
    <div className="audit-ledger-head"><div><h2>รายการกิจกรรม</h2><p>แสดง {total.toLocaleString("th-TH")} รายการที่ตรงกัน · ใหม่สุดก่อน</p></div><ExportRowsMenu filename="flowpdpa-merchant-activity" total={total} loadRows={exportRows} columns={[
      { header: "ผู้ประกอบการ", value: (row) => row.merchantName }, { header: "อีเมล", value: (row) => row.merchantEmail },
      { header: "ประเภท", value: (row) => TYPES[row.type] || row.type }, { header: "นโยบาย", value: (row) => thaiPolicyName(row.policyName) },
      { header: "Slug", value: (row) => row.policySlug }, { header: "ข้อมูลที่เกี่ยวข้อง", value: relatedLabel },
      { header: "รายละเอียด", value: (row) => thaiDescription(row.description) }, { header: "วันที่บันทึก", value: (row) => row.createdAt },
    ]} /></div>
    <section className="portal-panel">{error ? <div className="portal-empty text-red-700">{error}</div> : loading ? <div className="portal-empty">กำลังโหลดกิจกรรมผู้ประกอบการ...</div> : rows.length === 0 ? <div className="portal-empty">ไม่พบกิจกรรมที่ตรงกับตัวกรอง</div> : <><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>ผู้ประกอบการ</th><th>ประเภท</th><th>นโยบาย</th><th>ข้อมูลที่เกี่ยวข้อง</th><th>รายละเอียด</th><th>วันที่บันทึก</th><th>หลักฐาน</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.kind}-${row.id}`}><td><p className="font-semibold">{row.merchantName}</p><p className="text-xs text-gray-400">{row.merchantEmail}</p></td><td><span className="portal-badge" style={{ color: "#087a5b", background: "#e8f4ef" }}>{TYPES[row.type] || row.type}</span></td><td><p className="font-semibold">{thaiPolicyName(row.policyName)}</p><p className="text-xs text-gray-400">{row.policySlug}</p></td><td>{relatedLabel(row)}</td><td className="min-w-64">{thaiDescription(row.description)}</td><td>{formatDate(row.createdAt)}</td><td><button className="portal-button" onClick={() => setSelected(row)}><Eye className="h-3.5 w-3.5" /> รายละเอียด</button></td></tr>)}</tbody></table></div>{pages > 1 ? <footer className="audit-pagination"><span>หน้า {page} จาก {pages}</span><div><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}><ChevronLeft /></button><button disabled={page >= pages} onClick={() => setPage((v) => v + 1)}><ChevronRight /></button></div></footer> : null}</>}</section>
    {open ? <div className="audit-filter-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}><aside className="audit-filter-popover" role="dialog" aria-modal="true"><header><div><h2>ตัวกรองกิจกรรม</h2><p>เลือกเงื่อนไขแล้วใช้พร้อมกัน</p></div><button onClick={() => setOpen(false)}><X /></button></header><div className="audit-filter-body"><div className="audit-date-grid"><label>จาก<input type="date" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} /></label><label>ถึง<input type="date" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} /></label></div><Checks title="กลุ่มหลักฐาน" options={KINDS} values={draft.kinds} onChange={(kinds) => setDraft({ ...draft, kinds })} /><Checks title="ประเภทกิจกรรม" options={TYPES} values={draft.types} onChange={(types) => setDraft({ ...draft, types })} />
      <div className="audit-filter-group"><label className="audit-field">ผู้ประกอบการ<input value={merchantSearch} onChange={(e) => setMerchantSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" /></label>{merchants.length ? <div className="audit-suggestions">{merchants.map((m) => <button key={m.id} onClick={() => { setDraft({ ...draft, merchantId: m.id, merchantLabel: `${m.name} · ${m.email}`, policyId: "", policyLabel: "" }); setMerchantSearch(`${m.name} · ${m.email}`); setMerchants([]); }}>{m.name}<small>{m.email}</small></button>)}</div> : null}</div>
      <div className="audit-filter-group"><label className="audit-field">นโยบาย<input value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} placeholder="ค้นหาชื่อเว็บไซต์หรือนโยบาย" /></label>{policies.length ? <div className="audit-suggestions">{policies.map((p) => <button key={p.id} onClick={() => { setDraft({ ...draft, policyId: p.id, policyLabel: p.websiteName }); setPolicySearch(p.websiteName); setPolicies([]); }}>{p.websiteName}<small>{p.slug}</small></button>)}</div> : null}</div>
    </div><footer><button onClick={() => setDraft(emptyFilters())}>ล้างทั้งหมด</button><button className="primary" onClick={() => { setFilters(draft); setPage(1); setOpen(false); }}>ใช้ตัวกรอง {countFilters(draft) ? `(${countFilters(draft)})` : ""}</button></footer></aside></div> : null}
    {selected ? <div className="audit-detail-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><section className="audit-detail" role="dialog" aria-modal="true"><header><div><h2>{TYPES[selected.type] || selected.type}</h2><code>{selected.id}</code></div><button onClick={() => setSelected(null)}><X /></button></header><dl>{[["ผู้ประกอบการ", `${selected.merchantName} · ${selected.merchantEmail}`], ["กลุ่มหลักฐาน", KINDS[selected.kind]], ["นโยบาย", `${thaiPolicyName(selected.policyName)} · ${selected.policySlug}`], ["ข้อมูลที่เกี่ยวข้อง", relatedLabel(selected)], ["วันที่และเวลา", formatDate(selected.createdAt)], ["รายละเอียด", thaiDescription(selected.description)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><pre className="mx-5 mb-5 max-h-72 overflow-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(selected.evidence || {}, null, 2)}</pre></section></div> : null}
  </>;
}
