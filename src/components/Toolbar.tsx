"use client";

import { downloadText, filenameSafe, Note, STORAGE_KEY } from "@/lib/notes";
import { useRef } from "react";

export default function Toolbar({
  note,
  onNew,
  onDelete,
  onTogglePreview,
  preview,
  onImport,
}: {
  note: Note | null;
  onNew: () => void;
  onDelete: () => void;
  preview: boolean;
  onTogglePreview: () => void;
  onImport: (text: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-400 to-cyan-300 p-[2px]">
          <div className="rounded-2xl bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
            MD Notes
          </div>
        </div>
        <div className="hidden text-xs text-white/55 md:block">
          ⌘/Ctrl+N new • ⌘/Ctrl+S export • ⌘/Ctrl+P preview
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePreview}
          className="rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
        >
          {preview ? "Editor" : "Preview"}
        </button>

        <button
          onClick={() => onNew()}
          className="rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
        >
          New
        </button>

        <button
          onClick={() => {
            if (!note) return;
            const fn = `${filenameSafe(note.title || "note")}.md`;
            downloadText(fn, note.body);
          }}
          disabled={!note}
          className="rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40"
        >
          Export
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
        >
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt,text/plain"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            onImport(text);
            e.target.value = "";
          }}
        />

        <button
          onClick={() => {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            downloadText("md-notes-backup.json", raw ?? "{}");
          }}
          className="rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
        >
          Backup
        </button>

        <button
          onClick={() => onDelete()}
          disabled={!note}
          className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-400/15 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
