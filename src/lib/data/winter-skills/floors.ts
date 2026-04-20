import type { WinterSkillDef } from "@/lib/types";

/**
 * Floors domain — 7 skills.
 *
 * Foundation skill (unlocked at start): f_sweep.
 * Everything else branches off it. Vacuum stairs requires vacuum
 * mastered first (prereq via vacuum, not sweep). Baseboards is a
 * convergence with surfaces (needs s_wipe_switches).
 */
export const FLOOR_SKILLS: WinterSkillDef[] = [
  {
    id: "f_sweep",
    name: "Sweep a Room",
    hiddenName: "Unknown Skill",
    description: "Sweep one room",
    domain: "floors",
    baseXP: 5,
    prerequisites: [],
    minecraftFlavor: "Clearing the mine floor",
    minecraftIcon: "stone_pickaxe",
  },
  {
    id: "f_vacuum",
    name: "Vacuum a Room",
    hiddenName: "Unknown Skill",
    description: "Vacuum one room",
    domain: "floors",
    baseXP: 8,
    prerequisites: ["f_sweep"],
    minecraftFlavor: "Deploying the iron golem",
    minecraftIcon: "iron_block",
  },
  {
    id: "f_mop",
    name: "Mop a Room",
    hiddenName: "Unknown Skill",
    description: "Mop one room",
    domain: "floors",
    baseXP: 8,
    prerequisites: ["f_sweep"],
    minecraftFlavor: "Flooding the mine floor",
    minecraftIcon: "water_bucket",
  },
  {
    id: "f_spot_clean",
    name: "Spot Clean a Spill",
    hiddenName: "Unknown Skill",
    description: "Spot clean a spill or stain on the floor",
    domain: "floors",
    baseXP: 5,
    prerequisites: ["f_sweep"],
    minecraftFlavor: "Emergency lava cleanup",
    minecraftIcon: "lava_bucket",
  },
  {
    id: "f_vacuum_stairs",
    name: "Vacuum Stairs",
    hiddenName: "Unknown Skill",
    description: "Vacuum the staircase",
    domain: "floors",
    baseXP: 10,
    prerequisites: ["f_vacuum"],
    minecraftFlavor: "Clearing the vertical mineshaft",
    minecraftIcon: "ladder",
  },
  {
    id: "f_shake_rugs",
    name: "Shake Out Rugs/Mats",
    hiddenName: "Unknown Skill",
    description: "Take rugs/mats outside and shake them out",
    domain: "floors",
    baseXP: 5,
    prerequisites: ["f_sweep"],
    minecraftFlavor: "Shaking out the carpet",
    minecraftIcon: "wool",
  },
  {
    id: "f_baseboards",
    name: "Clean Baseboards",
    hiddenName: "Unknown Skill",
    description: "Wipe down baseboards in a room",
    domain: "floors",
    baseXP: 10,
    prerequisites: ["f_mop", "s_wipe_switches"],
    minecraftFlavor: "Polishing the foundation blocks",
    minecraftIcon: "smooth_stone",
  },
];
