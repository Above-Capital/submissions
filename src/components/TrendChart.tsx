import React, { useMemo } from "react";

export function TrendChart({
  values,
  target,
}: {
  values: { label: string; calories: number; score: number }[];
  target: number;
}) {
  const max = useMemo(() => {
    const m = Math.max(target, ...values.map((v) => v.calories));
    return Math.max(1, m);
  }, [values, target]);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Last 7 days
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Calories vs target, plus an adherence score.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Target</div>
          <div className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {Math.round(target)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 items-end gap-2">
        {values.map((v) => {
          const h = Math.round((v.calories / max) * 100);
          const near = v.score >= 0.75;
          return (
            <div key={v.label} className="flex flex-col items-center gap-2">
              <div
                className={
                  "w-full rounded-xl " +
                  (near
                    ? "bg-emerald-500/80"
                    : "bg-amber-500/80 dark:bg-amber-400/70")
                }
                style={{ height: `${Math.max(6, h)}px` }}
                title={`${v.label}: ${Math.round(v.calories)} kcal`}
              />
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {v.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-900 dark:bg-black/30 dark:text-zinc-300">
        Green bars mean you were close to target. (This is a lightweight
        heuristic — no judgment.)
      </div>
    </div>
  );
}
