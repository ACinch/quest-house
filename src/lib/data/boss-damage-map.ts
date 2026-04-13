import type { BossZone } from "@/lib/types";

/**
 * Damage contribution from skill-tree task completions, looked up
 * by skill id. When a user completes a skill, the store checks this
 * map; if there's an entry AND the active boss's zone matches (or
 * the entry's zone is "any"), the skill also deals damage to the
 * active boss.
 *
 * The "any" zone means the skill applies to whichever boss is
 * currently active — e.g. f_sweep/f_vacuum/f_mop can reasonably
 * count for any room boss because the task happens wherever the
 * fight is.
 *
 * Damage values are calibrated from the spec's Master Damage Table
 * where listed, and from the "Damage Value Quick Reference" ranges
 * elsewhere (Trivial 2-3, Quick 5, Standard 8-10, Solid 12-15,
 * Heavy 18-20, Major 25-30, Boss-tier 35-50).
 *
 * Skills NOT in this map deal zero damage — they live in domains
 * that don't correspond to any boss zone (Winter's own bathroom,
 * laundry, home maintenance, outdoor, life skills, towels, hidden).
 */

export interface BossDamageEntry {
  zone: BossZone | "any";
  damage: number;
}

// ==================================================================
// Winter — keyed by skill id (web model, globally unique)
// ==================================================================

export const WINTER_SKILL_BOSS_DAMAGE: Record<string, BossDamageEntry> = {
  // Kitchen domain
  k_put_away_dishes: { zone: "kitchen", damage: 3 },
  k_unload_dishwasher: { zone: "kitchen", damage: 5 },
  k_load_dishwasher: { zone: "kitchen", damage: 8 },
  k_hand_wash: { zone: "kitchen", damage: 10 },
  k_wipe_counters: { zone: "kitchen", damage: 5 },
  k_clean_stovetop: { zone: "kitchen", damage: 12 },
  k_clean_microwave: { zone: "kitchen", damage: 10 },
  k_clean_oven: { zone: "kitchen", damage: 18 },
  k_clean_fridge: { zone: "kitchen", damage: 15 },
  k_sweep_kitchen: { zone: "kitchen", damage: 8 },
  k_mop_kitchen: { zone: "kitchen", damage: 10 },
  k_clean_sink: { zone: "kitchen", damage: 10 },
  k_trash_out: { zone: "kitchen", damage: 3 },
  k_replace_trash_bag: { zone: "kitchen", damage: 2 },
  k_wipe_cabinets: { zone: "kitchen", damage: 10 },
  k_clean_appliances: { zone: "kitchen", damage: 8 },

  // Bathroom half-bath domain
  bh_wipe_sink: { zone: "bathroom_half", damage: 5 },
  bh_clean_mirror: { zone: "bathroom_half", damage: 5 },
  bh_toilet_exterior: { zone: "bathroom_half", damage: 8 },
  bh_toilet_bowl: { zone: "bathroom_half", damage: 12 },
  bh_sweep: { zone: "bathroom_half", damage: 5 },
  bh_trash: { zone: "bathroom_half", damage: 3 },

  // Floors — "any" means whichever boss is active benefits
  f_sweep: { zone: "any", damage: 8 },
  f_vacuum: { zone: "any", damage: 10 },
  f_mop: { zone: "any", damage: 8 },
  f_spot_clean: { zone: "any", damage: 5 },
  f_vacuum_stairs: { zone: "any", damage: 10 },
  f_shake_rugs: { zone: "any", damage: 5 },
  f_baseboards: { zone: "any", damage: 10 },

  // Surfaces — "any"
  s_wipe_switches: { zone: "any", damage: 5 },
  s_declutter: { zone: "any", damage: 8 },
  s_dust_furniture: { zone: "any", damage: 8 },
  s_dust_shelves: { zone: "any", damage: 8 },
  s_wipe_windowsills: { zone: "any", damage: 5 },

  // Waste — "any" (hauling happens wherever the fight is)
  w_recycling: { zone: "any", damage: 5 },
  w_trash_night: { zone: "any", damage: 8 },
  w_full_waste: { zone: "any", damage: 15 },

  // Winter's own boss-tier skills that map to specific room bosses
  boss_full_kitchen: { zone: "kitchen", damage: 20 },
  boss_full_half_bath: { zone: "bathroom_half", damage: 20 },
  boss_bonus_room: { zone: "bonus_room", damage: 35 },
  boss_deep_clean: { zone: "any", damage: 30 },
};

// ==================================================================
// Adults — keyed by "branchId:skillId" since adult skill ids aren't
// globally unique (they live under branches)
// ==================================================================

export const ADULT_SKILL_BOSS_DAMAGE: Record<string, BossDamageEntry> = {
  // Rebekah — Kitchen Arts
  "rebekah_kitchen_arts:counter_commander": { zone: "kitchen", damage: 5 },
  "rebekah_kitchen_arts:dish_master": { zone: "kitchen", damage: 10 },
  "rebekah_kitchen_arts:appliance_warden": { zone: "kitchen", damage: 8 },
  "rebekah_kitchen_arts:kitchen_overlord": { zone: "kitchen", damage: 20 },

  // Rebekah — Surface Ops (any zone)
  "rebekah_surface_ops:table_wiper": { zone: "any", damage: 5 },
  "rebekah_surface_ops:floor_sweeper": { zone: "any", damage: 8 },
  "rebekah_surface_ops:vacuum_operator": { zone: "any", damage: 10 },
  "rebekah_surface_ops:surface_commander": { zone: "any", damage: 15 },

  // Rebekah — Bathroom Ops (half bath only — mom has her own bathroom too
  // but that isn't a boss zone)
  "rebekah_bathroom_ops:sink_shiner": { zone: "bathroom_half", damage: 8 },
  "rebekah_bathroom_ops:toilet_tamer": { zone: "bathroom_half", damage: 12 },
  "rebekah_bathroom_ops:bathroom_boss": { zone: "bathroom_half", damage: 18 },

  // Maarten — Kitchen Support
  "maarten_kitchen_support:dish_duty": { zone: "kitchen", damage: 8 },
  "maarten_kitchen_support:dish_master": { zone: "kitchen", damage: 10 },

  // Maarten — Weekend Warrior (generic reset work, any zone)
  "maarten_weekend_warrior:reset_recruit": { zone: "any", damage: 10 },
  "maarten_weekend_warrior:sprint_veteran": { zone: "any", damage: 15 },
  "maarten_weekend_warrior:reset_commander": { zone: "any", damage: 20 },
};

// ==================================================================
// Lookup helper
// ==================================================================

/** Returns the damage entry for a Winter skill, or null. */
export function winterSkillBossDamage(
  skillId: string
): BossDamageEntry | null {
  return WINTER_SKILL_BOSS_DAMAGE[skillId] ?? null;
}

/** Returns the damage entry for an adult skill, keyed by branch+skill. */
export function adultSkillBossDamage(
  branchId: string,
  skillId: string
): BossDamageEntry | null {
  return ADULT_SKILL_BOSS_DAMAGE[`${branchId}:${skillId}`] ?? null;
}
