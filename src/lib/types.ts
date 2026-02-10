export type ThemeMode = "system" | "light" | "dark";

export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
};

export type NotesExport = {
  version: 1;
  exportedAt: number;
  themeMode: ThemeMode;
  notes: Note[];
  activeId: string | null;
};
