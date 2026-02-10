"use client";

import { Note, normalizeTags } from "@/lib/notes";
import { useEffect, useMemo, useRef, useState } from "react";

export default function NoteEditor({
  note,
  onChange,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
}) {
  const [tagText, setTagText] = useState(note.tags.join(", "));
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTagText(note.tags.join(", "));
  }, [note.id]);

  const stats = useMemo(() => {
    const chars = note.body.length;
    const words = note.body.trim().split(/\s+/).filter(Boolean).length;
    return { chars, words };
  }, [note.body]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-5 py-3">
        <input
          ref={titleRef}
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Title"
          className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
        />
        <div className="text-[11px] font-medium text-white/45">
          {stats.words} words • {stats.chars} chars
        </div>
      </div>

      <div className="border-b border-white/10 bg-black/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-semibold text-white/55">Tags</div>
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            onBlur={() => onChange({ tags: normalizeTags(tagText) })}
            placeholder="e.g. work, ideas, todo"
            className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-indigo-400/40 focus:ring-4 focus:ring-indigo-500/10"
          />
          <button
            className="rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            onClick={() => onChange({ tags: normalizeTags(tagText) })}
            title="Apply tags"
          >
            Apply
          </button>
        </div>
      </div>

      <textarea
        value={note.body}
        onChange={(e) => onChange({ body: e.target.value })}
        spellCheck={false}
        placeholder="Write Markdown…"
        className="min-h-0 flex-1 resize-none bg-transparent px-5 py-4 font-mono text-[13px] leading-6 text-white/90 outline-none placeholder:text-white/35"
      />
    </div>
  );
}
