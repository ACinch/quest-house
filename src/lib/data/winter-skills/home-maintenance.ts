import type { WinterSkillDef } from "@/lib/types";

/**
 * Home maintenance domain — 11 skills.
 *
 * Foundation skills (unlocked at start): hm_replace_batteries,
 * hm_tape_measure. These are the entry points — both very basic,
 * but hm_replace_batteries is marked supervised because it may
 * involve smoke detectors.
 *
 * Convergence nodes:
 *   hm_unclog_drain ← k_clean_sink + hm_tighten_screw
 *   hm_caulk        ← hm_unclog_drain + k_clean_sink (supervised)
 *
 * Tool-use progression:
 *   tape_measure → read_level → stud_finder → hang_art
 */
export const HOME_MAINTENANCE_SKILLS: WinterSkillDef[] = [
  {
    id: "hm_tape_measure",
    name: "Use a Tape Measure",
    hiddenName: "Unknown Skill",
    description: "Accurately measure using a tape measure",
    domain: "home_maintenance",
    baseXP: 5,
    prerequisites: [],
    minecraftFlavor: "Measuring the build site",
    minecraftIcon: "string",
  },
  {
    id: "hm_replace_batteries",
    name: "Replace Batteries",
    hiddenName: "Unknown Skill",
    description:
      "Replace batteries in remotes, smoke detectors (supervised)",
    domain: "home_maintenance",
    baseXP: 8,
    prerequisites: [],
    supervised: true,
    minecraftFlavor: "Recharging the redstone",
    minecraftIcon: "redstone_dust",
  },
  {
    id: "hm_read_level",
    name: "Read a Level",
    hiddenName: "Unknown Skill",
    description: "Use a level to check if something is straight",
    domain: "home_maintenance",
    baseXP: 5,
    prerequisites: ["hm_tape_measure"],
    minecraftFlavor: "Checking the alignment",
    minecraftIcon: "iron_ingot",
  },
  {
    id: "hm_light_bulb",
    name: "Replace a Light Bulb",
    hiddenName: "Unknown Skill",
    description: "Safely replace a burned out light bulb",
    domain: "home_maintenance",
    baseXP: 8,
    prerequisites: ["hm_replace_batteries"],
    minecraftFlavor: "Replacing the glowstone",
    minecraftIcon: "glowstone",
  },
  {
    id: "hm_tighten_screw",
    name: "Tighten a Loose Screw/Handle",
    hiddenName: "Unknown Skill",
    description: "Fix a loose screw or handle around the house",
    domain: "home_maintenance",
    baseXP: 8,
    prerequisites: ["hm_replace_batteries"],
    minecraftFlavor: "Tightening the iron fittings",
    minecraftIcon: "iron_ingot",
  },
  {
    id: "hm_stud_finder",
    name: "Use a Stud Finder",
    hiddenName: "Unknown Skill",
    description: "Locate studs in a wall using a stud finder",
    domain: "home_maintenance",
    baseXP: 8,
    prerequisites: ["hm_tape_measure", "hm_read_level"],
    minecraftFlavor: "Scanning for hidden ore",
    minecraftIcon: "diamond_ore",
  },
  {
    id: "hm_hang_art",
    name: "Hang Art/Picture",
    hiddenName: "Unknown Skill",
    description: "Hang art or a picture frame on the wall",
    domain: "home_maintenance",
    baseXP: 12,
    prerequisites: ["hm_stud_finder", "hm_tighten_screw"],
    minecraftFlavor: "Placing the painting",
    minecraftIcon: "painting",
  },
  {
    id: "hm_unclog_drain",
    name: "Unclog a Drain",
    hiddenName: "Unknown Skill",
    description: "Use a plunger to unclog a drain (basic)",
    domain: "home_maintenance",
    baseXP: 10,
    prerequisites: ["k_clean_sink", "hm_tighten_screw"],
    minecraftFlavor: "Clearing the blocked waterway",
    minecraftIcon: "iron_trapdoor",
  },
  {
    id: "hm_air_filter",
    name: "Change HVAC Air Filter",
    hiddenName: "Unknown Skill",
    description: "Replace the HVAC air filter",
    domain: "home_maintenance",
    baseXP: 15,
    prerequisites: ["hm_replace_batteries", "hm_tape_measure"],
    minecraftFlavor: "Replacing the air purification runes",
    minecraftIcon: "cobweb",
  },
  {
    id: "hm_caulk",
    name: "Basic Caulk Touch-up",
    hiddenName: "Unknown Skill",
    description: "Apply caulk to seal a gap (supervised)",
    domain: "home_maintenance",
    baseXP: 15,
    prerequisites: ["hm_unclog_drain", "k_clean_sink"],
    supervised: true,
    minecraftFlavor: "Sealing the fortress walls",
    minecraftIcon: "slime_ball",
  },
  {
    id: "hm_reset_breaker",
    name: "Reset a Tripped Breaker",
    hiddenName: "Unknown Skill",
    description: "Safely reset a tripped circuit breaker (supervised)",
    domain: "home_maintenance",
    baseXP: 12,
    prerequisites: ["hm_light_bulb", "hm_replace_batteries"],
    supervised: true,
    minecraftFlavor: "Restoring the redstone power grid",
    minecraftIcon: "redstone_lamp",
  },
];
