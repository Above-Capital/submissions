export function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = safeJsonParse<T>(window.localStorage.getItem(key));
  return v ?? fallback;
}

export function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
