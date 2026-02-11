"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ResumePreview from "./ResumePreview";
import { loadState, saveState } from "../lib/storage";
import { PaperSize, ResumeState } from "../lib/types";
import { getTheme, THEMES } from "../lib/themes";
import { classNames, downloadJson } from "../lib/utils";
import { TEMPLATE_ATS, TEMPLATE_CREATIVE, TEMPLATE_MODERN } from "../lib/templates";

function defaultState(): ResumeState {
  return {
    version: 1,
    markdown: TEMPLATE_MODERN,
    themeId: "aurora",
    paper: "letter",
    showGuides: false,
    updatedAt: Date.now(),
  };
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ResumeBuilderApp() {
  const seeded = useRef(false);
  const [st, setSt] = useState<ResumeState>(() => defaultState());
  const [leftTab, setLeftTab] = useState<"editor" | "templates">("editor");
  const [toast, setToast] = useState<string | null>(null);

  const debounced = useDebounced(st, 350);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const saved = loadState();
    if (saved?.version === 1) setSt({ ...defaultState(), ...saved });
  }, []);

  useEffect(() => {
    saveState({ ...debounced, updatedAt: Date.now() });
  }, [debounced]);

  const theme = useMemo(() => getTheme(st.themeId), [st.themeId]);

  function setPaper(p: PaperSize) {
    setSt((s) => ({ ...s, paper: p }));
  }

  function exportJson() {
    downloadJson(`resume-builder-${new Date().toISOString().slice(0, 10)}.json`, st);
    setToast("Exported JSON");
    window.setTimeout(() => setToast(null), 900);
  }

  async function importJson(file: File) {
    const raw = await file.text();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) throw new Error("bad");
      setSt({ ...defaultState(), ...(parsed as ResumeState) });
      setToast("Imported JSON");
      window.setTimeout(() => setToast(null), 900);
    } catch {
      alert("Import failed.");
    }
  }

  function applyTemplate(kind: "modern" | "ats" | "creative") {
    const md = kind === "ats" ? TEMPLATE_ATS : kind === "creative" ? TEMPLATE_CREATIVE : TEMPLATE_MODERN;
    setSt((s) => ({ ...s, markdown: md }));
    setLeftTab("editor");
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.24),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.20),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">ResumeForge</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Markdown → print-ready resume • templates • themes • local-first</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Print / PDF
            </button>
            <button
              onClick={exportJson}
              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Export JSON
            </button>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/json";
                input.onchange = () => {
                  const f = input.files?.[0];
                  if (f) void importJson(f);
                };
                input.click();
              }}
              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Import JSON
            </button>
          </div>
        </header>

        {toast ? (
          <div className="mb-4 rounded-2xl border border-black/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">{toast}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Controls</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-300">autosaves locally</div>
            </div>

            <div className="mt-3 grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaper("letter")}
                  className={classNames(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                    st.paper === "letter"
                      ? "border-indigo-500/35 bg-indigo-500/10"
                      : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10"
                  )}
                >
                  Letter
                </button>
                <button
                  onClick={() => setPaper("a4")}
                  className={classNames(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                    st.paper === "a4"
                      ? "border-indigo-500/35 bg-indigo-500/10"
                      : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10"
                  )}
                >
                  A4
                </button>
              </div>

              <div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Theme</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSt((s) => ({ ...s, themeId: t.id }))}
                      className={classNames(
                        "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                        st.themeId === t.id
                          ? "border-emerald-500/35 bg-emerald-500/10"
                          : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10"
                      )}
                      style={{ borderColor: st.themeId === t.id ? t.accent : undefined }}
                      title={t.label}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Guides</div>
                <button
                  onClick={() => setSt((s) => ({ ...s, showGuides: !s.showGuides }))}
                  className={classNames(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                    st.showGuides
                      ? "border-indigo-500/35 bg-indigo-500/10"
                      : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10"
                  )}
                >
                  {st.showGuides ? "On" : "Off"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {(["editor", "templates"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLeftTab(t)}
                  className={classNames(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold",
                    leftTab === t
                      ? "border-indigo-500/35 bg-indigo-500/10"
                      : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10"
                  )}
                >
                  {t === "editor" ? "Editor" : "Templates"}
                </button>
              ))}
            </div>

            {leftTab === "editor" ? (
              <div className="mt-3">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Markdown</div>
                <textarea
                  value={st.markdown}
                  onChange={(e) => setSt((s) => ({ ...s, markdown: e.target.value }))}
                  className="mt-2 h-[62dvh] w-full resize-none rounded-2xl border border-black/10 bg-white/70 p-3 font-mono text-[12px] leading-6 outline-none ring-indigo-500/20 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                  placeholder="# Your Name\n..."
                />
                <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-300">
                  Tip: Use <span className="font-mono">---</span> for separators. Keep it ATS-friendly.
                </div>
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                <TemplateCard title="Modern" desc="Balanced, clean, good for most roles" onClick={() => applyTemplate("modern")} />
                <TemplateCard title="ATS" desc="All-caps headings, simple structure" onClick={() => applyTemplate("ats")} />
                <TemplateCard title="Creative" desc="More whitespace and personality" onClick={() => applyTemplate("creative")} />
              </div>
            )}

            <div className="mt-4 rounded-xl border border-black/10 bg-white/40 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              Print tip: In the print dialog, disable “Headers and footers” for a clean PDF.
            </div>
          </aside>

          <main className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-3 dark:border-white/10">
              <div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Live preview</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-300">Print-ready page with typography + spacing tuned</div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-300">
                Theme accent: <span className="font-semibold" style={{ color: theme.accent }}>{theme.accent}</span>
              </div>
            </div>

            <div className="mt-4 overflow-auto pb-6">
              <ResumePreview markdown={st.markdown} theme={theme} paper={st.paper} showGuides={st.showGuides} />
            </div>
          </main>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          header, aside { display: none !important; }
          main { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
        @page {
          size: ${st.paper === "a4" ? "A4" : "letter"};
          margin: 14mm;
        }
      `}</style>
    </div>
  );
}

function TemplateCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-black/10 bg-white/70 p-4 text-left shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{desc}</div>
      <div className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-200">Use template →</div>
    </button>
  );
}
