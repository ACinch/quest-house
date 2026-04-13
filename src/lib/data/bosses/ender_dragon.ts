import type { BossDef } from "@/lib/types";

/**
 * The Ender Dragon — CAPSTONE boss. Whole-house.
 *
 * Mob: Ender Dragon (🐉)
 * Zone: whole_house
 *
 * isCapstone: true tells the store to flatten all 5 room bosses'
 * tasks into one big task map at spawn time. Each task gets:
 *   - A namespaced id (`kitchen_creeper:counter_left`, etc.) — no
 *     collisions since every room boss already uses its own prefix.
 *   - A `sourceBossId` so the fight UI can group by room.
 *
 * The static `tasks: []` here means "assemble at spawn time". The
 * helper `buildCapstoneTasks()` in bosses/index.ts does the work.
 *
 * Total HP is the combined HP of all room bosses (~490).
 *
 * Only attempt when the whole house needs a reset or the family is
 * feeling ambitious. Defeating the Ender Dragon is a major
 * achievement worth tracking separately (but we don't yet — future
 * enhancement).
 */
export const ENDER_DRAGON: BossDef = {
  id: "ender_dragon",
  name: "The Ender Dragon",
  mob: "Ender Dragon",
  icon: "🐉",
  flavor: "The final boss. Every room. One week. Let's go.",
  zone: "whole_house",
  isCapstone: true,
  tasks: [],
};
