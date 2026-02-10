"use client";

import { Note } from "@/lib/notes";

export default function NoteList({
  notes,
  selectedId,
  query,
  onQuery,
  onSelect,
  onNew,
}: {
  notes: Note[];
  selectedId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-indigo-400/40 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
        <button
          onClick={onNew}
          className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
          title="New note (⌘/Ctrl+N)"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-3">
        {notes.length === 0 ? (
          <div className="mx-3 mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">
            No notes yet. Create one to get started.
          </div>
        ) : (
          <ul className="space-y-1">
            {notes.map((n) => {
              const active = n.id === selectedId;
              const snippet = (n.body || "").replace(/\n/g, " ").slice(0, 70);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => onSelect(n.id)}
                    className={
                      "w-full rounded-3xl border px-3 py-3 text-left transition " +
                      (active
                        ? "border-indigo-400/30 bg-indigo-400/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-white">{n.title || "Untitled"}</div>
                      <div className="shrink-0 text-[10px] font-medium text-white/45">
                        {new Date(n.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-white/55">{snippet}</div>
                    {n.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {n.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white/70"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
