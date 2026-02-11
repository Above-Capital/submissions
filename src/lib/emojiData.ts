import { EmojiCategoryId, EmojiItem } from "./types";

// Curated compact dataset (fast, offline). Not exhaustive, but high quality.
// Add more entries if you want bigger coverage.
export const CATEGORIES: Array<{ id: EmojiCategoryId; label: string }> = [
  { id: "smileys", label: "Smileys" },
  { id: "people", label: "People" },
  { id: "nature", label: "Nature" },
  { id: "food", label: "Food" },
  { id: "activity", label: "Activity" },
  { id: "travel", label: "Travel" },
  { id: "objects", label: "Objects" },
  { id: "symbols", label: "Symbols" },
  { id: "flags", label: "Flags" },
];

const tones = {
  thumbsUp: ["👍", "👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿"],
  thumbsDown: ["👎", "👎🏻", "👎🏼", "👎🏽", "👎🏾", "👎🏿"],
  clap: ["👏", "👏🏻", "👏🏼", "👏🏽", "👏🏾", "👏🏿"],
  wave: ["👋", "👋🏻", "👋🏼", "👋🏽", "👋🏾", "👋🏿"],
  pray: ["🙏", "🙏🏻", "🙏🏼", "🙏🏽", "🙏🏾", "🙏🏿"],
  ok: ["👌", "👌🏻", "👌🏼", "👌🏽", "👌🏾", "👌🏿"],
  writing: ["✍️", "✍🏻", "✍🏼", "✍🏽", "✍🏾", "✍🏿"],
  personShrug: ["🤷", "🤷🏻", "🤷🏼", "🤷🏽", "🤷🏾", "🤷🏿"],
  personFacepalm: ["🤦", "🤦🏻", "🤦🏼", "🤦🏽", "🤦🏾", "🤦🏿"],
};

