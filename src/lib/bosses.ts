import type {
  ActiveBoss,
  BossConfig,
  BossParticipant,
  BossTierThreshold,
  ChestTier,
  UserId,
} from "./types";

/**
 * Pure helpers for the Weekly Boss feature. No side effects, no
 * store coupling — everything here takes state as input and returns
 * new values. The store imports these and does the set() dance.
 */

// ==================================================================
// HP math
// ==================================================================

/**
 * Total HP for a spawning/active boss = sum of damage across all
 * currently-active tasks (regular + custom).
 */
export function computeTotalHP(boss: ActiveBoss): number {
  let total = 0;
  for (const task of Object.values(boss.tasks)) {
    if (task.active) total += task.damage;
  }
  // Custom tasks are always active (no toggle state for them).
  for (const t of boss.customTasks) total += t.damage;
  return total;
}

/**
 * Recompute `totalHP` and `currentHP` assuming no damage has landed.
 * Only legal while `status === "spawning"` — once the fight starts,
 * tasks are locked and this helper shouldn't be called.
 */
export function recomputeSpawningHP(boss: ActiveBoss): ActiveBoss {
  const total = computeTotalHP(boss);
  return { ...boss, totalHP: total, currentHP: total };
}

// ==================================================================
// Damage percent computation
// ==================================================================

export interface ParticipantDamageShare {
  userId: UserId;
  damageDealt: number;
  damagePercent: number;
}

/**
 * Compute per-participant damage percentages with floor + remainder-
 * to-highest-damage tiebreak so everyone's percentages add up to
 * exactly 100. Tiebreak: participant with the highest raw damage
 * gets the rounding crumb. If multiple participants are tied on
 * damage, the one whose id sorts first wins (deterministic across
 * runs).
 */
export function computeDamageShares(
  participants: Record<string, BossParticipant>,
  totalDamageDealt: number
): ParticipantDamageShare[] {
  const entries = Object.values(participants);
  if (entries.length === 0 || totalDamageDealt <= 0) {
    return entries.map((p) => ({
      userId: p.userId,
      damageDealt: p.damageDealt,
      damagePercent: 0,
    }));
  }

  // Exact percentages (float), then floor, then distribute the
  // remainder to the participant with the highest damage.
  const exact = entries.map((p) => ({
    userId: p.userId,
    damageDealt: p.damageDealt,
    raw: (p.damageDealt / totalDamageDealt) * 100,
  }));

  const floored = exact.map((e) => ({
    ...e,
    percent: Math.floor(e.raw),
  }));

  const sumFloored = floored.reduce((s, e) => s + e.percent, 0);
  let remainder = 100 - sumFloored;

  if (remainder > 0) {
    // Sort by (damageDealt desc, userId asc) for deterministic tiebreak.
    const order = [...floored].sort((a, b) => {
      if (b.damageDealt !== a.damageDealt) {
        return b.damageDealt - a.damageDealt;
      }
      return a.userId.localeCompare(b.userId);
    });
    // Distribute one point at a time to the top participants until
    // remainder is exhausted.
    let i = 0;
    while (remainder > 0) {
      const winner = order[i % order.length];
      const target = floored.find((e) => e.userId === winner.userId);
      if (target) target.percent += 1;
      remainder -= 1;
      i += 1;
    }
  }

  return floored.map((e) => ({
    userId: e.userId,
    damageDealt: e.damageDealt,
    damagePercent: e.percent,
  }));
}

// ==================================================================
// Tier + bonus XP
// ==================================================================

/**
 * Map a damage percentage to a chest tier. Uses inclusive-lower /
 * exclusive-upper bounds from BossConfig.tierThresholds so float
 * percentages don't fall in between tiers. Per locked decision #4,
 * any non-zero participation floors to Stone tier even if below
 * the Stone range's minimum.
 */
export function tierFromPercent(
  percent: number,
  config: BossConfig
): ChestTier | null {
  if (percent <= 0) return null;

  const tiers: ChestTier[] = ["stone", "iron", "gold", "diamond", "netherite"];
  for (const tier of tiers) {
    const threshold = config.tierThresholds[tier];
    if (percent >= threshold.minPct && percent < threshold.maxPctExclusive) {
      return tier;
    }
  }

  // <1% participation — floor to stone since any participation > 0
  // earns the minimum reward.
  if (percent > 0 && percent < config.tierThresholds.stone.minPct) {
    return "stone";
  }
  // 100% exactly — Netherite's upper bound is exclusive of 101, so
  // 100 falls in the netherite range. Handled in the loop above.
  return null;
}

/** Look up bonus XP for a resolved chest tier. */
export function bonusXPForTier(
  tier: ChestTier,
  config: BossConfig
): number {
  return config.tierThresholds[tier].bonusXP;
}

// ==================================================================
// Default tier thresholds (used by defaults.ts)
// ==================================================================

export const DEFAULT_BOSS_TIER_THRESHOLDS: Record<ChestTier, BossTierThreshold> = {
  stone: { minPct: 1, maxPctExclusive: 11, bonusXP: 5 },
  iron: { minPct: 11, maxPctExclusive: 26, bonusXP: 10 },
  gold: { minPct: 26, maxPctExclusive: 46, bonusXP: 15 },
  diamond: { minPct: 46, maxPctExclusive: 71, bonusXP: 25 },
  netherite: { minPct: 71, maxPctExclusive: 101, bonusXP: 40 },
};

// ==================================================================
// Week window helpers
// ==================================================================

/** Returns the ISO date (YYYY-MM-DD) of the Sunday starting a week. */
export function weekStartForDate(d: Date = new Date()): string {
  const day = d.getDay(); // 0 = Sunday
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}

/** Returns the Saturday that closes the week containing weekStart. */
export function weekEndForStart(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d.toISOString().slice(0, 10);
}
