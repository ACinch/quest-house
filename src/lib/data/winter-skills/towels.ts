import type { WinterSkillDef } from "@/lib/types";

/**
 * Towels domain — 2 skills.
 *
 * Convergence domain — no foundation of its own. Entry point is
 * t_swap_towels which needs laundry + bathroom prereqs. Full
 * wash-and-put-away cycle layers on the laundry pipeline.
 */
export const TOWEL_SKILLS: WinterSkillDef[] = [
  {
    id: "t_swap_towels",
    name: "Swap Bathroom Towels",
    hiddenName: "Unknown Skill",
    description: "Collect used towels and replace with clean ones",
    domain: "towels",
    baseXP: 5,
    prerequisites: ["bs_trash", "l_fold_clothes"],
    minecraftFlavor: "Rotating the banner collection",
    minecraftIcon: "banner",
  },
  {
    id: "t_wash_towels",
    name: "Wash and Put Away Towels",
    hiddenName: "Unknown Skill",
    description: "Wash dirty towels, fold, and put away",
    domain: "towels",
    baseXP: 10,
    prerequisites: ["t_swap_towels", "l_start_load", "l_washer_to_dryer"],
    minecraftFlavor: "Full banner restoration cycle",
    minecraftIcon: "loom",
  },
];
