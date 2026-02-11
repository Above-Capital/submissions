export type Snippet = {
  id: string;
  title: string;
  language: string;
  tags: string[];
  content: string;
  createdAt: number;
  updatedAt: number;
  lastViewedAt?: number;
  vibe?: "seed" | "spark" | "anchor" | "wind";
  position?: { x: number; y: number };
};

export type GardenState = {
  version: 1;
  snippets: Snippet[];
  selectedId?: string;
  activeTag?: string;
  whisper?: string;
};
