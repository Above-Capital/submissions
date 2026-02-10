export type ThemeMode = "system" | "light" | "dark";

export type TodoItem = {
  id: string;
  text: string;
  createdAt: number;
  doneAt: number | null;
  dueAt: number | null;
  priority: 1 | 2 | 3;
  tags: string[];
};

export type TodoList = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  items: TodoItem[];
};

export type TodoExport = {
  version: 1;
  exportedAt: number;
  themeMode: ThemeMode;
  lists: TodoList[];
  activeListId: string | null;
};
