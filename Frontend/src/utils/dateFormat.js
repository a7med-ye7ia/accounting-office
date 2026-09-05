/**
 * Normalizes backend date payloads (ISO string, [y,m,d] arrays, or Date) to `YYYY-MM-DD` for `<input type="date">`.
 * @param {unknown} value
 * @returns {string}
 */
export function toDateInputValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const s = value.includes("T") ? value.slice(0, 10) : value;
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value;
    const pad = (n) => String(n).padStart(2, "0");
    return `${String(y).padStart(4, "0")}-${pad(m)}-${pad(d)}`;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return "";
}

/**
 * @param {unknown} value
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDisplayDate(value, locale = "en-GB") {
  if (value == null || value === "") return "—";
  const input = toDateInputValue(value);
  if (input) {
    const d = new Date(`${input}T12:00:00`);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(locale);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(locale);
}

export function toDateTimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
