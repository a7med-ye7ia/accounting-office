import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle, ArrowRight, BookOpen, BriefcaseBusiness, Building2, Calculator,
  CheckCircle2, ChevronDown, FileText, GripVertical, Info, Landmark, Pencil,
  Plus, Search, ShieldCheck, Trash2, X
} from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { createGuide, deleteGuide, fetchAdminGuides, fetchGuide, fetchGuides, updateGuide } from "../../../api/guides";
import { getApiErrorMessage } from "../../../utils/apiError";

const COLORS = ["#2b5bb5", "#0f766e", "#9333a3", "#b45309", "#be123c", "#475569"];
const GUIDE_ICONS = [
  { name: "BookOpen", label: "دليل عام", Icon: BookOpen },
  { name: "Landmark", label: "جهة حكومية", Icon: Landmark },
  { name: "Building2", label: "شركة", Icon: Building2 },
  { name: "FileText", label: "مستندات", Icon: FileText },
  { name: "Calculator", label: "محاسبة", Icon: Calculator },
  { name: "BriefcaseBusiness", label: "أعمال", Icon: BriefcaseBusiness },
  { name: "ShieldCheck", label: "إجراءات", Icon: ShieldCheck },
];
const EMPTY_STEP = { title: "", description: "", note: "", entityName: "" };
const EMPTY_GUIDE = { title: "", category: "", description: "", icon: "BookOpen", color: COLORS[0], status: "draft", steps: [{ ...EMPTY_STEP }] };

function canManage() {
  const role = String(JSON.parse(localStorage.getItem("user") || "{}")?.roleName || "").toLowerCase().replace(/[\s_]/g, "");
  return ["owner", "headbranch", "headdepartment", "headofdepartment", "departmenthead"].includes(role);
}

function renderGuideIcon(name, props = {}) {
  const icon = GUIDE_ICONS.find((item) => item.name === name)?.Icon || BookOpen;
  return createElement(icon, props);
}

