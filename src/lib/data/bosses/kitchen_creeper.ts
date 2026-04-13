import type { BossDef } from "@/lib/types";

/**
 * The Kitchen Creeper — 10 tasks, total HP 115.
 *
 * Mob: Creeper (🟢)
 * Zone: kitchen
 *
 * Links to the Winter kitchen domain (`k_*`) where the task maps
 * cleanly to a specific skill. Unlinked tasks still award flat xp.
 */
export const KITCHEN_CREEPER: BossDef = {
  id: "kitchen_creeper",
  name: "The Kitchen Creeper",
  mob: "Creeper",
  icon: "🟢",
  flavor:
    "It crept in while nobody was watching. Now it owns the counters.",
  zone: "kitchen",
  tasks: [
    {
      id: "kitchen_creeper:counter_left",
      name: "Deep clean counter: left of sink",
      damage: 10,
      xp: 10,
      linkedSkillId: "k_wipe_counters",
    },
    {
      id: "kitchen_creeper:counter_right",
      name: "Deep clean counter: right of sink",
      damage: 10,
      xp: 10,
      linkedSkillId: "k_wipe_counters",
    },
    {
      id: "kitchen_creeper:stove_area",
      name: "Deep clean stove area (behind burners, drip pans)",
      damage: 15,
      xp: 15,
      linkedSkillId: "k_clean_stovetop",
    },
    {
      id: "kitchen_creeper:scrub_sink",
      name: "Scrub sink (not just rinse)",
      damage: 10,
      xp: 10,
      linkedSkillId: "k_clean_sink",
    },
    {
      id: "kitchen_creeper:microwave",
      name: "Clean microwave inside + outside",
      damage: 10,
      xp: 10,
      linkedSkillId: "k_clean_microwave",
    },
    {
      id: "kitchen_creeper:cabinet_fronts",
      name: "Wipe down cabinet fronts",
      damage: 10,
      xp: 10,
      linkedSkillId: "k_wipe_cabinets",
    },
    {
      id: "kitchen_creeper:fridge",
      name: "Clean out fridge (one shelf or section)",
      damage: 15,
      xp: 15,
      linkedSkillId: "k_clean_fridge",
    },
    {
      id: "kitchen_creeper:junk_drawer",
      name: "Organize one junk drawer or counter pile",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_declutter",
    },
    {
      id: "kitchen_creeper:floor",
      name: "Deep sweep + mop kitchen floor",
      damage: 15,
      xp: 15,
      linkedSkillId: "k_mop_kitchen",
    },
    {
      id: "kitchen_creeper:small_appliances",
      name: "Wipe down small appliances (toaster, coffee maker)",
      damage: 10,
      xp: 10,
      linkedSkillId: "k_clean_appliances",
    },
  ],
};
