import { formatDisplayDate } from "./dateFormat";

/** @param {string | undefined} status */
export function formatTaskStatusAr(status) {
  const s = (status || "").toString();
  if (s === "PENDING") return "قيد الانتظار";
  if (s === "IN_PROGRESS") return "قيد التنفيذ";
  if (s === "DONE") return "مكتملة";
  return s || "—";
}

/** @param {string | undefined} status */
export function formatContractStatusAr(status) {
  const s = (status || "").toString();
  if (s === "DRAFT") return "مسودة";
  if (s === "PENDING_APPROVAL") return "بانتظار الموافقة";
  if (s === "APPROVED") return "معتمد";
  if (s === "REJECTED") return "مرفوض";
  return s || "—";
}

/** @param {string | undefined} type */
export function formatContractTypeAr(type) {
  const t = (type || "").toString();
  if (t === "CREATING") return "عقد تأسيس";
  if (t === "UPDATING") return "عقد تعديل";
  return t || "—";
}

/**
 * @param {unknown} value ISO string or array from Jackson
 */
export function formatDateTimeShort(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  }
  if (Array.isArray(value) && value.length >= 5) {
    const [y, mo, d, h, mi] = value;
    const dt = new Date(y, mo - 1, d, h, mi);
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  }
  return formatDisplayDate(value);
}

/**
 * @param {unknown} v
 * @returns {number}
 */
export function dateValueToMs(v) {
  if (v == null) return 0;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }
  if (Array.isArray(v) && v.length >= 6) {
    const [y, mo, d, h, mi, s] = v;
    const dt = new Date(y, mo - 1, d, h, mi, s || 0);
    return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
  }
  if (Array.isArray(v) && v.length >= 3) {
    const [y, mo, d] = v;
    const dt = new Date(y, mo - 1, d);
    return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
  }
  return 0;
}
