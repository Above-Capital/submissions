import React, { useMemo, useRef } from "react";
import type { ID, Todo, TodoDB } from "@/lib/todoTypes";
import { formatDue, priorityDotClass, sortTodosStable } from "@/lib/todoUtils";

export function TodoList({
  db,
  todos,
  selectedTodoId,
  onSelectTodo,
  onToggleComplete,
  onRename,
  onReorder,
}: {
  db: TodoDB;
  todos: Todo[];
  selectedTodoId: ID | null;
  onSelectTodo: (id: ID) => void;
  onToggleComplete: (id: ID) => void;
  onRename: (id: ID, title: string) => void;
  onReorder: (activeId: ID, overId: ID) => void;
}) {
  const sorted = useMemo(() => sortTodosStable(todos), [todos]);
  const dragIdRef = useRef<ID | null>(null);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {sorted.map((t) => {
          const active = selectedTodoId === t.id;
          const dueLabel = formatDue(t.dueAt);
          const isOverdue = t.dueAt !== null && !t.completedAt && t.dueAt < Date.now();
          return (
            <li
              key={t.id}
              draggable
              onDragStart={() => {
                dragIdRef.current = t.id;
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={() => {
                const dragId = dragIdRef.current;
                if (!dragId || dragId === t.id) return;
                onReorder(dragId, t.id);
              }}
              className={
                "flex items-center gap-3 px-4 py-3 transition " +
                (active
                  ? "bg-zinc-50 dark:bg-black/30"
                  : "hover:bg-zinc-50 dark:hover:bg-black/20")
              }
            >
              <button
                onClick={() => onToggleComplete(t.id)}
                className={
                  "h-5 w-5 shrink-0 rounded-md border transition " +
                  (t.completedAt
                    ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                    : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950")
                }
                aria-label={t.completedAt ? "Mark as incomplete" : "Mark as complete"}
                title="Toggle complete"
              />

              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelectTodo(t.id)}
                aria-label={`Open todo: ${t.title}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "truncate text-sm font-medium " +
                      (t.completedAt
                        ? "text-zinc-400 line-through dark:text-zinc-600"
                        : "text-zinc-900 dark:text-zinc-100")
                    }
                    title={t.title}
                  >
                    {t.title}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${priorityDotClass(t.priority)}`}
                    aria-label={`Priority ${t.priority}`}
                    title={`Priority ${t.priority}`}
                  />
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {dueLabel ? (
                    <span className={isOverdue ? "text-rose-600 dark:text-rose-400" : ""}>
                      {dueLabel}
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                  {t.notes ? <span className="truncate">· {t.notes}</span> : null}
                </div>
              </button>

              <span className="hidden text-[10px] text-zinc-400 dark:text-zinc-600 sm:block">
                drag
              </span>
            </li>
          );
        })}
      </ul>

      {sorted.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Nothing here.
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Add a task with <span className="font-semibold">N</span>.
          </div>
        </div>
      ) : null}
    </div>
  );
}
