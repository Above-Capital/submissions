export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function formatNumber(n: number) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs !== 0 && (abs < 0.001 || abs > 1e6) ? 6 : 6;
  // keep stable, but not too long
  const s = n.toPrecision(digits);
  // remove trailing zeros in decimal-ish
  return String(Number(s));
}

export function formatTime(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  } catch {
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}
