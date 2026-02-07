import React from "react";
import type { ID, Project, Tag, TodoDB } from "@/lib/todoTypes";
import { Button, Icon } from "@/components/ui";

const iconInbox = "M22 12h-6l-2 3h-4l-2-3H2";
const iconCalendar = "M8 2v3M16 2v3M3 7h18M5 11h14M7 15h10";
const iconClock = "M12 8v4l3 2";
const iconCheck = "M20 6 9 17l-5-5";
const iconFolder = "M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z";
const iconTag =
  "M20 13l-7 7-10-10V3h7l10 10z M7.5 7.5h.01";

function countForView(db: TodoDB, kind: string, id?: ID) {
  const now = Date.now();
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const today0 = startToday.getTime();
  const today1 = today0 + 24 * 3600 * 1000;

  return db.todos.filter((t) => {
    if (kind !== "completed" && t.completedAt) return false;
    if (kind === "inbox") return true;
    if (kind === "today") return t.dueAt !== null && t.dueAt >= today0 && t.dueAt < today1;
    if (kind === "upcoming") return t.dueAt !== null && t.dueAt >= today1;
    if (kind === "overdue") return t.dueAt !== null && t.dueAt < now;
    if (kind === "completed") return !!t.completedAt;
    if (kind === "project") return t.projectId === id;
    if (kind === "tag") return t.tagIds.includes(id!);
    return true;
  }).length;
}

function NavItem({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition " +
        (active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900")
      }
    >
      <span className="flex items-center gap-2">
        <span
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg " +
            (active
              ? "bg-white/15 dark:bg-black/10"
              : "bg-zinc-200/60 dark:bg-zinc-800")
          }
        >
          {icon}
        </span>
        {label}
      </span>
      <span
        className={
          "rounded-full px-2 py-0.5 text-xs " +
          (active
            ? "bg-white/15 text-white dark:bg-black/10 dark:text-black"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300")
        }
      >
        {count}
      </span>
    </button>
  );
}

export function Sidebar({
  db,
  projects,
  tags,
  onSelectView,
  onNewProject,
  onNewTag,
  collapsed,
  onToggleCollapsed,
}: {
  db: TodoDB;
  projects: Project[];
  tags: Tag[];
  onSelectView: (view: TodoDB["ui"]["selectedView"]) => void;
  onNewProject: () => void;
  onNewTag: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const view = db.ui.selectedView;

  return (
    <aside
      className={
        "rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 " +
        (collapsed ? "lg:w-[84px]" : "")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {collapsed ? "Todo" : "Todo"}
          </div>
          {!collapsed ? (
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              N: new · /: search
            </div>
          ) : null}
        </div>
        <Button
          variant="ghost"
          onClick={onToggleCollapsed}
          className="px-2"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <span className="text-xs">{collapsed ? "»" : "«"}</span>
        </Button>
      </div>

      <div className="mt-4 grid gap-2">
        <NavItem
          active={view.kind === "inbox"}
          label={collapsed ? "" : "Inbox"}
          count={countForView(db, "inbox")}
          icon={<Icon path={iconInbox} className="h-4 w-4" />}
          onClick={() => onSelectView({ kind: "inbox" })}
        />
        <NavItem
          active={view.kind === "today"}
          label={collapsed ? "" : "Today"}
          count={countForView(db, "today")}
          icon={<Icon path={iconCalendar} className="h-4 w-4" />}
          onClick={() => onSelectView({ kind: "today" })}
        />
        <NavItem
          active={view.kind === "upcoming"}
          label={collapsed ? "" : "Upcoming"}
          count={countForView(db, "upcoming")}
          icon={<Icon path={iconClock} className="h-4 w-4" />}
          onClick={() => onSelectView({ kind: "upcoming" })}
        />
        <NavItem
          active={view.kind === "overdue"}
          label={collapsed ? "" : "Overdue"}
          count={countForView(db, "overdue")}
          icon={<Icon path={iconClock} className="h-4 w-4" />}
          onClick={() => onSelectView({ kind: "overdue" })}
        />
        <NavItem
          active={view.kind === "completed"}
          label={collapsed ? "" : "Completed"}
          count={countForView(db, "completed")}
          icon={<Icon path={iconCheck} className="h-4 w-4" />}
          onClick={() => onSelectView({ kind: "completed" })}
        />
      </div>

      {!collapsed ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Projects
            </div>
            <Button variant="ghost" onClick={onNewProject} className="px-2">
              +
            </Button>
          </div>
          <div className="mt-2 grid gap-1">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectView({ kind: "project", projectId: p.id })}
                className={
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition " +
                  (view.kind === "project" && view.projectId === p.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900")
                }
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200/60 dark:bg-zinc-800">
                    <Icon path={iconFolder} className="h-4 w-4" />
                  </span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  {countForView(db, "project", p.id)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!collapsed ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tags
            </div>
            <Button variant="ghost" onClick={onNewTag} className="px-2">
              +
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectView({ kind: "tag", tagId: t.id })}
                className={
                  "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 " +
                  (view.kind === "tag" && view.tagId === t.id
                    ? "ring-2 ring-zinc-300 dark:ring-zinc-700"
                    : "")
                }
              >
                <Icon path={iconTag} className="h-3.5 w-3.5" />
                {t.name}
                <span className="text-[10px] opacity-70">
                  {countForView(db, "tag", t.id)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
