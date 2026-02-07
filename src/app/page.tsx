"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ID, Project, Tag, Todo, TodoDB } from "@/lib/todoTypes";
import { defaultDB, downloadJSON, loadDB, saveDB } from "@/lib/todoStorage";
import { uid } from "@/lib/todoUtils";
import { Sidebar } from "@/components/Sidebar";
import { TodoList } from "@/components/TodoList";
import { TodoDetails } from "@/components/TodoDetails";
import { Button, Icon, Input } from "@/components/ui";

const iconSearch = "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z";
const iconPlus = "M12 5v14M5 12h14";
const iconExport = "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16";
const iconImport = "M12 21V9m0 0 4 4m-4-4-4 4M4 3h16";

function viewTitle(view: TodoDB["ui"]["selectedView"], projects: Project[], tags: Tag[]) {
  if (view.kind === "inbox") return "Inbox";
  if (view.kind === "today") return "Today";
  if (view.kind === "upcoming") return "Upcoming";
  if (view.kind === "overdue") return "Overdue";
  if (view.kind === "completed") return "Completed";
  if (view.kind === "project") return projects.find((p) => p.id === view.projectId)?.name ?? "Project";
  if (view.kind === "tag") return `#${tags.find((t) => t.id === view.tagId)?.name ?? "Tag"}`;
  return "Todos";
}

function filterTodos(db: TodoDB, query: string) {
  const v = db.ui.selectedView;
  const q = query.trim().toLowerCase();
  const now = Date.now();
  const d0 = new Date();
  d0.setHours(0, 0, 0, 0);
  const today0 = d0.getTime();
  const today1 = today0 + 24 * 3600 * 1000;

  const base = db.todos.filter((t) => {
    if (v.kind !== "completed" && t.completedAt && !db.settings.showCompletedByDefault) return false;

    if (v.kind === "inbox") {
      // no additional filter
    } else if (v.kind === "today") {
      if (t.dueAt === null) return false;
      if (!(t.dueAt >= today0 && t.dueAt < today1)) return false;
    } else if (v.kind === "upcoming") {
      if (t.dueAt === null) return false;
      if (!(t.dueAt >= today1)) return false;
    } else if (v.kind === "overdue") {
      if (t.dueAt === null) return false;
      if (!(t.dueAt < now)) return false;
      if (t.completedAt) return false;
    } else if (v.kind === "completed") {
      if (!t.completedAt) return false;
    } else if (v.kind === "project") {
      if (t.projectId !== v.projectId) return false;
    } else if (v.kind === "tag") {
      if (!t.tagIds.includes(v.tagId)) return false;
    }

    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.notes.toLowerCase().includes(q)
    );
  });

  return base;
}

