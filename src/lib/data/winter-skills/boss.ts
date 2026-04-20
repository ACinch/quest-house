import type { WinterSkillDef } from "@/lib/types";

/**
 * Boss / combo domain — 7 skills.
 *
 * These are the "full room" and deep-clean achievements. All boss
 * skills have guaranteedChest: true so completing one always drops
 * a tier-weighted treasure chest.
 *
 * boss_deep_clean is the capstone of this domain: it requires the
 * three "full room" bosses plus f_vacuum + s_dust_furniture.
 */
export const BOSS_SKILLS: WinterSkillDef[] = [
  {
    id: "boss_full_kitchen",
    name: "Full Kitchen Tidy",
    hiddenName: "Unknown Boss Skill",
    description:
      "Complete kitchen clean: counters + dishes + table + sweep",
    domain: "boss",
    baseXP: 25,
    prerequisites: [
      "k_load_dishwasher",
      "k_wipe_counters",
      "k_sweep_kitchen",
      "k_trash_out",
      "k_clean_sink",
    ],
    guaranteedChest: true,
    minecraftFlavor: "Running the whole kitchen",
    minecraftIcon: "diamond_pickaxe",
  },
  {
    id: "boss_full_bathroom_sink",
    name: "Full Sink Zone Clean",
    hiddenName: "Unknown Boss Skill",
    description: "Complete clean of Winter's bathroom sink zone",
    domain: "boss",
    baseXP: 20,
    prerequisites: [
      "bs_wipe_sink",
      "bs_clean_counter",
      "bs_clean_mirror",
      "bs_sweep",
      "bs_mop",
      "bs_trash",
    ],
    guaranteedChest: true,
    minecraftFlavor: "Full potion room restoration",
    minecraftIcon: "diamond_pickaxe",
  },
  {
    id: "boss_full_half_bath",
    name: "Full Half Bath Clean",
    hiddenName: "Unknown Boss Skill",
    description: "Complete clean of the downstairs half bath",
    domain: "boss",
    baseXP: 25,
    prerequisites: [
      "bh_wipe_sink",
      "bh_clean_mirror",
      "bh_toilet_exterior",
      "bh_toilet_bowl",
      "bh_sweep",
      "bh_trash",
    ],
    guaranteedChest: true,
    minecraftFlavor: "Full outpost restoration",
    minecraftIcon: "diamond_pickaxe",
  },
  {
    id: "boss_full_bathroom_btd",
    name: "Full Behind-the-Door Clean",
    hiddenName: "Unknown Boss Skill",
    description: "Complete clean of Winter's shower/toilet zone",
    domain: "boss",
    baseXP: 25,
    prerequisites: [
      "bd_toilet_exterior",
      "bd_toilet_bowl",
      "bd_scrub_shower",
      "bd_clean_glass",
    ],
    guaranteedChest: true,
    minecraftFlavor: "Full fortress deep clean",
    minecraftIcon: "diamond_pickaxe",
  },
  {
    id: "boss_sheet_cycle",
    name: "Full Sheet Change Cycle",
    hiddenName: "Unknown Boss Skill",
    description: "Strip bed, wash sheets, dry, remake bed",
    domain: "boss",
    baseXP: 20,
    prerequisites: [
      "l_strip_bed",
      "l_start_load",
      "l_washer_to_dryer",
      "l_make_bed",
    ],
    guaranteedChest: true,
    minecraftFlavor: "Full bed restoration quest",
    minecraftIcon: "diamond_pickaxe",
  },
  {
    id: "boss_bonus_room",
    name: "Bonus Room Raid",
    hiddenName: "Unknown Boss Skill",
    description: "Help sort the bonus room (1-hour sprint)",
    domain: "boss",
    baseXP: 40,
    prerequisites: ["f_vacuum", "s_declutter", "l_fold_clothes"],
    guaranteedChest: true,
    minecraftFlavor: "Clearing a dungeon room",
    minecraftIcon: "netherite_pickaxe",
  },
  {
    id: "boss_deep_clean",
    name: "Deep Clean Champion",
    hiddenName: "Unknown Boss Skill",
    description: "Participate in a full deep-clean session",
    domain: "boss",
    baseXP: 50,
    prerequisites: [
      "boss_full_kitchen",
      "boss_full_bathroom_sink",
      "boss_full_half_bath",
      "f_vacuum",
      "s_dust_furniture",
    ],
    guaranteedChest: true,
    minecraftFlavor: "Defeating the Ender Dragon",
    minecraftIcon: "dragon_egg",
  },
];
