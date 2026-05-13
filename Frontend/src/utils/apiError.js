/**
 * Best-effort message from axios / fetch errors (Spring Boot often uses `message`).
 * @param {unknown} error
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback = "حدث خطأ غير متوقع.") {
  if (!error) return fallback;
  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data.message === "string" && data.message.trim()) return data.message;
  if (data && typeof data.error === "string" && data.error.trim()) return data.error;
  if (error.message && typeof error.message === "string") return error.message;
  return fallback;
}
