import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { api } from "@/services/api";
import type {
  ConsentField,
  ConsentForm,
  ConsentRecord,
  DocumentTemplate,
  SavedPolicy,
} from "@/services/api";

const consentStatusLabel: Record<ConsentRecord["status"], string> = {
  active: "ใช้งานอยู่",
  rejected: "ปฏิเสธ",
  withdrawn: "ถอนความยินยอม",
};

export default function ConsentManagement() {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [policies, setPolicies] = useState<SavedPolicy[]>([]);
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingForm, setEditingForm] = useState<ConsentForm | null>(null);
  const [createStep, setCreateStep] = useState<"choice" | "editor">("choice");
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    policyId: "",
    name: "",
    description: "",
    purposes: "",
    fields: [] as ConsentField[],
  });

  const loadRecords = (page = 1, nextStatus = status, nextSearch = search) =>
    void api.consents
      .listRecords({ page, limit: 10, status: nextStatus, search: nextSearch })
      .then((response) => {
        if (response.success && response.data) {
          setRecords(response.data.records);
          setPagination(response.data.pagination);
        } else
          setError(
            response.error?.message || "ไม่สามารถโหลดรายการความยินยอมได้",
          );
      });

  useEffect(() => {
    void Promise.all([
      api.consents.listForms(),
      api.policies.list(),
      api.consents.listRecords({ page: 1, limit: 10 }),
      api.templates.list(),
    ]).then(
      ([
        formsResponse,
        policiesResponse,
        recordsResponse,
        templatesResponse,
      ]) => {
        if (formsResponse.success && formsResponse.data)
          setForms(formsResponse.data);
        if (policiesResponse.success && policiesResponse.data)
          setPolicies(policiesResponse.data);
        if (recordsResponse.success && recordsResponse.data) {
          setRecords(recordsResponse.data.records);
          setPagination(recordsResponse.data.pagination);
        }
        if (templatesResponse.success && templatesResponse.data) {
          setTemplates(templatesResponse.data);
          const lastUsed =
            window.localStorage.getItem("flowpdpa:last-consent-template") || "";
          setSelectedTemplateId(
            templatesResponse.data.some((item) => item.id === lastUsed)
              ? lastUsed
              : templatesResponse.data[0]?.id || "",
          );
        }
      },
    );
  }, []);

  const create = async () => {
    const labels = draft.purposes
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!draft.policyId || !draft.name || labels.length === 0) {
      setError(
        "กรุณาเลือกนโยบาย ระบุชื่อแบบฟอร์ม และเพิ่มวัตถุประสงค์อย่างน้อย 1 รายการ",
      );
      return;
    }
    const payload = {
      policyId: draft.policyId,
      name: draft.name,
      description: draft.description,
      purposes: labels.map((label, index) => ({
        id: `purpose-${index + 1}`,
        label,
        required: false,
      })),
      fields: draft.fields,
      templateId: selectedTemplateId || undefined,
    };
    const response = editingForm
      ? await api.consents.updateForm(editingForm.id, payload)
      : await api.consents.createForm(payload);
    if (!response.success || !response.data) {
      setError(
        response.error?.message || "ไม่สามารถสร้างแบบฟอร์มความยินยอมได้",
      );
      return;
    }
    setForms((current) =>
      editingForm
        ? current.map((form) =>
            form.id === editingForm.id ? response.data! : form,
          )
        : [response.data!, ...current],
    );
    setCreating(false);
    if (selectedTemplateId)
      window.localStorage.setItem(
        "flowpdpa:last-consent-template",
        selectedTemplateId,
      );
    setDraft({
      policyId: "",
      name: "",
      description: "",
      purposes: "",
      fields: [],
    });
    setError("");
    setEditingForm(null);
  };

  const openCreate = () => {
    setEditingForm(null);
    setCreateStep("choice");
    setCreating(true);
    setError("");
  };
  const openEdit = (form: ConsentForm) => {
    setEditingForm(form);
    setSelectedTemplateId(form.templateId || "");
    setDraft({
      policyId: form.policyId,
      name: form.name,
      description: form.description || "",
      purposes: form.purposes.map((purpose) => purpose.label).join("\n"),
      fields: form.fields || [],
    });
    setCreateStep("editor");
    setCreating(true);
    setError("");
  };
  const toggleForm = async (form: ConsentForm) => {
    const response = await api.consents.updateForm(form.id, {
      status: form.status === "active" ? "inactive" : "active",
    });
    if (response.success && response.data)
      setForms((current) =>
        current.map((item) => (item.id === form.id ? response.data! : item)),
      );
    else
      setError(response.error?.message || "ไม่สามารถเปลี่ยนสถานะแบบฟอร์มได้");
  };
  const startBlank = () => {
    setSelectedTemplateId("");
    setDraft({
      policyId: "",
      name: "",
      description: "",
      purposes: "",
      fields: [],
    });
    setCreateStep("editor");
  };
  const startFromTemplate = () => {
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) {
      setError("กรุณาเลือกเทมเพลต");
      return;
    }
    setDraft({
      policyId: "",
      name: template.title,
      description: template.purpose,
      purposes: "",
      fields: template.fields || [],
    });
    setCreateStep("editor");
  };

  const withdraw = async (record: ConsentRecord) => {
    const response = await api.consents.withdraw(record.id);
    if (response.success && response.data)
      setRecords((current) =>
        current.map((item) => (item.id === record.id ? response.data! : item)),
      );
    else setError(response.error?.message || "ไม่สามารถถอนความยินยอมได้");
  };

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase text-emerald-700">
            ทะเบียนความยินยอม
          </p>
          <h1 className="text-xl font-black text-gray-900">จัดการความยินยอม</h1>
          <p className="mt-1 text-sm text-gray-400">
            สร้างแบบฟอร์มตามวัตถุประสงค์ และตรวจสอบหลักฐานจากนโยบายของคุณ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-green flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          สร้างแบบฟอร์มความยินยอม
        </button>
      </header>
      {error && (
        <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "แบบฟอร์ม", value: forms.length },
          { label: "รายการความยินยอม", value: pagination.total },
          {
            label: "ใช้งานอยู่ในหน้านี้",
            value: records.filter((row) => row.status === "active").length,
          },
        ].map((item) => (
          <div key={item.label} className="border border-gray-100 bg-white p-4">
            <p className="font-mono text-2xl font-semibold text-gray-900">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-gray-500">{item.label}</p>
          </div>
        ))}
      </section>
      <section className="mb-5 border border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold">แบบฟอร์มที่ใช้งานอยู่</h2>
        </div>
        {forms.length === 0 ? (
          <p className="p-6 text-center text-xs text-gray-400">
            สร้างแบบฟอร์มเพื่อเพิ่มตัวเลือกความยินยอมในลิงก์นโยบายที่อนุมัติแล้ว
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {forms.map((form) => (
              <div
                key={form.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{form.name}</p>
                  <p className="text-xs text-gray-400">
                    {form.purposes.length} วัตถุประสงค์ · เวอร์ชัน{" "}
                    {form.version}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${form.status === "active" ? "text-emerald-700" : "text-gray-400"}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {form.status === "active" ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(form)}
                    className="border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    แก้ไข / ย้ายนโยบาย
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleForm(form)}
                    className={`border px-3 py-1.5 text-xs font-semibold ${form.status === "active" ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"}`}
                  >
                    {form.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") loadRecords(1, status, search);
            }}
            className="h-9 w-full border border-gray-300 pl-9 pr-3 text-sm"
            placeholder="ค้นหาอีเมล ชื่อ หรือเลขอ้างอิง"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            loadRecords(1, event.target.value, search);
          }}
          className="h-9 border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="">ทุกสถานะ</option>
          <option value="active">ใช้งานอยู่</option>
          <option value="rejected">ปฏิเสธ</option>
          <option value="withdrawn">ถอนความยินยอม</option>
        </select>
        <button
          onClick={() => loadRecords(1)}
          className="h-9 border border-gray-300 px-4 text-xs font-semibold"
        >
          ค้นหา
        </button>
      </div>
      <section className="overflow-hidden border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">เจ้าของข้อมูล</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ตัวเลือก</th>
                <th className="px-4 py-3">วันที่บันทึก</th>
                <th className="px-4 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {record.subjectName || "เจ้าของข้อมูล"}
                    </p>
                    <p className="text-gray-400">{record.subjectEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {consentStatusLabel[record.status]}
                  </td>
                  <td className="px-4 py-3">
                    ยอมรับ{" "}
                    {Object.values(record.choices).filter(Boolean).length}/
                    {Object.keys(record.choices).length} รายการ
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(record.createdAt).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-3">
                    {record.status === "active" && (
                      <button
                        onClick={() => void withdraw(record)}
                        className="text-xs font-semibold text-red-700"
                      >
                        ถอนความยินยอม
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            ทั้งหมด {pagination.total} รายการ
          </p>
          <div className="flex gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadRecords(pagination.page - 1)}
              className="grid h-8 w-8 place-items-center border disabled:opacity-40"
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="grid h-8 min-w-10 place-items-center text-xs">
              {pagination.page}/{pagination.pages}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => loadRecords(pagination.page + 1)}
              className="grid h-8 w-8 place-items-center border disabled:opacity-40"
              aria-label="หน้าถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>
      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold">
                {editingForm
                  ? "แก้ไขแบบฟอร์มความยินยอม"
                  : "สร้างแบบฟอร์มความยินยอม"}
              </h2>
              <button
                onClick={() => {
                  setCreating(false);
                  setEditingForm(null);
                }}
                aria-label="ปิด"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {createStep === "choice" ? (
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="font-bold text-gray-900">
                    ต้องการเริ่มแบบไหน?
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    ระบบเลือกเทมเพลตที่ใช้ล่าสุดไว้ให้โดยอัตโนมัติ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startBlank}
                  className="w-full border border-gray-200 p-4 text-left hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <span className="block text-sm font-bold">
                    สร้างแบบฟอร์มใหม่
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    เริ่มจากแบบฟอร์มว่างและกำหนดข้อมูลเอง
                  </span>
                </button>
                <div className="border border-emerald-200 bg-emerald-50/40 p-4">
                  <p className="text-sm font-bold">ใช้เทมเพลต</p>
                  <select
                    value={selectedTemplateId}
                    onChange={(event) =>
                      setSelectedTemplateId(event.target.value)
                    }
                    className="mt-3 h-10 w-full border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">เลือกเทมเพลต</option>
                    {templates
                      .filter(
                        (template) =>
                          template.category === "consent-form" ||
                          template.fields.length > 0,
                      )
                      .map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.title}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedTemplateId}
                    onClick={startFromTemplate}
                    className="btn-green mt-3 h-10 w-full text-sm disabled:opacity-50"
                  >
                    ใช้เทมเพลตนี้
                  </button>
                  {templates.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      ยังไม่มีเทมเพลตจากผู้ดูแลระบบ กรุณาสร้างแบบฟอร์มใหม่
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <label className="block text-xs font-semibold">
                  นโยบาย
                  <select
                    value={draft.policyId}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        policyId: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-10 w-full border px-3 text-sm"
                  >
                    <option value="">เลือกนโยบายของคุณ</option>
                    {policies.map((policy) => {
                      const alreadyUsed = forms.some(
                        (form) =>
                          form.policyId === policy.id &&
                          form.id !== editingForm?.id,
                      );
                      return (
                        <option
                          key={policy.id}
                          value={policy.id}
                          disabled={alreadyUsed}
                        >
                          {policy.typeName} · {policy.websiteName}
                          {alreadyUsed ? " — มีแบบฟอร์มแล้ว" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {policies.length === 0 ? (
                    <span className="mt-2 block text-xs font-normal text-amber-700">
                      ยังไม่มีนโยบายในบัญชี กรุณาสร้างนโยบายก่อน
                    </span>
                  ) : policies.every((policy) =>
                      forms.some(
                        (form) =>
                          form.policyId === policy.id &&
                          form.id !== editingForm?.id,
                      ),
                    ) ? (
                    <span className="mt-2 block text-xs font-normal text-amber-700">
                      นโยบายทั้งหมดมีแบบฟอร์มความยินยอมแล้ว ระบบรองรับ 1
                      แบบฟอร์มต่อนโยบาย
                    </span>
                  ) : null}
                </label>
                <label className="block text-xs font-semibold">
                  ชื่อแบบฟอร์ม
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-10 w-full border px-3 text-sm"
                  />
                </label>
                <label className="block text-xs font-semibold">
                  คำอธิบาย
                  <textarea
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="mt-1.5 min-h-20 w-full border p-3 text-sm"
                  />
                </label>
                <label className="block text-xs font-semibold">
                  วัตถุประสงค์เพิ่มเติม — 1 รายการต่อบรรทัด
                  <textarea
                    value={draft.purposes}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        purposes: event.target.value,
                      }))
                    }
                    className="mt-1.5 min-h-28 w-full border p-3 text-sm"
                    placeholder={"รับข่าวสารทางอีเมล\nคุกกี้วิเคราะห์การใช้งาน"}
                  />
                </label>
                <p className="border-l-2 border-amber-500 pl-3 text-xs text-gray-500">
                  ไม่ควรใช้ความยินยอมกับการประมวลผลที่ลูกค้าไม่สามารถปฏิเสธได้อย่างแท้จริง
                </p>
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        ฟิลด์ข้อมูลเพิ่มเติม ({draft.fields.length})
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        เพิ่มหรือแก้ไขช่องกรอกข้อมูลของลูกค้า
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          fields: [
                            ...current.fields,
                            {
                              id: `field-${Date.now()}`,
                              type: "text",
                              label: "ฟิลด์ใหม่",
                              placeholder: "",
                              required: false,
                              options: [],
                            },
                          ],
                        }))
                      }
                      className="border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
                    >
                      + เพิ่มฟิลด์
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {draft.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid gap-2 border bg-white p-2 sm:grid-cols-12"
                      >
                        <input
                          aria-label="ชื่อฟิลด์"
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
                          className="h-9 border px-2 text-xs sm:col-span-4"
                        />
                        <select
                          aria-label="ประเภทฟิลด์"
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
                          className="h-9 border px-2 text-xs sm:col-span-3"
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
                          aria-label="ข้อความตัวอย่างหรือตัวเลือก"
                          value={
                            field.type === "select"
                              ? field.options.join(", ")
                              : field.placeholder || ""
                          }
                          placeholder={
                            field.type === "select"
                              ? "ตัวเลือก A, ตัวเลือก B"
                              : "ข้อความตัวอย่าง"
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
                                    : {
                                        ...item,
                                        placeholder: event.target.value,
                                      }
                                  : item,
                              ),
                            }))
                          }
                          className="h-9 border px-2 text-xs sm:col-span-3"
                        />
                        <label className="flex items-center gap-1 text-[11px] sm:col-span-1">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                fields: current.fields.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        required: event.target.checked,
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                          บังคับ
                        </label>
                        <button
                          type="button"
                          aria-label="ลบฟิลด์"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              fields: current.fields.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                          className="text-red-600"
                        >
                          <X className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => void create()}
                  disabled={!draft.policyId}
                  className="btn-green h-10 w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingForm ? "บันทึกการแก้ไข" : "สร้างแบบฟอร์ม"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
