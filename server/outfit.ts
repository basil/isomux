import type { AgentOutfit } from "../shared/types.ts";
import { SHIRT_COLORS, HAIR_COLORS, HATS, ACCESSORIES } from "../shared/outfit-options.ts";

// Simple string hash
function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function generateOutfit(name: string): AgentOutfit {
  const h = hashName(name);
  return {
    hat: HATS[h % HATS.length],
    color: SHIRT_COLORS[h % SHIRT_COLORS.length],
    hair: HAIR_COLORS[(h >> 4) % HAIR_COLORS.length],
    accessory: ACCESSORIES[(h >> 8) % ACCESSORIES.length],
  };
}
