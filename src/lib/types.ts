export type ThemeMode = "system" | "light" | "dark";

export type ChatMessage = {
  id: string;
  role: "you" | "assistant";
  text: string;
  createdAt: number; // epoch ms
};

export type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type ChatExport = {
  version: 1;
  exportedAt: number;
  themeMode: ThemeMode;
  threads: ChatThread[];
};
