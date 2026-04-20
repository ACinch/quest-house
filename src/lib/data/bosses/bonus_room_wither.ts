import type { BossDef } from "@/lib/types";

/**
 * The Bonus Room Wither — 8 tasks, total HP 120. Hard boss.
 *
 * Mob: Wither (☠️)
 * Zone: bonus_room
 *
 * Links into Winter's boss_bonus_room skill where the mapping is
 * natural. Toy rotation check ties into the existing Toy Rotation
 * system via the Toy Rotation Master (boss-level) skill.
 */
export const BONUS_ROOM_WITHER: BossDef = {
  id: "bonus_room_wither",
  name: "The Bonus Room Wither",
  mob: "Wither",
  icon: "☠️",
  flavor:
    "Three heads. Three times the chaos. This room fights back.",
  zone: "bonus_room",
  tasks: [
    {
      id: "bonus_room_wither:floor_clear",
      name: "Floor clear — every item off the floor",
      damage: 20,
      xp: 20,
      linkedSkillId: "s_declutter",
    },
    {
      id: "bonus_room_wither:sort_toys",
      name: "Sort one category of toys (group by type)",
      damage: 15,
      xp: 15,
      linkedSkillId: "s_declutter",
    },
    {
      id: "bonus_room_wither:donation_pile",
      name: "Process donation pile (keep/donate/trash)",
      damage: 20,
      xp: 20,
      linkedSkillId: "boss_bonus_room",
    },
    {
      id: "bonus_room_wither:organize_shelf",
      name: "Organize one shelf or bin",
      damage: 15,
      xp: 15,
      linkedSkillId: "s_declutter",
    },
    {
      id: "bonus_room_wither:craft_drawer",
      name: "Craft drawer reset — one tier",
      damage: 15,
      xp: 15,
      // No direct skill — craft drawer reset is a Winter boss skill
      // but already tracked at a higher granularity. Unlinked.
    },
    {
      id: "bonus_room_wither:vacuum",
      name: "Vacuum/sweep entire floor",
      damage: 15,
      xp: 15,
      linkedSkillId: "f_vacuum",
    },
    {
      id: "bonus_room_wither:wipe_surfaces",
      name: "Wipe down all surfaces",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_dust_furniture",
    },
    {
      id: "bonus_room_wither:toy_rotation",
      name: "Check toy rotation bins — anything to swap?",
      damage: 10,
      xp: 10,
      // Unlinked — connects to the ToyRotation system separately.
    },
  ],
};
