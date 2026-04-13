import type { WinterSkillDef } from "@/lib/types";

/**
 * Waste management domain — 3 skills.
 *
 * No foundation of its own. Entry point comes from kitchen
 * (w_recycling needs k_trash_out).
 */
export const WASTE_SKILLS: WinterSkillDef[] = [
  {
    id: "w_recycling",
    name: "Separate Recycling",
    hiddenName: "Unknown Skill",
    description: "Sort recycling correctly",
    domain: "waste",
    baseXP: 8,
    prerequisites: ["k_trash_out"],
    minecraftFlavor: "Sorting materials at the sorting station",
    minecraftIcon: "hopper",
  },
  {
    id: "w_trash_night",
    name: "Trash Night",
    hiddenName: "Unknown Skill",
    description: "Take all bins to the street on trash night",
    domain: "waste",
    baseXP: 12,
    prerequisites: ["w_recycling", "k_trash_out"],
    minecraftFlavor: "The weekly shipment goes out",
    minecraftIcon: "minecart_chest",
  },
  {
    id: "w_full_waste",
    name: "Full Waste Duty",
    hiddenName: "Unknown Skill",
    description: "Handle all trash and recycling for the day",
    domain: "waste",
    baseXP: 15,
    prerequisites: ["w_trash_night", "k_replace_trash_bag"],
    minecraftFlavor: "Managing the whole disposal network",
    minecraftIcon: "tnt",
  },
];
