import type { BossDef } from "@/lib/types";

/**
 * Living Room Zombie Horde — 9 tasks, total HP 95.
 *
 * Mob: Zombie (🧟)
 * Zone: living_room
 *
 * The living room doesn't have its own Winter skill domain — the
 * relevant skills live in `surfaces` (dust, switches, declutter) and
 * `floors` (sweep, vacuum). Links point there where clean mappings
 * exist; unlinked tasks still award flat xp.
 */
export const LIVING_ROOM_ZOMBIE: BossDef = {
  id: "living_room_zombie",
  name: "Living Room Zombie Horde",
  mob: "Zombie",
  icon: "🧟",
  flavor:
    "They've been shuffling around in here for weeks. Time to clear them out.",
  zone: "living_room",
  tasks: [
    {
      id: "living_room_zombie:pickup_pass",
      name: "Full pickup pass — every item to its home",
      damage: 15,
      xp: 15,
      linkedSkillId: "s_declutter",
    },
    {
      id: "living_room_zombie:trash_dishes",
      name: "Gather + remove all trash/dishes/cups",
      damage: 10,
      xp: 10,
      linkedSkillId: "k_trash_out",
    },
    {
      id: "living_room_zombie:vacuum",
      name: "Vacuum entire floor (move furniture cushions)",
      damage: 15,
      xp: 15,
      linkedSkillId: "f_vacuum",
    },
    {
      id: "living_room_zombie:dust_surfaces",
      name: "Dust all surfaces (TV, shelves, entertainment center)",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_dust_furniture",
    },
    {
      id: "living_room_zombie:wipe_tables",
      name: "Wipe down coffee table + side tables",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_dust_furniture",
    },
    {
      id: "living_room_zombie:cables",
      name: "Organize remotes/chargers/cables",
      damage: 10,
      xp: 10,
      // No clean skill link — this is a bespoke organizing task.
    },
    {
      id: "living_room_zombie:cushions",
      name: "Fluff + arrange couch cushions + pillows",
      damage: 5,
      xp: 5,
      // No clean skill link — cosmetic task.
    },
    {
      id: "living_room_zombie:under_cushions",
      name: "Clean under couch cushions",
      damage: 10,
      xp: 10,
      // Unlinked — crumb dimension has no dedicated skill.
    },
    {
      id: "living_room_zombie:switches",
      name: "Wipe down light switches + door frames",
      damage: 10,
      xp: 10,
      linkedSkillId: "s_wipe_switches",
    },
  ],
};
