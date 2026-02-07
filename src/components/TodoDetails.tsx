import React, { useMemo } from "react";
import type { ID, Priority, Project, Tag, Todo } from "@/lib/todoTypes";
import { Button, Input, Textarea } from "@/components/ui";
import { clamp, formatDue, priorityLabel, toggleInArray } from "@/lib/todoUtils";

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TodoDetails({
  todo,
  projects,
  tags,
  onChange,
  onDelete,
  onDuplicate,
}: {
  todo: Todo | null;
  projects: Project[];
  tags: Tag[];
  onChange: (patch: Partial<Todo>) => void;
  onDelete: (id: ID) => void;
  onDuplicate: (id: ID) => void;
}) {
  const dueString = useMemo(() => {
    if (!todo?.dueAt) return "";
    const d = new Date(todo.dueAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [todo?.dueAt]);

  if (!todo) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Select a task
        </div>
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Click a todo to see details.
        </div>
      </section>
    );
  }

  const projectOptions = [
    { value: "", label: "No project" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const priorityOptions: { value: string; label: string }[] = [
    { value: "0", label: "None" },
    { value: "1", label: "Low" },
    { value: "2", label: "Medium" },
    { value: "3", label: "High" },
  ];

  const dueLabel = formatDue(todo.dueAt);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Details</div>
          <div className="mt-1 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {todo.title}
          </div>
          {dueLabel ? (
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Due: {dueLabel}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => onDuplicate(todo.id)}>
            Duplicate
          </Button>
          <Button variant="danger" onClick={() => onDelete(todo.id)}>
            Delete
          </Button>
        </div>
      </header>

      <div className="mt-5 grid gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Title
          </div>
          <Input
            value={todo.title}
            onChange={(v) => onChange({ title: v, updatedAt: Date.now() })}
            placeholder="What needs doing?"
          />
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Notes
          </div>
          <Textarea
            value={todo.notes}
            onChange={(v) => onChange({ notes: v, updatedAt: Date.now() })}
            placeholder="Optional notes"
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Project
            </div>
            <Select
              value={todo.projectId ?? ""}
              onChange={(v) =>
                onChange({ projectId: v ? (v as ID) : null, updatedAt: Date.now() })
              }
              options={projectOptions}
            />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Priority
            </div>
            <Select
              value={String(todo.priority)}
              onChange={(v) =>
                onChange({
                  priority: clamp(Number(v), 0, 3) as Priority,
                  updatedAt: Date.now(),
                })
              }
              options={priorityOptions}
            />
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {priorityLabel(todo.priority)}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Due date
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueString}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  onChange({ dueAt: null, updatedAt: Date.now() });
                  return;
                }
                const d = new Date(v + "T09:00:00");
                onChange({ dueAt: d.getTime(), updatedAt: Date.now() });
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <Button
              variant="secondary"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                d.setHours(9, 0, 0, 0);
                onChange({ dueAt: d.getTime(), updatedAt: Date.now() });
              }}
              title="Set due to tomorrow"
            >
              Tomorrow
            </Button>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Tags
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => {
              const on = todo.tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    onChange({
                      tagIds: toggleInArray(todo.tagIds, t.id),
                      updatedAt: Date.now(),
                    })
                  }
                  className={
                    "rounded-full border px-3 py-1 text-xs font-semibold transition " +
                    (on
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900")
                  }
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