export const EMOJI: EmojiItem[] = [
  // Smileys
  { id: "grin", emoji: "😁", name: "grinning face with smiling eyes", keywords: ["grin", "happy"], category: "smileys" },
  { id: "joy", emoji: "😂", name: "face with tears of joy", keywords: ["lol", "laugh", "tears"], category: "smileys" },
  { id: "smile", emoji: "😊", name: "smiling face with smiling eyes", keywords: ["smile", "warm"], category: "smileys" },
  { id: "wink", emoji: "😉", name: "winking face", keywords: ["wink", "flirt"], category: "smileys" },
  { id: "sunglasses", emoji: "😎", name: "smiling face with sunglasses", keywords: ["cool"], category: "smileys" },
  { id: "thinking", emoji: "🤔", name: "thinking face", keywords: ["hmm", "think"], category: "smileys" },
  { id: "shrug", emoji: tones.personShrug[0], name: "person shrugging", keywords: ["shrug", "idk"], category: "people", tones: tones.personShrug },
  { id: "facepalm", emoji: tones.personFacepalm[0], name: "person facepalming", keywords: ["facepalm", "oops"], category: "people", tones: tones.personFacepalm },
  { id: "fire", emoji: "🔥", name: "fire", keywords: ["lit", "hot"], category: "nature" },
  { id: "sparkles", emoji: "✨", name: "sparkles", keywords: ["sparkle", "shine"], category: "symbols" },
  { id: "star", emoji: "⭐", name: "star", keywords: ["favorite"], category: "symbols" },
  { id: "heart", emoji: "❤️", name: "red heart", keywords: ["love"], category: "symbols" },
  { id: "broken_heart", emoji: "💔", name: "broken heart", keywords: ["sad"], category: "symbols" },
  { id: "skull", emoji: "💀", name: "skull", keywords: ["dead"], category: "symbols" },
  { id: "party", emoji: "🥳", name: "partying face", keywords: ["party", "celebrate"], category: "smileys" },

  // People / gestures
  { id: "thumbs_up", emoji: tones.thumbsUp[0], name: "thumbs up", keywords: ["like", "approve", "+1"], category: "people", tones: tones.thumbsUp },
  { id: "thumbs_down", emoji: tones.thumbsDown[0], name: "thumbs down", keywords: ["dislike", "no"], category: "people", tones: tones.thumbsDown },
  { id: "clap", emoji: tones.clap[0], name: "clapping hands", keywords: ["clap", "applause"], category: "people", tones: tones.clap },
  { id: "wave", emoji: tones.wave[0], name: "waving hand", keywords: ["hello", "hi", "bye"], category: "people", tones: tones.wave },
  { id: "pray", emoji: tones.pray[0], name: "folded hands", keywords: ["pray", "please", "thanks"], category: "people", tones: tones.pray },
  { id: "ok_hand", emoji: tones.ok[0], name: "OK hand", keywords: ["ok", "fine"], category: "people", tones: tones.ok },
  { id: "writing", emoji: tones.writing[0], name: "writing hand", keywords: ["write", "note"], category: "people", tones: tones.writing },

  // Nature
  { id: "sun", emoji: "☀️", name: "sun", keywords: ["sunny"], category: "nature" },
  { id: "cloud", emoji: "☁️", name: "cloud", keywords: ["cloud"], category: "nature" },
  { id: "rain", emoji: "🌧️", name: "cloud with rain", keywords: ["rain"], category: "nature" },
  { id: "snow", emoji: "🌨️", name: "cloud with snow", keywords: ["snow"], category: "nature" },
  { id: "zap", emoji: "⚡", name: "high voltage", keywords: ["zap", "lightning"], category: "nature" },
  { id: "tree", emoji: "🌳", name: "deciduous tree", keywords: ["tree"], category: "nature" },
  { id: "flower", emoji: "🌸", name: "cherry blossom", keywords: ["flower"], category: "nature" },

  // Food
  { id: "coffee", emoji: "☕", name: "hot beverage", keywords: ["coffee", "tea"], category: "food" },
  { id: "pizza", emoji: "🍕", name: "pizza", keywords: ["pizza"], category: "food" },
  { id: "taco", emoji: "🌮", name: "taco", keywords: ["taco"], category: "food" },
  { id: "burger", emoji: "🍔", name: "hamburger", keywords: ["burger"], category: "food" },
  { id: "salad", emoji: "🥗", name: "green salad", keywords: ["salad"], category: "food" },

  // Activity
  { id: "soccer", emoji: "⚽", name: "soccer ball", keywords: ["soccer", "football"], category: "activity" },
  { id: "basketball", emoji: "🏀", name: "basketball", keywords: ["basketball"], category: "activity" },
  { id: "music", emoji: "🎵", name: "musical note", keywords: ["music"], category: "activity" },
  { id: "mic", emoji: "🎤", name: "microphone", keywords: ["mic", "karaoke"], category: "activity" },
  { id: "camera", emoji: "📷", name: "camera", keywords: ["photo"], category: "objects" },

  // Travel
  { id: "car", emoji: "🚗", name: "car", keywords: ["car"], category: "travel" },
  { id: "airplane", emoji: "✈️", name: "airplane", keywords: ["flight"], category: "travel" },
  { id: "train", emoji: "🚆", name: "train", keywords: ["train"], category: "travel" },
  { id: "rocket", emoji: "🚀", name: "rocket", keywords: ["launch"], category: "travel" },

  // Objects
  { id: "laptop", emoji: "💻", name: "laptop", keywords: ["computer"], category: "objects" },
  { id: "phone", emoji: "📱", name: "mobile phone", keywords: ["phone"], category: "objects" },
  { id: "folder", emoji: "📁", name: "folder", keywords: ["folder"], category: "objects" },
  { id: "paperclip", emoji: "📎", name: "paperclip", keywords: ["attach"], category: "objects" },
  { id: "lock", emoji: "🔒", name: "lock", keywords: ["secure"], category: "objects" },

  // Symbols
  { id: "check", emoji: "✅", name: "check mark button", keywords: ["check", "done"], category: "symbols" },
  { id: "x", emoji: "❌", name: "cross mark", keywords: ["x", "no"], category: "symbols" },
  { id: "warning", emoji: "⚠️", name: "warning", keywords: ["warn"], category: "symbols" },
  { id: "info", emoji: "ℹ️", name: "information", keywords: ["info"], category: "symbols" },

  // Flags
  { id: "flag_us", emoji: "🇺🇸", name: "flag: United States", keywords: ["us", "usa"], category: "flags" },
  { id: "flag_gb", emoji: "🇬🇧", name: "flag: United Kingdom", keywords: ["uk", "gb"], category: "flags" },
  { id: "flag_ca", emoji: "🇨🇦", name: "flag: Canada", keywords: ["canada"], category: "flags" },
  { id: "flag_jp", emoji: "🇯🇵", name: "flag: Japan", keywords: ["japan"], category: "flags" },
];
