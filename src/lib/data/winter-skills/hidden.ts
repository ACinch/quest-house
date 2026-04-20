import type { WinterSkillDef } from "@/lib/types";

/**
 * Hidden convergence domain — 8 skills.
 *
 * These are secret achievement nodes. All have isHidden: true — they
 * only appear in Winter's UI once ≥1 prerequisite has been touched
 * (answer to spec Q3 = option B). Even once visible, their name is
 * '???' until fully unlocked.
 *
 * hidden_household_apprentice uses prerequisiteDomainsRequired — it
 * unlocks when Winter has mastered ≥1 skill in each of the 10 core
 * domains (bathroom_behind_door, towels, boss, and hidden don't
 * count since they're convergence/capstone domains).
 *
 * hidden_ultimate_boss is the Netherite Legend capstone — reaching
 * it is the true end-game of the whole skill tree. It guarantees a
 * chest (and should be themed differently in the UI).
 */
export const HIDDEN_SKILLS: WinterSkillDef[] = [
  {
    id: "hidden_supply_chain",
    name: "Supply Chain Manager",
    hiddenName: "???",
    description: "Manages the full input/output flow of the kitchen",
    domain: "hidden",
    baseXP: 20,
    prerequisites: [
      "k_trash_out",
      "w_recycling",
      "k_load_dishwasher",
      "k_unload_dishwasher",
    ],
    isHidden: true,
    minecraftFlavor: "Master of logistics",
    minecraftIcon: "chest_minecart",
  },
  {
    id: "hidden_textile_commander",
    name: "Textile Commander",
    hiddenName: "???",
    description: "Owns the full laundry pipeline",
    domain: "hidden",
    baseXP: 20,
    prerequisites: [
      "l_start_load",
      "l_washer_to_dryer",
      "l_fold_clothes",
      "l_hang_clothes",
      "l_put_away",
    ],
    isHidden: true,
    minecraftFlavor: "Full textile production chain",
    minecraftIcon: "loom",
  },
  {
    id: "hidden_floor_master",
    name: "Floor Master",
    hiddenName: "???",
    description: "Every floor skill mastered",
    domain: "hidden",
    baseXP: 25,
    prerequisites: [
      "f_sweep",
      "f_vacuum",
      "f_mop",
      "f_vacuum_stairs",
      "f_baseboards",
    ],
    isHidden: true,
    minecraftFlavor: "No block left unpolished",
    minecraftIcon: "diamond_boots",
  },
  {
    id: "hidden_bathroom_overlord",
    name: "Bathroom Overlord",
    hiddenName: "???",
    description: "All bathroom zones conquered",
    domain: "hidden",
    baseXP: 30,
    prerequisites: [
      "boss_full_bathroom_sink",
      "boss_full_half_bath",
      "boss_full_bathroom_btd",
    ],
    isHidden: true,
    minecraftFlavor: "Ruler of all water rooms",
    minecraftIcon: "trident",
  },
  {
    id: "hidden_maintenance_apprentice",
    name: "Maintenance Apprentice",
    hiddenName: "???",
    description: "Basic home repair competency achieved",
    domain: "hidden",
    baseXP: 25,
    prerequisites: [
      "hm_light_bulb",
      "hm_tighten_screw",
      "hm_air_filter",
      "hm_replace_batteries",
    ],
    isHidden: true,
    minecraftFlavor: "Certified redstone engineer",
    minecraftIcon: "redstone_torch",
  },
  {
    id: "hidden_home_economist",
    name: "Home Economist",
    hiddenName: "???",
    description: "Food planning and budgeting mastery",
    domain: "hidden",
    baseXP: 20,
    prerequisites: [
      "ls_grocery_list",
      "ls_compare_prices",
      "ls_nutrition_label",
      "ls_meal_prep",
    ],
    isHidden: true,
    minecraftFlavor: "Master village economist",
    minecraftIcon: "emerald_block",
  },
  {
    id: "hidden_household_apprentice",
    name: "Household Apprentice",
    hiddenName: "???",
    description:
      "Well-rounded household contributor — one mastered skill from every domain",
    domain: "hidden",
    baseXP: 50,
    prerequisites: [],
    prerequisiteDomainsRequired: [
      "kitchen",
      "bathroom_sink_zone",
      "bathroom_half",
      "laundry",
      "floors",
      "surfaces",
      "waste",
      "home_maintenance",
      "outdoor",
      "life_skills",
    ],
    isHidden: true,
    minecraftFlavor: "A true apprentice of the household arts",
    minecraftIcon: "nether_star",
  },
  {
    id: "hidden_ultimate_boss",
    name: "Netherite Legend",
    hiddenName: "???",
    description: "True household mastery — the Ender Dragon of chores",
    domain: "hidden",
    baseXP: 100,
    prerequisites: [
      "boss_full_kitchen",
      "boss_deep_clean",
      "hidden_bathroom_overlord",
      "hidden_textile_commander",
      "hidden_floor_master",
    ],
    isHidden: true,
    guaranteedChest: true,
    minecraftFlavor: "The Ender Dragon has been defeated",
    minecraftIcon: "dragon_egg",
  },
];
