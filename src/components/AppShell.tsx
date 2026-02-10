"use client";

import NoteEditor from "@/components/NoteEditor";
import NoteList from "@/components/NoteList";
import PreviewPane from "@/components/PreviewPane";
import Toolbar from "@/components/Toolbar";
import { newNote, Note, NotesState, sortNotes, STORAGE_KEY } from "@/lib/notes";
import { useHotkeys } from "@/lib/useHotkeys";
import { useEffect, useMemo, useState } from "react";

function loadState(): NotesState {
  if (typeof window === "undefined") return { notes: [newNote()], selectedId: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { notes: [newNote()], selectedId: null };
    const parsed = JSON.parse(raw) as NotesState;
    if (!parsed.notes?.length) return { notes: [newNote()], selectedId: null };
    return { ...parsed, notes: sortNotes(parsed.notes) };
  } catch {
    return { notes: [newNote()], selectedId: null };
  }
}

export default function AppShell() {
  const [state, setState] = useState<NotesState>(() => {
    const s = loadState();
    const first = s.selectedId ?? s.notes[0]?.id ?? null;
    return { ...s, selectedId: first };
  });

  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(true);
  const [mobilePane, setMobilePane] = useState<"list" | "editor" | "preview">("editor");

  // persist
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const selected = useMemo(() => state.notes.find((n) => n.id === state.selectedId) ?? null, [state]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const notes = sortNotes(state.notes);
    if (!q) return notes;
    return notes.filter((n) => {
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q))
      );
    });
  }, [state.notes, query]);

  const create = () => {
    const n = newNote();
    setState((s) => ({ notes: [n, ...s.notes], selectedId: n.id }));
    setMobilePane("editor");
  };

  const del = () => {
    if (!selected) return;
    setState((s) => {
      const nextNotes = s.notes.filter((n) => n.id !== selected.id);
      const nextSelected = nextNotes[0]?.id ?? null;
      return { notes: nextNotes.length ? nextNotes : [newNote()], selectedId: nextSelected };
    });
  };

  const updateSelected = (patch: Partial<Note>) => {
    if (!selected) return;
    setState((s) => {
      const notes = s.notes.map((n) =>
        n.id === selected.id
          ? {
              ...n,
              ...patch,
              updatedAt: Date.now(),
              title: (patch.title ?? n.title) || "Untitled",
            }
          : n
      );
      return { ...s, notes };
    });
  };

  const importMarkdown = (text: string) => {
    const n = newNote({
      title: "Imported",
      body: text,
    });
    setState((s) => ({ notes: [n, ...s.notes], selectedId: n.id }));
    setMobilePane("editor");
  };

  useHotkeys(
    [
      { combo: "mod+n", handler: () => create() },
      {
        combo: "mod+s",
        handler: () => {
          // export selected
          if (!selected) return;
          const a = document.createElement("a");
          const blob = new Blob([selected.body], { type: "text/markdown;charset=utf-8" });
          a.href = URL.createObjectURL(blob);
          a.download = `${selected.title || "note"}.md`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 400);
        },
      },
      { combo: "mod+p", handler: () => setPreview((p) => !p) },
      { combo: "shift+mod+l", handler: () => setMobilePane("list") },
    ],
    true
  );

  return (
    <div className="min-h-screen bg-[#060712] text-white">
      <Toolbar
        note={selected}
        onNew={create}
        onDelete={del}
        preview={preview}
        onTogglePreview={() => setPreview((p) => !p)}
        onImport={importMarkdown}
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 pb-10 pt-4 md:grid-cols-[320px_1fr]">
        <div className={"h-[76vh] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] " + (mobilePane === "list" ? "block" : "hidden md:block")}>
          <NoteList
            notes={filtered}
            selectedId={state.selectedId}
            query={query}
            onQuery={setQuery}
            onNew={create}
            onSelect={(id) => {
              setState((s) => ({ ...s, selectedId: id }));
              setMobilePane("editor");
            }}
          />
        </div>

        <div className="h-[76vh] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-sm text-white/60">No note selected.</div>
          ) : (
            <div className="grid h-full grid-cols-1 md:grid-cols-2">
              <div className={mobilePane === "preview" ? "hidden md:block" : "block"}>
                <NoteEditor note={selected} onChange={updateSelected} />
              </div>
              {preview && (
                <div className={"border-l border-white/10 bg-black/10 " + (mobilePane === "editor" ? "hidden md:block" : "block")}>
                  <PreviewPane markdown={selected.body} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/60 md:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">⌘/Ctrl+N new</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">⌘/Ctrl+P toggle preview</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">⌘/Ctrl+S export</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Shift+⌘/Ctrl+L list</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/70 hover:bg-black/30 md:hidden"
              onClick={() => setMobilePane((p) => (p === "list" ? "editor" : "list"))}
            >
              {mobilePane === "list" ? "Editor" : "List"}
            </button>
            <button
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/70 hover:bg-black/30 md:hidden"
              onClick={() => setMobilePane((p) => (p === "preview" ? "editor" : "preview"))}
              disabled={!preview}
            >
              {mobilePane === "preview" ? "Editor" : "Preview"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
