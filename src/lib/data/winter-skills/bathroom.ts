import type { WinterSkillDef } from "@/lib/types";

/**
 * Bathroom domains — 16 skills across three zones.
 *
 * Zone progression mirrors the physical house layout:
 *   1. Sink zone (Winter's bathroom, open area, no toilet/shower)
 *   2. Half bath (downstairs, smaller space, introduces toilet)
 *   3. Behind-the-door (Winter's bathroom, toilet + shower zone)
 *
 * Foundation skills (unlocked at start): bs_wipe_sink, bs_trash.
 * Half-bath and behind-the-door skills require their sink-zone
 * counterparts to be MASTERED (prerequisitesMastered: true), not just
 * touched, since they're "apply this skill to a new space" gates.
 */

// ==================================================================
// Zone 1 — Winter's bathroom sink zone (foundation domain)
// ==================================================================
export const BATHROOM_SINK_SKILLS: WinterSkillDef[] = [
  {
    id: "bs_wipe_sink",
    name: "Wipe Sink",
    hiddenName: "Unknown Skill",
    description: "Wipe down the bathroom sink",
    domain: "bathroom_sink_zone",
    baseXP: 5,
    prerequisites: [],
    minecraftFlavor: "Polishing the water basin",
    minecraftIcon: "cauldron",
  },
  {
    id: "bs_clean_counter",
    name: "Clean Counter",
    hiddenName: "Unknown Skill",
    description: "Clean the bathroom counter area",
    domain: "bathroom_sink_zone",
    baseXP: 5,
    prerequisites: ["bs_wipe_sink"],
    minecraftFlavor: "Clearing the potion shelf",
    minecraftIcon: "brewing_stand",
  },
  {
    id: "bs_clean_mirror",
    name: "Clean Mirror",
    hiddenName: "Unknown Skill",
    description: "Clean the bathroom mirror",
    domain: "bathroom_sink_zone",
    baseXP: 5,
    prerequisites: ["bs_wipe_sink"],
    minecraftFlavor: "Polishing the enchanted glass",
    minecraftIcon: "glass_pane",
  },
  {
    id: "bs_sweep",
    name: "Sweep Floor",
    hiddenName: "Unknown Skill",
    description: "Sweep the bathroom sink zone floor",
    domain: "bathroom_sink_zone",
    baseXP: 5,
    prerequisites: ["bs_wipe_sink"],
    minecraftFlavor: "Clearing the stone floor",
    minecraftIcon: "stone",
  },
  {
    id: "bs_mop",
    name: "Mop Floor",
    hiddenName: "Unknown Skill",
    description: "Mop the bathroom sink zone floor",
    domain: "bathroom_sink_zone",
    baseXP: 8,
    prerequisites: ["bs_sweep"],
    minecraftFlavor: "Washing the stone floor",
    minecraftIcon: "water_bucket",
  },
  {
    id: "bs_trash",
    name: "Take Out Trash",
    hiddenName: "Unknown Skill",
    description: "Empty the bathroom trash can",
    domain: "bathroom_sink_zone",
    baseXP: 3,
    prerequisites: [],
    minecraftFlavor: "Emptying the waste hopper",
    minecraftIcon: "hopper",
  },
];

