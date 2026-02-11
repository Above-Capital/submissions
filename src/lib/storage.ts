export type ConverterState = {
  categoryId: string;
  fromUnitId: string;
  toUnitId: string;
  value: string;
  history: Array<{ at: number; categoryId: string; from: string; to: string; value: number; result: number }>;
};

const KEY = "dragunits:state:v1";

export function loadState(): ConverterState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as ConverterState;
  } catch {
    return null;
  }
}

export function saveState(state: ConverterState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
