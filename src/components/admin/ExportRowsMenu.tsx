import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Download, Loader2, X } from "lucide-react";

export type ExportRowCount = 10 | 50 | 100 | "all";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

interface ExportRowsMenuProps<T> {
  filename: string;
  columns: ExportColumn<T>[];
  loadRows: (count: ExportRowCount) => Promise<T[]>;
  total?: number;
  label?: string;
}

const OPTIONS: Array<{ value: ExportRowCount; label: string }> = [
  { value: 10, label: "10 รายการ" },
  { value: 50, label: "50 รายการ" },
  { value: 100, label: "100 รายการ" },
  { value: "all", label: "ทั้งหมด" },
];

const csvCell = (value: unknown) => {
  const text = value == null
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCsv = <T,>(filename: string, columns: ExportColumn<T>[], rows: T[]) => {
  const content = [
    columns.map((column) => csvCell(column.header)).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(",")),
  ].join("\r\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export function ExportRowsMenu<T>({
  filename,
  columns,
  loadRows,
  total,
  label = "ส่งออก CSV",
}: ExportRowsMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<ExportRowCount>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await loadRows(count);
      downloadCsv(filename, columns, rows);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ไม่สามารถส่งออกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-rows" ref={rootRef}>
      <button
        type="button"
        className="portal-button export-rows-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Download className="h-4 w-4" />
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <section className="export-rows-popover" role="dialog" aria-label="เลือกจำนวนรายการที่จะส่งออก">
          <header>
            <div>
              <strong>จำนวนรายการ</strong>
              <small>{typeof total === "number" ? `พบ ${total.toLocaleString("th-TH")} รายการ` : "ใช้ตัวกรองปัจจุบัน"}</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="ปิด"><X /></button>
          </header>
          <div className="export-rows-options">
            {OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                data-active={count === option.value}
                onClick={() => setCount(option.value)}
              >
                <span>{option.label}</span>
                {count === option.value ? <Check /> : null}
              </button>
            ))}
          </div>
          {error ? <p className="export-rows-error">{error}</p> : null}
          <button type="button" className="export-rows-submit" onClick={() => void run()} disabled={loading || total === 0}>
            {loading ? <Loader2 className="animate-spin" /> : <Download />}
            {loading ? "กำลังเตรียมไฟล์..." : "ดาวน์โหลด CSV"}
          </button>
        </section>
      ) : null}
    </div>
  );
}

export async function loadPagedRows<T>(
  count: ExportRowCount,
  fetchPage: (page: number, limit: number) => Promise<{ rows: T[]; total: number }>,
) {
  const wanted = count === "all" ? Number.POSITIVE_INFINITY : count;
  const batchSize = count === "all" ? 200 : Math.min(200, count);
  const output: T[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while (output.length < wanted && output.length < total) {
    const result = await fetchPage(page, batchSize);
    total = result.total;
    output.push(...result.rows);
    if (result.rows.length === 0) break;
    page += 1;
  }
  return output.slice(0, wanted);
}
