import type { WinterSkillDef } from "@/lib/types";

/**
 * Surfaces domain — 5 skills.
 *
 * No foundation skills of its own. Entry points come from kitchen
 * (s_wipe_switches needs k_wipe_counters, s_declutter needs
 * k_put_away_dishes). Dust furniture is the gateway to the deeper
 * surfaces work.
 */
export const SURFACE_SKILLS: WinterSkillDef[] = [
  {
    id: "s_wipe_switches",
    name: "Wipe Light Switches and Door Handles",
    hiddenName: "Unknown Skill",
    description: "Sanitize high-touch surfaces",
    domain: "surfaces",
    baseXP: 5,
    prerequisites: ["k_wipe_counters"],
    minecraftFlavor: "Cleaning the redstone switches",
    minecraftIcon: "lever",
  },
  {
    id: "s_declutter",
    name: "Declutter a Surface",
    hiddenName: "Unknown Skill",
    description: "Clear and organize a cluttered surface",
    domain: "surfaces",
    baseXP: 8,
    prerequisites: ["k_put_away_dishes"],
    minecraftFlavor: "Clearing the crafting table",
    minecraftIcon: "crafting_table",
  },
  {
    id: "s_dust_furniture",
    name: "Dust Furniture",
    hiddenName: "Unknown Skill",
    description: "Dust furniture surfaces in a room",
    domain: "surfaces",
    baseXP: 8,
    prerequisites: ["s_wipe_switches", "bs_clean_counter"],
    minecraftFlavor: "Dusting the enchantment table",
    minecraftIcon: "enchanting_table",
  },
  {
    id: "s_dust_shelves",
    name: "Dust Shelves/Bookcase",
    hiddenName: "Unknown Skill",
    description: "Dust shelves or bookcases",
    domain: "surfaces",
    baseXP: 8,
    prerequisites: ["s_dust_furniture"],
    minecraftFlavor: "Dusting the bookshelf",
    minecraftIcon: "bookshelf",
  },
  {
    id: "s_wipe_windowsills",
    name: "Wipe Windowsills",
    hiddenName: "Unknown Skill",
    description: "Wipe down windowsills in a room",
    domain: "surfaces",
    baseXP: 5,
    prerequisites: ["s_dust_furniture"],
    minecraftFlavor: "Cleaning the lookout ledge",
    minecraftIcon: "glass_pane",
  },
];