// ==================================================================
// Zone 2 — Downstairs half bath
// All "apply skill to new space" prerequisites must be MASTERED.
// ==================================================================
export const BATHROOM_HALF_SKILLS: WinterSkillDef[] = [
  {
    id: "bh_wipe_sink",
    name: "Wipe Sink and Counter",
    hiddenName: "Unknown Skill",
    description: "Wipe down the half bath sink and counter",
    domain: "bathroom_half",
    baseXP: 5,
    prerequisites: ["bs_wipe_sink"],
    prerequisitesMastered: true,
    minecraftFlavor: "Polishing the outpost basin",
    minecraftIcon: "cauldron",
  },
  {
    id: "bh_clean_mirror",
    name: "Clean Mirror",
    hiddenName: "Unknown Skill",
    description: "Clean the half bath mirror",
    domain: "bathroom_half",
    baseXP: 5,
    prerequisites: ["bs_clean_mirror"],
    prerequisitesMastered: true,
    minecraftFlavor: "Polishing the outpost glass",
    minecraftIcon: "glass_pane",
  },
  {
    id: "bh_toilet_exterior",
    name: "Wipe Toilet Exterior",
    hiddenName: "Unknown Skill",
    description: "Wipe down the outside of the toilet, seat, and lid",
    domain: "bathroom_half",
    baseXP: 8,
    prerequisites: ["bh_wipe_sink", "bh_clean_mirror"],
    minecraftFlavor: "Cleaning the exterior armor stand",
    minecraftIcon: "armor_stand",
  },
  {
    id: "bh_toilet_bowl",
    name: "Clean Toilet Bowl",
    hiddenName: "Unknown Skill",
    description: "Clean the inside of the toilet bowl",
    domain: "bathroom_half",
    baseXP: 10,
    prerequisites: ["bh_toilet_exterior"],
    minecraftFlavor: "Deep cleaning the cauldron",
    minecraftIcon: "cauldron",
  },
  {
    id: "bh_sweep",
    name: "Sweep Floor",
    hiddenName: "Unknown Skill",
    description: "Sweep the half bath floor",
    domain: "bathroom_half",
    baseXP: 5,
    prerequisites: ["bs_sweep"],
    prerequisitesMastered: true,
    minecraftFlavor: "Sweeping the outpost floor",
    minecraftIcon: "stone",
  },
  {
    id: "bh_trash",
    name: "Take Out Trash",
    hiddenName: "Unknown Skill",
    description: "Empty the half bath trash can",
    domain: "bathroom_half",
    baseXP: 3,
    prerequisites: ["bs_trash"],
    prerequisitesMastered: true,
    minecraftFlavor: "Emptying the outpost waste hopper",
    minecraftIcon: "hopper",
  },
];

// ==================================================================
// Zone 3 — Behind-the-door zone (Winter's shower/toilet)
// Hardest bathroom domain. Must master half-bath toilet first.
// ==================================================================
export const BATHROOM_BTD_SKILLS: WinterSkillDef[] = [
  {
    id: "bd_toilet_exterior",
    name: "Wipe Toilet Exterior",
    hiddenName: "Unknown Skill",
    description: "Wipe down the outside of the toilet in Winter's bathroom",
    domain: "bathroom_behind_door",
    baseXP: 8,
    prerequisites: ["bh_toilet_bowl"],
    prerequisitesMastered: true,
    minecraftFlavor: "Cleaning the fortress armor stand",
    minecraftIcon: "armor_stand",
  },
  {
    id: "bd_toilet_bowl",
    name: "Clean Toilet Bowl",
    hiddenName: "Unknown Skill",
    description: "Clean the inside of the toilet bowl in Winter's bathroom",
    domain: "bathroom_behind_door",
    baseXP: 10,
    prerequisites: ["bd_toilet_exterior"],
    minecraftFlavor: "Deep cleaning the fortress cauldron",
    minecraftIcon: "cauldron",
  },
  {
    id: "bd_scrub_shower",
    name: "Scrub Shower/Tub",
    hiddenName: "Unknown Skill",
    description: "Scrub the shower or tub",
    domain: "bathroom_behind_door",
    baseXP: 12,
    prerequisites: ["bd_toilet_bowl", "k_clean_sink"],
    minecraftFlavor: "Scrubbing the fortress waterfall",
    minecraftIcon: "water_bucket",
  },
  {
    id: "bd_clean_glass",
    name: "Clean Shower Glass",
    hiddenName: "Unknown Skill",
    description: "Clean the shower glass/door",
    domain: "bathroom_behind_door",
    baseXP: 10,
    prerequisites: ["bd_scrub_shower", "bs_clean_mirror"],
    minecraftFlavor: "Polishing the fortress crystal wall",
    minecraftIcon: "glass",
  },
];
