import { ResumeTheme } from "./types";

export const THEMES: ResumeTheme[] = [
  { id: "aurora", label: "Aurora", accent: "#4f46e5", font: "sans", density: "cozy" },
  { id: "graphite", label: "Graphite", accent: "#0f172a", font: "sans", density: "compact" },
  { id: "clay", label: "Clay", accent: "#c2410c", font: "serif", density: "cozy" },
  { id: "mint", label: "Mint", accent: "#059669", font: "sans", density: "cozy" },
];

export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
