import type { BossDef, BossTaskDef } from "@/lib/types";
import { WINTER_SKILLS_BY_ID } from "@/lib/data/winter-skills";

import { KITCHEN_CREEPER } from "./kitchen_creeper";
import { LIVING_ROOM_ZOMBIE } from "./living_room_zombie";
import { BATHROOM_SLIME } from "./bathroom_slime";
import { DINING_ROOM_SKELETON } from "./dining_room_skeleton";
import { BONUS_ROOM_WITHER } from "./bonus_room_wither";
import { ENDER_DRAGON } from "./ender_dragon";

// ==================================================================
// Flat list of all bosses
// ==================================================================

/** Room bosses — individually fightable, feed the capstone. */
export const ROOM_BOSSES: BossDef[] = [
  KITCHEN_CREEPER,
  LIVING_ROOM_ZOMBIE,
  BATHROOM_SLIME,
  DINING_ROOM_SKELETON,
  BONUS_ROOM_WITHER,
];

/** All bosses including the capstone. */
export const BOSSES: BossDef[] = [...ROOM_BOSSES, ENDER_DRAGON];

export const BOSSES_BY_ID: Record<string, BossDef> = BOSSES.reduce<
  Record<string, BossDef>
>((acc, boss) => {
  acc[boss.id] = boss;
  return acc;
}, {});

export function getBoss(id: string): BossDef | null {
  return BOSSES_BY_ID[id] ?? null;
}

/** Default rotation order for the rotate selection mode. */
export const DEFAULT_ROTATION_ORDER: string[] = [
  "kitchen_creeper",
  "living_room_zombie",
  "bathroom_slime",
  "dining_room_skeleton",
  "bonus_room_wither",
];

// ==================================================================
// Capstone task assembly
// ==================================================================

/**
 * Flatten all room bosses' tasks into a single list for the Ender
 * Dragon. Each task keeps its original id (already namespaced per
 * boss, e.g. `kitchen_creeper:scrub_sink`) and gains a
 * `sourceBossId` so the fight UI can group by room.
 */
export function buildCapstoneTasks(): BossTaskDef[] {
  const out: BossTaskDef[] = [];
  for (const boss of ROOM_BOSSES) {
    for (const task of boss.tasks) {
      out.push({ ...task, sourceBossId: boss.id });
    }
  }
  return out;
}

/**
 * Compute the total HP for a boss. For capstones, returns the sum of
 * all room bosses' HP. For regular bosses, returns the sum of their
 * task damage.
 */
export function computeStaticBossHP(def: BossDef): number {
  if (def.isCapstone) {
    return ROOM_BOSSES.reduce(
      (sum, b) => sum + b.tasks.reduce((s, t) => s + t.damage, 0),
      0
    );
  }
  return def.tasks.reduce((s, t) => s + t.damage, 0);
}

// ==================================================================
// Validation (runs at module load)
//
// Catches:
//   - Duplicate task IDs (across all bosses)
//   - linkedSkillId references to skills that don't exist
//   - Missing required fields
//   - Capstone tasks defined statically (they must be empty)
// ==================================================================

function validateBossRoster(bosses: BossDef[]) {
  const errors: string[] = [];
  const seenTaskIds = new Set<string>();

  for (const boss of bosses) {
    if (!boss.id || !boss.name || !boss.zone) {
      errors.push(`Boss missing required field: ${boss.id || "<no-id>"}`);
      continue;
    }

    if (boss.isCapstone && boss.tasks.length > 0) {
      errors.push(
        `${boss.id}: capstone bosses must not define static tasks (found ${boss.tasks.length})`
      );
    }

    for (const task of boss.tasks) {
      if (seenTaskIds.has(task.id)) {
        errors.push(
          `Duplicate task id across bosses: ${task.id} (found in ${boss.id})`
        );
      }
      seenTaskIds.add(task.id);

      if (task.damage <= 0) {
        errors.push(`${task.id}: damage must be > 0`);
      }
      if (task.xp < 0) {
        errors.push(`${task.id}: xp must be ≥ 0`);
      }

      if (task.linkedSkillId && !WINTER_SKILLS_BY_ID[task.linkedSkillId]) {
        errors.push(
          `${task.id}: linkedSkillId "${task.linkedSkillId}" does not exist in Winter skill tree`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Boss roster validation failed:\n  - ${errors.join("\n  - ")}`
    );
  }
}

validateBossRoster(BOSSES);

// ==================================================================
// Re-exports
// ==================================================================

export {
  KITCHEN_CREEPER,
  LIVING_ROOM_ZOMBIE,
  BATHROOM_SLIME,
  DINING_ROOM_SKELETON,
  BONUS_ROOM_WITHER,
  ENDER_DRAGON,
};
