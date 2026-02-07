import type { ID, Priority, Todo } from "@/lib/todoTypes";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function isSameDay(a: number, b: number) {
  return startOfDay(a) === startOfDay(b);
}

export function formatDue(dueAt: number | null) {
  if (!dueAt) return "";
  const now = Date.now();
  const day = startOfDay(dueAt);
  const today = startOfDay(now);
  const diffDays = Math.round((day - today) / (24 * 3600 * 1000));

  const dateStr = new Date(dueAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (diffDays === 0) return `Today · ${dateStr}`;
  if (diffDays === 1) return `Tomorrow · ${dateStr}`;
  if (diffDays === -1) return `Yesterday · ${dateStr}`;
  return dateStr;
}

export function priorityLabel(p: Priority) {
  if (p === 3) return "High";
  if (p === 2) return "Medium";
  if (p === 1) return "Low";
  return "None";
}

export function priorityDotClass(p: Priority) {
  if (p === 3) return "bg-rose-500";
  if (p === 2) return "bg-amber-500";
  if (p === 1) return "bg-emerald-500";
  return "bg-zinc-300 dark:bg-zinc-700";
}

export function sortTodosStable(todos: Todo[]) {
  return [...todos].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt - b.createdAt;
  });
}

export function toggleInArray(arr: ID[], id: ID) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}
