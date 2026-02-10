"use client";

import { windArrow } from "../lib/utils";

export default function WindDial({ dirDeg }: { dirDeg: number }) {
  return (
    <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/10">
      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.18),transparent_60%)]" />
      <div className="relative text-[10px] font-semibold text-zinc-500 dark:text-zinc-300">N</div>
      <div
        className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(-50%,-50%) ${windArrow(dirDeg)}` }}
      >
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <path d="M32 6l10 18H22L32 6z" fill="rgba(99,102,241,0.9)" />
          <path d="M32 22v34" stroke="rgba(99,102,241,0.9)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