export default function Home() {
  const [db, setDB] = useState<TodoDB>(() => defaultDB());
  const [query, setQuery] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const quickRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDB(loadDB());
  }, []);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const projects = useMemo(() => [...db.projects].sort((a, b) => a.order - b.order), [db.projects]);
  const tags = useMemo(() => [...db.tags].sort((a, b) => a.name.localeCompare(b.name)), [db.tags]);

  const filtered = useMemo(() => filterTodos(db, query), [db, query]);

  const selectedTodo = useMemo(() => {
    const id = db.ui.selectedTodoId;
    return id ? db.todos.find((t) => t.id === id) ?? null : null;
  }, [db.todos, db.ui.selectedTodoId]);

  const title = viewTitle(db.ui.selectedView, projects, tags);

  function setView(view: TodoDB["ui"]["selectedView"]) {
    setDB((prev) => ({
      ...prev,
      ui: { ...prev.ui, selectedView: view, selectedTodoId: null },
    }));
  }

  function selectTodo(id: ID) {
    setDB((prev) => ({ ...prev, ui: { ...prev.ui, selectedTodoId: id } }));
  }

  function addTodoFromText(text: string) {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();

    const defaultProjectId = db.projects[0]?.id ?? null;

    const todo: Todo = {
      id: uid("todo"),
      title: t,
      notes: "",
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      dueAt: null,
      priority: 0,
      projectId:
        db.ui.selectedView.kind === "project"
          ? db.ui.selectedView.projectId
          : defaultProjectId,
      tagIds: db.ui.selectedView.kind === "tag" ? [db.ui.selectedView.tagId] : [],
      order: (Math.max(0, ...db.todos.map((x) => x.order)) || 0) + 1000,
    };

    setDB((prev) => ({ ...prev, todos: [...prev.todos, todo], ui: { ...prev.ui, selectedTodoId: todo.id } }));
  }

  function toggleComplete(id: ID) {
    setDB((prev) => ({
      ...prev,
      todos: prev.todos.map((t) =>
        t.id === id
          ? { ...t, completedAt: t.completedAt ? null : Date.now(), updatedAt: Date.now() }
          : t
      ),
    }));
  }

  function patchTodo(id: ID, patch: Partial<Todo>) {
    setDB((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }

  function deleteTodo(id: ID) {
    setDB((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => t.id !== id),
      ui: { ...prev.ui, selectedTodoId: prev.ui.selectedTodoId === id ? null : prev.ui.selectedTodoId },
    }));
  }

  function duplicateTodo(id: ID) {
    const base = db.todos.find((t) => t.id === id);
    if (!base) return;
    const now = Date.now();
    const copy: Todo = {
      ...base,
      id: uid("todo"),
      title: base.title + " (copy)",
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      order: (Math.max(0, ...db.todos.map((x) => x.order)) || 0) + 1000,
    };
    setDB((prev) => ({ ...prev, todos: [...prev.todos, copy], ui: { ...prev.ui, selectedTodoId: copy.id } }));
  }

  function reorder(activeId: ID, overId: ID) {
    setDB((prev) => {
      const todos = [...prev.todos];
      const a = todos.find((t) => t.id === activeId);
      const b = todos.find((t) => t.id === overId);
      if (!a || !b) return prev;

      // swap order values (simple + stable)
      const ao = a.order;
      a.order = b.order;
      b.order = ao;
      a.updatedAt = Date.now();
      b.updatedAt = Date.now();

      return { ...prev, todos };
    });
  }

  function newProject() {
    const name = prompt("Project name?");
    if (!name) return;
    const now = Date.now();
    const project: Project = {
      id: uid("proj"),
      name: name.trim(),
      color: "zinc",
      createdAt: now,
      order: (Math.max(0, ...db.projects.map((p) => p.order)) || 0) + 1000,
    };
    setDB((prev) => ({ ...prev, projects: [...prev.projects, project] }));
    setView({ kind: "project", projectId: project.id });
  }

  function newTag() {
    const name = prompt("Tag name?");
    if (!name) return;
    const now = Date.now();
    const tag: Tag = {
      id: uid("tag"),
      name: name.trim(),
      color: "zinc",
      createdAt: now,
    };
    setDB((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setView({ kind: "tag", tagId: tag.id });
  }

  function exportData() {
    const json = JSON.stringify(db, null, 2);
    downloadJSON(`todo-export-${new Date().toISOString().slice(0, 10)}.json`, json);
  }

  async function importData(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as TodoDB;
    if (!parsed || parsed.version !== 1) {
      alert("Invalid file (expected version 1). ");
      return;
    }
    setDB(parsed);
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        (e.target as any)?.tagName === "INPUT" ||
        (e.target as any)?.tagName === "TEXTAREA" ||
        (e.target as any)?.isContentEditable;

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key.toLowerCase() === "n" && !isTyping) {
        e.preventDefault();
        setShowQuickAdd(true);
        setTimeout(() => quickRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setShowQuickAdd(false);
        setQuery("");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        exportData();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [db]);

  const left = (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              N: new · /: search · Ctrl/Cmd+E: export
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                fileRef.current?.click();
              }}
              title="Import JSON"
            >
              <Icon path={iconImport} className="h-4 w-4" />
              Import
            </Button>
            <Button variant="secondary" onClick={exportData} title="Export JSON">
              <Icon path={iconExport} className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                setShowQuickAdd(true);
                setTimeout(() => quickRef.current?.focus(), 0);
              }}
              title="New todo (N)"
            >
              <Icon path={iconPlus} className="h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-zinc-500">
            <Icon path={iconSearch} className="h-4 w-4" />
          </span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and notes (/ to focus)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <Button
            variant="ghost"
            onClick={() =>
              setDB((p) => ({
                ...p,
                settings: {
                  ...p.settings,
                  showCompletedByDefault: !p.settings.showCompletedByDefault,
                },
              }))
            }
            title="Toggle showing completed"
          >
            {db.settings.showCompletedByDefault ? "Hide done" : "Show done"}
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <TodoList
        db={db}
        todos={filtered}
        selectedTodoId={db.ui.selectedTodoId}
        onSelectTodo={selectTodo}
        onToggleComplete={toggleComplete}
        onRename={(id, title) => patchTodo(id, { title, updatedAt: Date.now() })}
        onReorder={reorder}
      />

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">Tips</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Drag and drop tasks to reorder.</li>
          <li>Everything is stored locally (no login, no backend).</li>
          <li>Import/export JSON is built in.</li>
        </ul>
      </div>
    </div>
  );

  const right = (
    <div className="grid gap-4">
      <TodoDetails
        todo={selectedTodo}
        projects={projects}
        tags={tags}
        onChange={(patch) => selectedTodo && patchTodo(selectedTodo.id, patch)}
        onDelete={deleteTodo}
        onDuplicate={duplicateTodo}
      />

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Stats
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Open</div>
            <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {db.todos.filter((t) => !t.completedAt).length}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Done</div>
            <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {db.todos.filter((t) => !!t.completedAt).length}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Sidebar
            db={db}
            projects={projects}
            tags={tags}
            onSelectView={setView}
            onNewProject={newProject}
            onNewTag={newTag}
            collapsed={db.ui.sidebarCollapsed}
            onToggleCollapsed={() =>
              setDB((p) => ({ ...p, ui: { ...p.ui, sidebarCollapsed: !p.ui.sidebarCollapsed } }))
            }
          />

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {left}
            {right}
          </div>
        </div>

        <footer className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
          Built for OpenClaw Arena · Frontend-only · Next.js + Tailwind · Offline-first
        </footer>
      </div>

      {showQuickAdd ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Quick add
                </div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Enter to add · Esc to close
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowQuickAdd(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4">
              <Input
                value={quickAdd}
                onChange={setQuickAdd}
                placeholder="e.g. Submit Arena build"
                ariaLabel="Quick add"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTodoFromText(quickAdd);
                    setQuickAdd("");
                    setShowQuickAdd(false);
                  }
                  if (e.key === "Escape") {
                    setShowQuickAdd(false);
                  }
                }}
                className="text-base"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => {
                  const d = defaultDB();
                  setDB(d);
                  setShowQuickAdd(false);
                  setQuickAdd("");
                }}
                title="Reset local data"
              >
                Reset demo data
              </Button>
              <Button
                onClick={() => {
                  addTodoFromText(quickAdd);
                  setQuickAdd("");
                  setShowQuickAdd(false);
                }}
                disabled={!quickAdd.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
