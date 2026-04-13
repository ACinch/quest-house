import type { TieredChestPool, ChestRewardSlip, ChestTier } from "@/lib/types";

/**
 * Winter's treasure chest reward pool, organized by ore tier.
 *
 * Tier drop weights are configured in AppConfig.tierDropRates
 * (default: stone 35, iron 30, gold 20, diamond 12, netherite 3).
 * When a chest drops, the store rolls a tier first (weighted) and
 * then picks one slip from that tier uniformly at random.
 *
 * All rewards are bankable — chests go into Winter's inventory
 * (UserState.inventory) and stay there until Winter or a parent
 * marks them redeemed.
 *
 * Parents can edit this pool in Settings → Chest Pool. Winter
 * cannot see it — rewards stay secret until pulled.
 *
 * Special reward: "Extra pull from tier of choice" (gold tier) is
 * a wildcard. When Winter redeems the inventory item, the UI
 * prompts him to pick any tier, then rolls a fresh reward from
 * that tier and adds it to his inventory. The store tags this
 * slip's inventory entry with wildcardKind: "tier_choice".
 */

const slip = (
  id: string,
  text: string,
  category: string,
  tier: ChestTier
): ChestRewardSlip => ({ id, text, category, tier });

export const DEFAULT_WINTER_CHEST_POOL: TieredChestPool = {
  stone: [
    slip("w_s_1", "Bonus $1 on Greenlight card", "Money", "stone"),
    slip("w_s_2", "Bonus dessert", "Treat", "stone"),
    slip("w_s_3", "Extra 15 min of Roblox", "Time", "stone"),
    slip(
      "w_s_4",
      "10 min undivided parent attention — Winter picks what to show",
      "Experience",
      "stone"
    ),
    slip("w_s_5", "Download one free app or game", "Digital", "stone"),
    slip(
      "w_s_6",
      "Build a blanket fort and use it all day",
      "Experience",
      "stone"
    ),
    slip("w_s_7", "Glow stick bath/shower", "Experience", "stone"),
  ],
  iron: [
    slip("w_i_1", "Bonus $2 on Greenlight card", "Money", "iron"),
    slip("w_i_2", "30 extra min of Roblox", "Time", "iron"),
    slip("w_i_3", "Pick the family movie/show", "Choice", "iron"),
    slip("w_i_4", "Skip one chore", "Power-up", "iron"),
    slip("w_i_5", "Pick a new app theme/skin", "Meta", "iron"),
    slip("w_i_6", "Mochi donut", "Treat", "iron"),
    slip("w_i_7", "Low tier blind box ($3–$6)", "Collectible", "iron"),
  ],
  gold: [
    slip("w_g_1", "Bonus $3 on Greenlight card", "Money", "gold"),
    slip("w_g_2", "Skip 1 class for the day", "Power-up", "gold"),
    slip("w_g_3", "Small store treat (under $5)", "Treat", "gold"),
    slip("w_g_4", "Extra pull from tier of choice", "Wildcard", "gold"),
    slip("w_g_5", "Pokémon booster pack", "Collectible", "gold"),
    slip("w_g_6", "Mid tier blind box ($7–$13)", "Collectible", "gold"),
    slip("w_g_7", "Pick the car music all day", "Choice", "gold"),
    slip(
      "w_g_8",
      "Design a custom quest for Quest House",
      "Meta",
      "gold"
    ),
    slip("w_g_9", "Geocaching trip", "Experience", "gold"),
  ],
  diamond: [
    slip("w_d_1", "Bonus $5 on Greenlight card", "Money", "diamond"),
    slip(
      "w_d_2",
      "Co-op gaming session with parent(s)",
      "Experience",
      "diamond"
    ),
    slip("w_d_3", "Double scoop ice cream/gelato", "Treat", "diamond"),
    slip(
      "w_d_4",
      "Bake a treat solo or with parent",
      "Experience",
      "diamond"
    ),
    slip("w_d_5", "Extra hour of Roblox", "Time", "diamond"),
    slip("w_d_6", "Premium blind box ($14–$20)", "Collectible", "diamond"),
    slip("w_d_7", "Pick a day trip destination", "Experience", "diamond"),
    slip("w_d_8", "Escape room outing", "Experience", "diamond"),
  ],
  netherite: [
    slip("w_n_1", "Bonus $7 on Greenlight card", "Money", "netherite"),
    slip("w_n_2", "Bonus $9 on Greenlight card", "Money", "netherite"),
    slip("w_n_3", "L'orion Theater night", "Experience", "netherite"),
    slip(
      "w_n_4",
      "Amazon wishlist item (under $50)",
      "Gift",
      "netherite"
    ),
    slip("w_n_5", "Epic blind box ($21–$35)", "Collectible", "netherite"),
  ],
};

