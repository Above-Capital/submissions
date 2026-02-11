export type EmojiCategoryId =
  | "smileys"
  | "people"
  | "nature"
  | "food"
  | "activity"
  | "travel"
  | "objects"
  | "symbols"
  | "flags";

export type EmojiItem = {
  id: string;
  emoji: string;
  name: string;
  keywords: string[];
  category: EmojiCategoryId;
  // optional list of tone variants (same base meaning)
  tones?: string[];
};

export type PickerState = {
  version: 1;
  favorites: string[]; // ids
  recents: string[]; // ids
  skinTone: 0 | 1 | 2 | 3 | 4 | 5; // 0 = default
};
