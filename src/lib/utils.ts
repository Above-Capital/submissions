export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function fmtTempC(c: number) {
  return `${Math.round(c)}°`;
}

export function fmtKph(kph: number) {
  return `${Math.round(kph)} km/h`;
}

export function fmtMm(mm: number | null) {
  if (mm == null) return "—";
  return `${mm.toFixed(1)} mm`;
}

export function formatHour(iso: string, tz?: string) {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", timeZone: tz }).format(d);
  } catch {
    return `${d.getHours()}:00`;
  }
}

export function formatDay(iso: string, tz?: string) {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "2-digit", timeZone: tz }).format(d);
  } catch {
    return d.toDateString();
  }
}

export function windArrow(deg: number) {
  // rotate arrow so 0deg points up
  return `rotate(${deg}deg)`;
}