function GuideCard({ guide, admin = false, onDelete }) {
  const color = guide.color || COLORS[0];
  return (
    <div className="group relative flex flex-col rounded-3xl border border-appBorder bg-appSurface p-5 shadow-panel ui-transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-raise" style={{ borderTopColor: color }}>
      <Link to={admin ? `/EmployeeGuide/admin/${guide.id}` : `/EmployeeGuide/${guide.id}`} className="flex flex-1 flex-col">
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ color, backgroundColor: `${color}18` }}>{renderGuideIcon(guide.icon, { size: 27, strokeWidth: 1.8 })}</span>
          {admin && <span className={`rounded-full px-3 py-1 text-xs font-bold ${guide.status === "published" ? "bg-success/15 text-success" : "bg-badgeGrayBg text-badgeGrayText"}`}>{guide.status === "published" ? "منشور" : "مسودة"}</span>}
        </div>
        <span className="mb-2 text-xs font-bold" style={{ color }}>{guide.category}</span>
        <h3 className="mb-2 text-lg font-extrabold text-appText">{guide.title}</h3>
        <p className="line-clamp-2 text-sm leading-7 text-appSubtext">{guide.description || "دليل إجرائي لمساعدتك على إنجاز المهمة بسهولة."}</p>
        <div className="mt-auto flex items-center justify-between border-t border-appBorder pt-4"><span className="text-xs text-appSubtext">{guide.steps?.length || 0} خطوات</span><span className="text-sm font-bold" style={{ color }}>عرض الدليل ←</span></div>
      </Link>
      {admin && <div className="mt-3 flex gap-2"><Link to={`/EmployeeGuide/admin/${guide.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-appBorder py-2 text-xs font-bold text-appText hover:border-brand/40 hover:text-brand"><Pencil size={14} /> تعديل</Link><button type="button" onClick={() => onDelete(guide)} className="rounded-xl border border-danger/25 px-3 text-danger hover:bg-danger/10" aria-label="حذف الدليل"><Trash2 size={14} /></button></div>}
    </div>
  );
}

function GuideList({ admin = false }) {
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setGuides(await (admin ? fetchAdminGuides() : fetchGuides())); } catch (e) { setError(getApiErrorMessage(e, "تعذر تحميل الأدلة.")); } finally { setLoading(false); }
  }, [admin]);
  useEffect(() => { load(); }, [load]);
  const categories = useMemo(() => [...new Set(guides.map((g) => g.category).filter(Boolean))], [guides]);
  const filtered = guides.filter((g) => (!category || g.category === category) && (!search || `${g.title} ${g.description} ${g.category}`.includes(search)));
  const remove = async (guide) => {
    if (!window.confirm(`هل تريد حذف دليل «${guide.title}»؟`)) return;
    try { await deleteGuide(guide.id); setGuides((items) => items.filter((item) => item.id !== guide.id)); } catch (e) { setError(getApiErrorMessage(e, "تعذر حذف الدليل.")); }
  };
  return (
    <MainLayout title={admin ? "إدارة أدلة الموظفين" : "دليل الموظف"} subtitle={admin ? "إدارة الأدلة" : "الأدلة والإجراءات"} actions={admin ? <button type="button" onClick={() => navigate("/EmployeeGuide/admin/new")} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-panel hover:bg-brandDeep"><Plus size={16} /> إنشاء دليل جديد</button> : canManage() ? <Link to="/EmployeeGuide/admin" className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm font-bold text-brand hover:bg-brand/20"><Pencil size={16} /> إدارة الأدلة</Link> : null}>
      <div className="space-y-6">
        {error && <div className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-badgeRedBg/25 px-4 py-3 text-sm text-appText"><AlertCircle size={18} className="text-danger" />{error}</div>}
        <div className="flex flex-col gap-3 rounded-3xl border border-appBorder bg-appSurface p-4 shadow-panel sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute right-3 top-3 text-appSubtext" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في الأدلة..." className="w-full rounded-xl border border-appBorder bg-appMuted py-2.5 pe-10 ps-3 text-sm text-appText" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-appBorder bg-appMuted px-3 py-2.5 text-sm text-appText"><option value="">كل التصنيفات</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
        {loading ? <div className="rounded-3xl border border-appBorder bg-appSurface p-10 text-center text-appSubtext">جاري تحميل الأدلة...</div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-appBorder bg-appSurface p-12 text-center text-appSubtext"><BookOpen className="mx-auto mb-3 text-brand" size={34} /><p>لا توجد أدلة مطابقة للبحث.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((guide) => <GuideCard key={guide.id} guide={guide} admin={admin} onDelete={remove} />)}</div>}
      </div>
    </MainLayout>
  );
}

function GuideDetails({ id }) {
  const [guide, setGuide] = useState(null);
  const [openSteps, setOpenSteps] = useState(new Set([0]));
  const [error, setError] = useState(null);
  useEffect(() => { fetchGuide(id).then(setGuide).catch((e) => setError(getApiErrorMessage(e, "تعذر تحميل الدليل."))); }, [id]);
  if (error) return <MainLayout title="دليل الموظف"><div className="rounded-2xl border border-danger/30 bg-badgeRedBg/25 p-5 text-danger">{error}</div></MainLayout>;
  if (!guide) return <MainLayout title="دليل الموظف"><div className="p-10 text-center text-appSubtext">جاري تحميل الدليل...</div></MainLayout>;
  const color = guide.color || COLORS[0];
  return <MainLayout title={guide.title} subtitle="دليل الموظف"><div className="mx-auto max-w-4xl space-y-6"><Link to="/EmployeeGuide" className="inline-flex items-center gap-2 text-sm font-bold text-brand"><ArrowRight size={16} /> العودة إلى الأدلة</Link><div className="rounded-3xl border border-appBorder bg-appSurface p-6 shadow-panel" style={{ borderTop: `5px solid ${color}` }}><div className="flex items-start gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ color, backgroundColor: `${color}18` }}>{renderGuideIcon(guide.icon, { size: 28 })}</span><div><span className="text-sm font-bold" style={{ color }}>{guide.category}</span><p className="mt-2 leading-8 text-appSubtext">{guide.description}</p></div></div></div><div className="relative space-y-4"><div className="pointer-events-none absolute inset-y-0 right-6 w-px opacity-25" style={{ backgroundColor: color }} />{guide.steps.map((step, index) => <div key={step.id || index} className="relative"><button type="button" onClick={() => setOpenSteps((current) => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next; })} className="relative flex w-full items-center gap-4 rounded-2xl border border-appBorder bg-appSurface p-4 text-start shadow-panel"><span className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white" style={{ backgroundColor: color }}>{index + 1}</span><span className="flex-1 text-base font-extrabold text-appText">{step.title}</span>{openSteps.has(index) ? <ChevronDown size={19} /> : <ChevronDown size={19} className="-rotate-90" />}</button>{openSteps.has(index) && <div className="ms-16 mt-2 rounded-2xl border border-appBorder bg-appMuted/60 p-5 text-sm leading-8 text-appText"><p>{step.description}</p>{step.entityName && <p className="mt-3 font-bold" style={{ color }}>الجهة الحكومية: <span className="font-medium text-appText">{step.entityName}</span></p>}{step.note && <div className="mt-4 flex gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-amber-800 dark:text-amber-200"><Info size={18} className="mt-1 shrink-0" /><span>{step.note}</span></div>}</div>}</div>)}</div><div className="rounded-2xl border border-dashed border-appBorder bg-appMuted/60 p-5 text-center text-sm text-appSubtext"><BookOpen className="mx-auto mb-2 text-brand" size={22} /><strong className="block text-appText">الأوراق المطلوبة</strong>ستتوفر هذه الخدمة قريبًا عند ربط الدليل بملفات الشركة.</div></div></MainLayout>;
}

function GuideEditor({ id }) {
  const editing = id !== "new";
  const [form, setForm] = useState(EMPTY_GUIDE);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  useEffect(() => {
    if (!editing) return;
    fetchAdminGuides().then((items) => {
      const data = items.find((item) => String(item.id) === String(id));
      if (!data) throw new Error("الدليل غير موجود.");
      setForm({ ...data, steps: data.steps?.length ? data.steps : [{ ...EMPTY_STEP }] });
    }).catch((e) => setMessage({ ok: false, text: getApiErrorMessage(e, "تعذر تحميل الدليل.") })).finally(() => setLoading(false));
  }, [editing, id]);
  useEffect(() => {
    const leave = (event) => { if (dirty && !saving) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty, saving]);
  const setField = (key, value) => { setDirty(true); setFieldErrors((prev) => ({ ...prev, [key]: "" })); setForm((prev) => ({ ...prev, [key]: value })); };
  const setStep = (index, key, value) => { setDirty(true); setFieldErrors((prev) => ({ ...prev, [`step-${index}-${key}`]: "" })); setForm((prev) => ({ ...prev, steps: prev.steps.map((step, i) => i === index ? { ...step, [key]: value } : step) })); };
  const move = (from, to) => { if (from === to) return; setDirty(true); setForm((prev) => { const steps = [...prev.steps]; const [item] = steps.splice(from, 1); steps.splice(to, 0, item); return { ...prev, steps }; }); };
  const leave = () => { if (!dirty || window.confirm("لديك تغييرات غير محفوظة. هل تريد مغادرة الصفحة؟")) navigate(-1); };
  const save = async (status) => {
    const errors = {};
    if (!form.title.trim()) errors.title = "عنوان الدليل مطلوب.";
    if (!form.category.trim()) errors.category = "تصنيف الدليل مطلوب.";
    form.steps.forEach((step, index) => {
      if (!step.title.trim()) errors[`step-${index}-title`] = "عنوان الخطوة مطلوب.";
      if (!step.description.trim()) errors[`step-${index}-description`] = "وصف الخطوة مطلوب.";
    });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setMessage({ ok: false, text: "يرجى استكمال الحقول المطلوبة قبل الحفظ." });
      return;
    }
    setSaving(true); setMessage(null); setFieldErrors({});
    try {
      const payload = { ...form, status, icon: form.icon || "BookOpen" };
      if (editing) await updateGuide(id, payload); else await createGuide(payload);
      setDirty(false); setMessage({ ok: true, text: status === "published" ? "تم نشر الدليل بنجاح." : "تم حفظ الدليل كمسودة." });
      window.setTimeout(() => navigate(-1), 550);
    } catch (e) { setMessage({ ok: false, text: getApiErrorMessage(e, "تعذر حفظ الدليل، راجع البيانات وحاول مرة أخرى.") }); } finally { setSaving(false); }
  };
  if (loading) return <MainLayout title="محرر الدليل"><div className="p-10 text-center text-appSubtext">جاري التحميل...</div></MainLayout>;
  const input = "mt-2 w-full rounded-xl border border-appBorder bg-appMuted px-3 py-2.5 text-sm text-appText transition focus:border-brand focus:bg-appSurface focus:outline-none focus:ring-2 focus:ring-brand/20";
  const color = form.color || COLORS[0];
  return <MainLayout title={editing ? "تعديل الدليل" : "إنشاء دليل جديد"} subtitle="إدارة الأدلة" actions={<button type="button" onClick={leave} className="inline-flex items-center gap-2 rounded-xl border border-appBorder px-4 py-2.5 text-sm font-bold text-appText hover:border-brand/40"><X size={16} /> خروج</button>}>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
      <div className="order-1 space-y-5">
        {message && <div role="status" className={`flex items-center gap-2 rounded-2xl border p-3 text-sm ${message.ok ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-badgeRedBg/25 text-danger"}`}>{message.ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{message.text}</div>}
        <section className="rounded-3xl border border-appBorder bg-appSurface p-5 shadow-panel"><div className="mb-5 border-b border-appBorder pb-4"><h2 className="text-xl font-extrabold text-appText">بيانات الدليل</h2><p className="mt-1 text-sm text-appSubtext">عرّف الإجراء واختر هويته البصرية.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-bold text-appText">عنوان الدليل<input aria-label="عنوان الدليل" className={`${input} text-base font-bold ${fieldErrors.title ? "border-danger" : ""}`} value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="مثال: استخراج السجل التجاري" />{fieldErrors.title && <span className="mt-1 block text-xs font-medium text-danger">{fieldErrors.title}</span>}</label><label className="text-sm font-bold text-appText">التصنيف<input aria-label="التصنيف" className={`${input} ${fieldErrors.category ? "border-danger" : ""}`} value={form.category} onChange={(e) => setField("category", e.target.value)} placeholder="ضرائب، سجل تجاري..." />{fieldErrors.category && <span className="mt-1 block text-xs font-medium text-danger">{fieldErrors.category}</span>}</label><div><span className="text-sm font-bold text-appText">أيقونة الدليل</span><div className="mt-2 flex flex-wrap gap-2">{GUIDE_ICONS.map((item) => <button key={item.name} type="button" onClick={() => setField("icon", item.name)} title={item.label} aria-label={`اختيار أيقونة ${item.label}`} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${form.icon === item.name ? "border-2 shadow-sm" : "border-appBorder text-appSubtext hover:border-brand/40"}`} style={form.icon === item.name ? { borderColor: color, color, backgroundColor: `${color}14` } : undefined}>{renderGuideIcon(item.name, { size: 19 })}</button>)}</div></div><label className="sm:col-span-2 text-sm font-bold text-appText">الوصف المختصر<textarea aria-label="الوصف المختصر" rows="4" className={input + " resize-y leading-7"} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="اكتب وصفًا واضحًا ومختصرًا للدليل..." /></label></div><div className="mt-5 border-t border-appBorder pt-4"><span className="text-sm font-bold text-appText">لون الهوية</span><div className="mt-3 flex flex-wrap items-center gap-3">{COLORS.map((item) => <button type="button" key={item} onClick={() => setField("color", item)} className={`h-9 w-9 rounded-full border-2 transition hover:scale-105 ${color === item ? "border-appText ring-2 ring-offset-2 ring-offset-appSurface" : "border-transparent"}`} style={{ backgroundColor: item, "--tw-ring-color": `${item}55` }} aria-label={`اختيار اللون ${item}`} />)}<span className="text-xs text-appSubtext">يظهر اللون في المعاينة والخطوات والبطاقات.</span></div></div></section>
        <section className="rounded-3xl border border-appBorder bg-appSurface p-5 shadow-panel"><div className="mb-5 flex items-center justify-between gap-3 border-b border-appBorder pb-4"><div><h2 className="text-xl font-extrabold text-appText">خطوات الإجراء</h2><p className="mt-1 text-sm text-appSubtext">رتّب الخطوات بالسحب والإفلات.</p></div><button type="button" onClick={() => { setDirty(true); setForm((p) => ({ ...p, steps: [...p.steps, { ...EMPTY_STEP }] })); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs font-bold text-brand hover:bg-brand/20"><Plus size={15} /> إضافة خطوة</button></div><div className="space-y-4">{form.steps.map((step, index) => <div key={index} draggable onDragStart={(e) => e.dataTransfer.setData("step", index)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => move(Number(e.dataTransfer.getData("step")), index)} className="rounded-2xl border bg-appMuted/40 p-4 shadow-inner transition hover:bg-appMuted/70" style={{ borderColor: `${color}55`, borderInlineStart: `4px solid ${color}` }}><div className="mb-4 flex items-center gap-2"><button type="button" className="flex h-9 w-9 cursor-grab items-center justify-center rounded-lg border border-appBorder bg-appSurface text-appSubtext active:cursor-grabbing" title="إعادة ترتيب الخطوة" aria-label="إعادة ترتيب الخطوة"><GripVertical size={18} /></button><span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: color }}>الخطوة {index + 1}</span>{form.steps.length > 1 && <button type="button" onClick={() => { setDirty(true); setForm((p) => ({ ...p, steps: p.steps.filter((_, i) => i !== index) })); }} className="ms-auto flex h-9 w-9 items-center justify-center rounded-lg border border-danger/25 text-danger hover:bg-danger/10" title="حذف الخطوة" aria-label={`حذف الخطوة ${index + 1}`}><Trash2 size={16} /></button>}</div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-appSubtext">عنوان الخطوة<input className={`${input} ${fieldErrors[`step-${index}-title`] ? "border-danger" : ""}`} value={step.title} onChange={(e) => setStep(index, "title", e.target.value)} placeholder="اكتب عنوان الخطوة" />{fieldErrors[`step-${index}-title`] && <span className="mt-1 block font-medium text-danger">{fieldErrors[`step-${index}-title`]}</span>}</label><label className="text-xs font-bold text-appSubtext">الجهة الحكومية<input className={input} value={step.entityName || ""} onChange={(e) => setStep(index, "entityName", e.target.value)} placeholder="اختياري" /></label><label className="sm:col-span-2 text-xs font-bold text-appSubtext">شرح الإجراء<textarea rows="3" className={`${input} resize-y leading-7 ${fieldErrors[`step-${index}-description`] ? "border-danger" : ""}`} value={step.description} onChange={(e) => setStep(index, "description", e.target.value)} placeholder="اشرح الإجراء بشكل مبسط وواضح" />{fieldErrors[`step-${index}-description`] && <span className="mt-1 block font-medium text-danger">{fieldErrors[`step-${index}-description`]}</span>}</label><label className="sm:col-span-2 text-xs font-bold text-appSubtext">ملاحظة إضافية<textarea rows="2" className={input + " resize-y leading-7"} value={step.note || ""} onChange={(e) => setStep(index, "note", e.target.value)} placeholder="تنبيه أو ملاحظة اختيارية" /></label></div></div>)}</div></section>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={saving} onClick={() => save("draft")} className="inline-flex items-center justify-center rounded-xl border border-appBorder px-5 py-2.5 text-sm font-bold text-appText hover:bg-appMuted disabled:cursor-not-allowed disabled:opacity-50">{saving ? "جاري الحفظ..." : "حفظ كمسودة"}</button><button type="button" disabled={saving} onClick={() => save("published")} className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-panel hover:bg-brandDeep disabled:cursor-not-allowed disabled:opacity-50">{saving ? "جاري الحفظ..." : "حفظ ونشر"}</button></div>
      </div>
      <aside className="order-2 h-fit xl:sticky xl:top-5"><div className="rounded-3xl border border-appBorder bg-appSurface p-5 shadow-panel"><div className="mb-4 flex items-center justify-between"><div><span className="text-xs font-bold uppercase tracking-[0.12em] text-appSubtext">معاينة</span><h2 className="mt-1 text-xl font-extrabold text-appText">ما سيظهر للموظف</h2></div><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color, backgroundColor: `${color}14` }}>مباشرة</span></div><div className="overflow-hidden rounded-2xl border border-appBorder bg-appSurface" style={{ borderTop: `6px solid ${color}` }}><div className="p-5"><div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ color, backgroundColor: `${color}18` }}>{renderGuideIcon(form.icon, { size: 25 })}</span><div className="min-w-0"><span className="text-xs font-bold" style={{ color }}>{form.category || "التصنيف"}</span><h3 className="mt-1 break-words text-lg font-extrabold text-appText">{form.title || "عنوان الدليل"}</h3><p className="mt-2 break-words text-sm leading-7 text-appSubtext">{form.description || "سيظهر وصف الدليل هنا."}</p></div></div><div className="mt-6 space-y-3">{form.steps.map((step, i) => <div key={i} className="flex items-start gap-3 rounded-xl border border-appBorder bg-appMuted/50 p-3" style={{ borderInlineStart: `3px solid ${color}` }}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }}>{i + 1}</span><span className="pt-1 text-sm font-bold text-appText">{step.title || "عنوان الخطوة"}</span></div>)}</div></div></div></div></aside>
    </div>
  </MainLayout>;
}

export default function EmployeeGuidePage() {
  const { id } = useParams();
  const admin = window.location.pathname.startsWith("/EmployeeGuide/admin");
  if (admin && !canManage()) return <MainLayout title="دليل الموظف"><div className="rounded-2xl border border-danger/30 bg-badgeRedBg/25 p-5 text-danger">ليس لديك صلاحية إدارة أدلة الموظفين.</div></MainLayout>;
  if (admin && id) return <GuideEditor id={id} />;
  if (admin) return <GuideList admin />;
  if (id) return <GuideDetails id={id} />;
  return <GuideList />;
}
