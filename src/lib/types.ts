export type ThemeMode = "system" | "light" | "dark";

export type PaperSize = "letter" | "a4";

export type ResumeTheme = {
  id: string;
  label: string;
  accent: string; // css color
  font: "sans" | "serif";
  density: "compact" | "cozy";
};

export type ResumeState = {
  version: 1;
  markdown: string;
  themeId: string;
  paper: PaperSize;
  showGuides: boolean;
  updatedAt: number;
};
