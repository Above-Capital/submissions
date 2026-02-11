import { GardenState, Snippet } from "./types";

const KEY = "arena.snippet-garden.v1";

export function loadGardenState(): GardenState {
  if (typeof window === "undefined") {
    return { version: 1, snippets: [] };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { version: 1, snippets: seedSnippets() };
    const parsed = JSON.parse(raw) as GardenState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.snippets)) {
      return { version: 1, snippets: seedSnippets() };
    }
    return parsed;
  } catch {
    return { version: 1, snippets: seedSnippets() };
  }
}

export function saveGardenState(state: GardenState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function newId(prefix = "snip") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function seedSnippets(): Snippet[] {
  const now = Date.now();
  return [
    {
      id: "seed_1",
      title: "Debounce (tiny, no deps)",
      language: "ts",
      tags: ["ui", "perf", "pattern"],
      vibe: "seed",
      content: `export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 200) {\n  let t: ReturnType<typeof setTimeout> | undefined;\n  return (...args: Parameters<T>) => {\n    if (t) clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}`,
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
      updatedAt: now - 1000 * 60 * 60 * 24 * 7,
      lastViewedAt: now - 1000 * 60 * 2,
      position: { x: 0.22, y: 0.62 },
    },
    {
      id: "seed_2",
      title: "Fetch JSON with typed guard",
      language: "ts",
      tags: ["http", "safety", "pattern"],
      vibe: "anchor",
      content: `type Json = null | boolean | number | string | Json[] | { [k: string]: Json };\n\nexport async function fetchJson(url: string): Promise<Json> {\n  const r = await fetch(url);\n  if (!r.ok) throw new Error("HTTP " + r.status + " " + r.statusText);\n  return (await r.json()) as Json;\n}`,
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
      updatedAt: now - 1000 * 60 * 60 * 24 * 2,
      lastViewedAt: now - 1000 * 60 * 50,
      position: { x: 0.63, y: 0.38 },
    },
    {
      id: "seed_3",
      title: "Parse headings from Markdown",
      language: "js",
      tags: ["text", "parser", "tooling"],
      vibe: "spark",
      content: `const HEADING = /^(#{1,6})\\s+(.+)$/gm;\n\nexport function extractHeadings(md) {\n  return Array.from(md.matchAll(HEADING)).map((m) => ({\n    level: m[1].length,\n    text: m[2].trim(),\n  }));\n}`,
      createdAt: now - 1000 * 60 * 60 * 24 * 10,
      updatedAt: now - 1000 * 60 * 60 * 24 * 4,
      lastViewedAt: now - 1000 * 60 * 60 * 20,
      position: { x: 0.45, y: 0.18 },
    },
  ];
}
