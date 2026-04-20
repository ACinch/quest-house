import type { BossDef } from "@/lib/types";

/**
 * Dining Room Skeleton — 6 tasks, total HP 80.
 *
 * Mob: Skeleton (💀)
 * Zone: dining_room
 *
 * Dining room doesn't have a dedicated Winter skill domain. Links
 * into surfaces (declutter, dust) and floors (vacuum) where the
 * mapping makes sense.
 */
export const DINING_ROOM_SKELETON: BossDef = {
  id: "dining_room_skeleton",
  name: "Dining Room Skeleton",
  mob: "Skeleton",
  icon: "💀",
  flavor:
    "Bones of old mail and forgotten projects rattle on the table.",
  zone: "dining_room",
  tasks: [
    {
      id: "dining_room_skeleton:clear_table",
      name: "Fully clear dining table (every item finds a home)",
      damage: 20,
      xp: 20,
      linkedSkillId: "s_declutter",
    },
    {
      id: "dining_room_skeleton:polish_table",
      name: "Wipe + polish table surface",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_dust_furniture",
    },
    {
      id: "dining_room_skeleton:clear_chairs",
      name: "Clear all chair seats of piled items",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_declutter",
    },
    {
      id: "dining_room_skeleton:under_table",
      name: "Sweep/vacuum under table + chairs",
      damage: 15,
      xp: 15,
      linkedSkillId: "f_vacuum",
    },
    {
      id: "dining_room_skeleton:sideboard",
      name: "Wipe down sideboard/hutch surfaces",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_dust_furniture",
    },
    {
      id: "dining_room_skeleton:mail_piles",
      name: "Sort any mail/paper piles on dining surfaces",
      damage: 15,
      xp: 15,
      linkedSkillId: "s_declutter",
    },
  ],
};
