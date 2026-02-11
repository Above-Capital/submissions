export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function uniq<T>(xs: T[]) {
  return Array.from(new Set(xs));
}

export function scoreQuery(q: string, text: string) {
  // Simple fuzzy-ish scoring (fast): exact substring > prefix > partial token hits
  const query = q.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!query) return 0;
  if (t === query) return 100;
  if (t.startsWith(query)) return 70;
  const idx = t.indexOf(query);
  if (idx >= 0) return 55 - Math.min(30, idx / 4);

  const tokens = query.split(/\s+/).filter(Boolean);
  let s = 0;
  for (const tok of tokens) {
    if (t.includes(tok)) s += 18;
  }
  return s;
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}
