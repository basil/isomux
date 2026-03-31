import type { AgentOutfit } from "../shared/types.ts";
import { SHIRT_COLORS, HAIR_COLORS, SKIN_COLORS, HAIR_STYLES, BEARDS, HATS, ACCESSORIES } from "../shared/outfit-options.ts";

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
    hairStyle: HAIR_STYLES[(h >> 6) % HAIR_STYLES.length],
    skin: SKIN_COLORS[(h >> 3) % SKIN_COLORS.length],
    beard: BEARDS[(h >> 10) % BEARDS.length],
    accessory: ACCESSORIES[(h >> 8) % ACCESSORIES.length],
  };
}
