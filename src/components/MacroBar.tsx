import React from "react";

export function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = target <= 0 ? 0 : Math.min(1, value / target);
  return (
    <div>
      <div className="flex items-end justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          {Math.round(value)} / {Math.round(target)} g
        </div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
