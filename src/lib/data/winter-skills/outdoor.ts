import type { WinterSkillDef } from "@/lib/types";

/**
 * Outdoor domain — 3 skills.
 *
 * Foundation skill (unlocked at start): o_mail.
 * Mold cleanup is a cross-domain convergence (scrubbing + surface
 * cleaning transfer outdoors). Car wash builds on mold + mop.
 */
export const OUTDOOR_SKILLS: WinterSkillDef[] = [
  {
    id: "o_mail",
    name: "Bring In Mail/Packages",
    hiddenName: "Unknown Skill",
    description: "Collect mail and packages from outside",
    domain: "outdoor",
    baseXP: 3,
    prerequisites: [],
    minecraftFlavor: "Collecting deliveries from the trading post",
    minecraftIcon: "chest",
  },
  {
    id: "o_mold",
    name: "Clean Mold Off Outdoor Surfaces",
    hiddenName: "Unknown Skill",
    description: "Clean mold/mildew from outdoor surfaces",
    domain: "outdoor",
    baseXP: 12,
    prerequisites: ["k_clean_sink", "s_wipe_switches"],
    minecraftFlavor: "Clearing the moss from the outpost",
    minecraftIcon: "moss_block",
  },
  {
    id: "o_car_wash",
    name: "Help Wash the Car",
    hiddenName: "Unknown Skill",
    description: "Help wash the car",
    domain: "outdoor",
    baseXP: 15,
    prerequisites: ["o_mold", "f_mop"],
    minecraftFlavor: "Washing the minecart fleet",
    minecraftIcon: "minecart",
  },
];
