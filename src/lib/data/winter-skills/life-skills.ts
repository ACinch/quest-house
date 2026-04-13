import type { WinterSkillDef } from "@/lib/types";

/**
 * Life skills domain — 7 skills.
 *
 * Foundation skill (unlocked at start): ls_nutrition_label.
 * Two skills use prerequisiteTotalMastered (gate based on "mastered
 * N total skills across the whole tree") instead of direct prereqs:
 *   - ls_thank_you   (5 total mastered)
 *   - ls_sewing      (10 total mastered)
 * These model general maturity / dexterity rather than any specific
 * skill chain.
 */
export const LIFE_SKILLS: WinterSkillDef[] = [
  {
    id: "ls_nutrition_label",
    name: "Read a Nutrition Label",
    hiddenName: "Unknown Skill",
    description: "Read and understand a nutrition label",
    domain: "life_skills",
    baseXP: 8,
    prerequisites: [],
    minecraftFlavor: "Deciphering the enchantment scroll",
    minecraftIcon: "enchanted_book",
  },
  {
    id: "ls_grocery_list",
    name: "Make a Grocery List",
    hiddenName: "Unknown Skill",
    description: "Create a grocery list for a shopping trip",
    domain: "life_skills",
    baseXP: 8,
    prerequisites: ["ls_nutrition_label"],
    minecraftFlavor: "Planning the trading expedition",
    minecraftIcon: "book",
  },
  {
    id: "ls_compare_prices",
    name: "Compare Prices",
    hiddenName: "Unknown Skill",
    description: "Compare prices at the store to find the best deal",
    domain: "life_skills",
    baseXP: 10,
    prerequisites: ["ls_grocery_list", "ls_nutrition_label"],
    minecraftFlavor: "Negotiating with the villagers",
    minecraftIcon: "emerald",
  },
  {
    id: "ls_meal_prep",
    name: "Basic Meal Prep",
    hiddenName: "Unknown Skill",
    description: "Chop veggies, measure ingredients, basic prep work",
    domain: "life_skills",
    baseXP: 10,
    prerequisites: ["k_wipe_counters", "k_clean_sink", "ls_nutrition_label"],
    minecraftFlavor: "Preparing ingredients at the crafting table",
    minecraftIcon: "crafting_table",
  },
  {
    id: "ls_thank_you",
    name: "Write a Thank You Note",
    hiddenName: "Unknown Skill",
    description: "Write a proper thank you note",
    domain: "life_skills",
    baseXP: 8,
    prerequisites: [],
    prerequisiteTotalMastered: 5,
    minecraftFlavor: "Writing to a pen pal in a distant village",
    minecraftIcon: "writable_book",
  },
  {
    id: "ls_mail_letter",
    name: "Address and Stamp Mail",
    hiddenName: "Unknown Skill",
    description: "Properly address an envelope and apply postage",
    domain: "life_skills",
    baseXP: 5,
    prerequisites: ["ls_thank_you"],
    minecraftFlavor: "Sending a message by carrier pigeon",
    minecraftIcon: "feather",
  },
  {
    id: "ls_sewing",
    name: "Basic Sewing",
    hiddenName: "Unknown Skill",
    description: "Sew on a button or fix a small tear",
    domain: "life_skills",
    baseXP: 12,
    prerequisites: [],
    prerequisiteTotalMastered: 10,
    minecraftFlavor: "Repairing the leather armor",
    minecraftIcon: "leather",
  },
];
