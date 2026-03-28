import type { AgentOutfit } from "./types.ts";

export const SHIRT_COLORS = [
  "#4A90D9", "#E85D75", "#50B86C", "#D4A843",
  "#9B6DFF", "#FF8C42", "#45B7D1", "#FF6B9D",
];

export const HAIR_COLORS = [
  "#3a2a1a", "#8B4513", "#1a1a2e", "#C4A265",
  "#2a1a1a", "#5a3a1a", "#222", "#8a5a3a",
];

export const HATS: AgentOutfit["hat"][] = ["none", "cap", "beanie"];
export const ACCESSORIES: AgentOutfit["accessory"][] = [null, "glasses", "headphones"];
