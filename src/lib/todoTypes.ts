export type ID = string;

export type Priority = 0 | 1 | 2 | 3; // 0 none, 1 low, 2 medium, 3 high

export type Todo = {
  id: ID;
  title: string;
  notes: string;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  dueAt: number | null; // local timestamp
  priority: Priority;
  projectId: ID | null;
  tagIds: ID[];
  order: number;
};

export type Project = {
  id: ID;
  name: string;
  color: string; // tailwind-ish name
  createdAt: number;
  order: number;
};

export type Tag = {
  id: ID;
  name: string;
  color: string;
  createdAt: number;
};

export type TodoDB = {
  version: 1;
  todos: Todo[];
  projects: Project[];
  tags: Tag[];
  ui: {
    selectedView:
      | { kind: "inbox" }
      | { kind: "today" }
      | { kind: "upcoming" }
      | { kind: "overdue" }
      | { kind: "completed" }
      | { kind: "project"; projectId: ID }
      | { kind: "tag"; tagId: ID };
    selectedTodoId: ID | null;
    sidebarCollapsed: boolean;
  };
  settings: {
    showCompletedByDefault: boolean;
  };
};