// ==================================================================
// Tier metadata
// ==================================================================

export interface ChestTierMeta {
  id: ChestTier;
  displayName: string;
  /** Hex color for borders / backgrounds. */
  color: string;
  /** Secondary hex color for gradient highlights. */
  accent: string;
  /** Default weight — must match AppConfig.tierDropRates defaults. */
  defaultWeight: number;
  /** Emoji icon for the tier. */
  icon: string;
}

export const CHEST_TIER_META: Record<ChestTier, ChestTierMeta> = {
  stone: {
    id: "stone",
    displayName: "Stone",
    color: "#7F7F7F",
    accent: "#A8A8A8",
    defaultWeight: 35,
    icon: "🪨",
  },
  iron: {
    id: "iron",
    displayName: "Iron",
    color: "#C4C4C4",
    accent: "#E0E0E0",
    defaultWeight: 30,
    icon: "⚙️",
  },
  gold: {
    id: "gold",
    displayName: "Gold",
    color: "#FFD700",
    accent: "#FFEB70",
    defaultWeight: 20,
    icon: "🥇",
  },
  diamond: {
    id: "diamond",
    displayName: "Diamond",
    color: "#4AEDD9",
    accent: "#9AF5E7",
    defaultWeight: 12,
    icon: "💎",
  },
  netherite: {
    id: "netherite",
    displayName: "Netherite",
    color: "#4A3A3A",
    accent: "#8A6A6A",
    defaultWeight: 3,
    icon: "🖤",
  },
};

export const CHEST_TIER_ORDER: ChestTier[] = [
  "stone",
  "iron",
  "gold",
  "diamond",
  "netherite",
];

// ==================================================================
// Helpers
// ==================================================================

/** Roll a tier using the provided weights (default: config values). */
export function rollChestTier(
  weights: Record<ChestTier, number>,
  rng: () => number = Math.random
): ChestTier {
  const total = CHEST_TIER_ORDER.reduce((sum, t) => sum + (weights[t] || 0), 0);
  if (total <= 0) return "stone";
  let roll = rng() * total;
  for (const tier of CHEST_TIER_ORDER) {
    roll -= weights[tier] || 0;
    if (roll <= 0) return tier;
  }
  return "stone";
}

/** Uniform random slip from a single tier. Returns null if empty. */
export function pickSlipFromTier(
  pool: TieredChestPool,
  tier: ChestTier,
  rng: () => number = Math.random
): ChestRewardSlip | null {
  const slips = pool[tier];
  if (!slips || slips.length === 0) return null;
  return slips[Math.floor(rng() * slips.length)];
}

/**
 * Full roll — pick a tier (weighted) then a slip (uniform). Falls back
 * to adjacent tiers if the chosen tier is empty (shouldn't happen with
 * the default pool but keeps the runtime defensive).
 */
export function rollWinterChest(
  pool: TieredChestPool,
  weights: Record<ChestTier, number>,
  rng: () => number = Math.random
): { tier: ChestTier; slip: ChestRewardSlip } | null {
  const primaryTier = rollChestTier(weights, rng);
  const primary = pickSlipFromTier(pool, primaryTier, rng);
  if (primary) return { tier: primaryTier, slip: primary };

  // Fallback: walk adjacent tiers until we find a non-empty one.
  for (const tier of CHEST_TIER_ORDER) {
    const slip = pickSlipFromTier(pool, tier, rng);
    if (slip) return { tier, slip };
  }
  return null;
}
