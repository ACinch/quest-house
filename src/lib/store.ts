"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AppState,
  ActiveBoss,
  BossDefeatLogEntry,
  BossDefeatParticipant,
  BossTaskState,
  ChestLogEntry,
  ChestTier,
  InventoryItem,
  Skill,
  TaskLogEntry,
  UserId,
  WinterSkillDef,
  WinterSkillState,
} from "./types";
import { buildDefaultState } from "./defaults";
import { SKILL_BRANCHES, branchesForUserWithCustom, findSkillWithCustom, isBossBranch, rankFor } from "./skills";
import {
  WINTER_SKILLS,
  WINTER_SKILLS_BY_ID,
} from "./data/winter-skills";
import {
  DEFAULT_WINTER_CHEST_POOL,
  rollWinterChest,
  pickSlipFromTier,
} from "./data/winter-chest-pool";
import {
  BOSSES_BY_ID,
  buildCapstoneTasks,
} from "./data/bosses";
import {
  computeTotalHP,
  computeDamageShares,
  tierFromPercent,
  bonusXPForTier,
  weekStartForDate,
  weekEndForStart,
} from "./bosses";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function nowISO() {
  return new Date().toISOString();
}

function getISOWeekStart(d: Date = new Date()): string {
  // Returns the most recent Sunday (or today if Sunday) as YYYY-MM-DD
  const day = d.getDay(); // 0 = Sunday
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}

function dollarsFor(xp: number, rate: number) {
  return Math.round(xp * rate * 100) / 100;
}

// ==================================================================
// Winter skill tree helpers (pure functions, exported for tests)
// ==================================================================

/**
 * Returns true if a Winter skill's prerequisites are all satisfied.
 * Three gating rules combine:
 *   1. `prerequisites` — every listed skill must be touched (or
 *      mastered, if prerequisitesMastered is true).
 *   2. `prerequisiteTotalMastered` — at least N total skills
 *      mastered anywhere in the tree.
 *   3. `prerequisiteDomainsRequired` — at least 1 mastered skill
 *      in each listed core domain (breadth gate).
 */
export function canUnlockWinterSkill(
  def: WinterSkillDef,
  tree: Record<string, WinterSkillState>
): boolean {
  // Direct prereqs
  for (const prereqId of def.prerequisites) {
    const st = tree[prereqId];
    if (!st) return false;
    if (def.prerequisitesMastered) {
      if (!st.mastered) return false;
    } else {
      if (st.completions < 1) return false;
    }
  }
  // Total-mastered gate
  if (def.prerequisiteTotalMastered) {
    const total = Object.values(tree).filter((s) => s.mastered).length;
    if (total < def.prerequisiteTotalMastered) return false;
  }
  // Domain breadth gate
  if (def.prerequisiteDomainsRequired) {
    for (const domain of def.prerequisiteDomainsRequired) {
      const has = WINTER_SKILLS.some(
        (s) => s.domain === domain && tree[s.id]?.mastered
      );
      if (!has) return false;
    }
  }
  return true;
}

/**
 * Whether a hidden convergence node should be revealed to Winter.
 * Per spec Q3 = option B: reveal when ≥1 prerequisite has been
 * touched (any completions > 0). For prereq-less hidden nodes that
 * gate on domains/totals, reveal as soon as any skill in a required
 * domain is touched (or any skill if the gate is total-mastered).
 */
export function shouldRevealHidden(
  def: WinterSkillDef,
  tree: Record<string, WinterSkillState>
): boolean {
  if (!def.isHidden) return true;

  if (def.prerequisites.length > 0) {
    return def.prerequisites.some(
      (p) => (tree[p]?.completions ?? 0) > 0
    );
  }
  if (def.prerequisiteDomainsRequired) {
    return def.prerequisiteDomainsRequired.some((domain) =>
      WINTER_SKILLS.some(
        (s) => s.domain === domain && (tree[s.id]?.completions ?? 0) > 0
      )
    );
  }
  if (def.prerequisiteTotalMastered) {
    return Object.values(tree).some((s) => s.completions > 0);
  }
  return true;
}

/**
 * Cascade unlock + reveal. Walks the whole tree after a change and
 * flips unlocked/revealed flags for any skills whose gates are now
 * satisfied. Repeats until a pass makes no changes (handles chains
 * where unlocking A also unlocks B whose gate depended on A).
 */
export function cascadeWinterTreeState(
  tree: Record<string, WinterSkillState>
): Record<string, WinterSkillState> {
  const next = { ...tree };
  let changed = true;
  while (changed) {
    changed = false;
    for (const def of WINTER_SKILLS) {
      const st = next[def.id];
      if (!st) continue;

      if (!st.unlocked && canUnlockWinterSkill(def, next)) {
        next[def.id] = { ...st, unlocked: true, revealed: true };
        changed = true;
        continue;
      }
      if (def.isHidden && !st.revealed && shouldRevealHidden(def, next)) {
        next[def.id] = { ...st, revealed: true };
        changed = true;
      }
    }
  }
  return next;
}

// ==================================================================
// Boss helpers
// ==================================================================

/**
 * Resolve the name of a boss task for display in the task log.
 * Walks both the built-in task defs (via BOSSES_BY_ID) and the
 * custom task list on the active boss.
 */
function findBossTaskName(
  taskId: string,
  boss: ActiveBoss
): string | null {
  const custom = boss.customTasks.find((t) => t.id === taskId);
  if (custom) return custom.name;

  // Built-in tasks: look up the boss def + its capstone sources.
  const def = BOSSES_BY_ID[boss.bossId];
  if (!def) return null;
  if (def.isCapstone) {
    // Capstone task IDs are namespaced per source boss.
    const [sourceBossId] = taskId.split(":", 1);
    const sourceDef = BOSSES_BY_ID[sourceBossId];
    const t = sourceDef?.tasks.find((x) => x.id === taskId);
    return t?.name ?? null;
  }
  return def.tasks.find((t) => t.id === taskId)?.name ?? null;
}

/**
 * Resolve the linkedSkillId for a boss task, walking both built-in
 * defs and the capstone source lookup. Custom tasks never have
 * linkedSkillId in v1.
 */
function findLinkedSkillId(
  taskId: string,
  boss: ActiveBoss
): string | null {
  if (taskId.startsWith("custom:")) return null;
  const def = BOSSES_BY_ID[boss.bossId];
  if (!def) return null;
  if (def.isCapstone) {
    const [sourceBossId] = taskId.split(":", 1);
    const sourceDef = BOSSES_BY_ID[sourceBossId];
    return sourceDef?.tasks.find((x) => x.id === taskId)?.linkedSkillId ?? null;
  }
  return def.tasks.find((t) => t.id === taskId)?.linkedSkillId ?? null;
}

/**
 * Pure defeat-resolution. Takes an in-progress AppState (boss HP at
 * 0, all tasks applied) and returns the post-resolution AppState:
 *   - Computes per-participant damage shares + tier + bonus XP
 *   - Credits bonus XP to each participant's weeklyBonusXP + lifetime
 *   - Mints a chest for Winter at her tier and pushes to inventory
 *   - Appends to bosses.log and surfaces a pendingDefeat payload
 *   - Clears bosses.active
 *
 * Returns the original state untouched if there's no active boss
 * or no bosses slice.
 */
function resolveBossDefeatPure(state: AppState): AppState {
  const bosses = state.bosses;
  if (!bosses?.active) return state;
  const active = bosses.active;
  const def = BOSSES_BY_ID[active.bossId];
  if (!def) return state;

  const now = nowISO();
  const totalDamageDealt = Object.values(active.participants).reduce(
    (sum, p) => sum + p.damageDealt,
    0
  );
  const shares = computeDamageShares(active.participants, totalDamageDealt);
  const pool = state.winterChestPool ?? DEFAULT_WINTER_CHEST_POOL;

  // Build the defeat log participants list + apply rewards.
  const users = { ...state.users };
  const defeatParticipants: BossDefeatParticipant[] = [];

  for (const share of shares) {
    const tier = tierFromPercent(share.damagePercent, bosses.config);
    const bonusXP = tier ? bonusXPForTier(tier, bosses.config) : 0;

    // Credit the user: weeklyBonusXP + lifetime.
    const user = { ...users[share.userId] };
    user.weeklyBonusXP += bonusXP;
    user.lifetimeXP += bonusXP;
    user.rank = rankFor(user.lifetimeXP);

    let chestReward: string | undefined;

    // Winter-only chest mint.
    if (share.userId === "winter" && tier) {
      const slip = pickSlipFromTier(pool, tier);
      if (slip) {
        chestReward = slip.text;
        const chest: ChestLogEntry = {
          id: uuid(),
          userId: "winter",
          trigger: "boss_level",
          triggerTask: active.bossId,
          reward: slip.text,
          tier,
          date: now,
        };
        const item: InventoryItem = {
          id: uuid(),
          reward: slip.text,
          category: slip.category,
          tier,
          drawnAt: now,
          trigger: "boss_level",
          redeemed: false,
          wildcardKind:
            slip.category === "Wildcard" ? "tier_choice" : undefined,
        };
        user.chestLog = [chest, ...user.chestLog];
        user.inventory = [...(user.inventory ?? []), item];
        user.chestsLooted += 1;
      }
    }

    users[share.userId] = user;

    defeatParticipants.push({
      userId: share.userId,
      tasksCompleted: active.participants[share.userId]?.tasksCompleted ?? 0,
      damageDealt: share.damageDealt,
      damagePercent: share.damagePercent,
      chestTier: tier,
      bonusXP,
      chestReward,
    });
  }

  const logEntry: BossDefeatLogEntry = {
    id: active.instanceId,
    bossId: active.bossId,
    bossName: def.name,
    weekStartDate: active.weekStartDate,
    defeated: true,
    finalHP: 0,
    totalDamageDealt,
    participants: defeatParticipants,
    defeatedAt: now,
  };

  return {
    ...state,
    users,
    bosses: {
      ...bosses,
      active: null,
      log: [logEntry, ...bosses.log],
      pendingDefeat: logEntry,
    },
  };
}

// Re-export so Phase F (zone-skill side effect) can import it.
export { resolveBossDefeatPure };

interface ChestDropPayload {
  userId: UserId;
  trigger: ChestLogEntry["trigger"];
  triggerTask?: string;
}

export interface QuestHouseStore {
  state: AppState;
  /** UI: which user is being viewed */
  activeUser: UserId;
  /** Triggered chest drop awaiting acknowledgement */
  pendingChest: ChestLogEntry | null;

  setActiveUser: (id: UserId) => void;
  resetState: () => void;
  importState: (incoming: AppState) => void;
  exportState: () => AppState;

  updateConfig: (patch: Partial<AppState["config"]>) => void;

  /** Roll the weekly window forward if needed (Winter only) */
  rolloverWeekIfNeeded: () => void;

  completeTask: (params: {
    userId: UserId;
    branchId: string;
    skillId: string;
    confirmedBy?: UserId | "self";
    notes?: string;
  }) => { xpAwarded: number; chest: ChestLogEntry | null; mastered: boolean };

  /**
   * Complete a Winter skill tree node. Unlike completeTask (adults),
   * this awards XP, cascades unlocks through the full web, reveals
   * hidden convergence nodes as their prereqs are touched, rolls
   * tier-weighted chests, and pushes drawn rewards into Winter's
   * inventory.
   *
   * Per spec Q2 = option B (parent-driven), only a parent should
   * ever dispatch this. The UI guards against Winter calling it; the
   * store doesn't enforce server-side role here (there's no server).
   */
  completeWinterSkill: (params: {
    skillId: string;
    confirmedBy: UserId;
    notes?: string;
  }) => {
    xpAwarded: number;
    mastered: boolean;
    chests: ChestLogEntry[];
    inventoryItems: InventoryItem[];
  };

  /** Redeem a Winter inventory item. Wildcards go to resolveWildcard. */
  redeemInventoryItem: (itemId: string) => void;

  /** Resolve a "tier of choice" wildcard by picking a tier. */
  resolveWildcardSlip: (itemId: string, chosenTier: ChestTier) => void;

  /** Parent-grant: manually add a bonus inventory item to Winter. */
  parentGrantWinterChest: (tier: ChestTier, note?: string) => void;

  /** Manually drop a chest */
  triggerChest: (p: ChestDropPayload) => ChestLogEntry;
  /** Resolve a pending chest by setting the drawn reward */
  resolvePendingChest: (rewardText: string) => void;
  dismissPendingChest: () => void;

  // Wishlist & rewards
  addHouseWishlistItem: (name: string, notes?: string) => void;
  removeHouseWishlistItem: (id: string) => void;
  addPersonalWishlistItem: (userId: UserId, name: string, notes?: string) => void;
  removePersonalWishlistItem: (userId: UserId, id: string) => void;
  redeemMilestone: (userId: UserId, itemName: string) => void;

  // Toy rotation
  logToyRotation: (outBin: string, inBin: string, donatedItems?: string) => void;
  setBinContents: (binId: string, contents: string) => void;

  // Weekend reset
  logWeekendReset: (notes?: string) => void;
  setWeekendResetLevel: (level: 1 | 2 | 3) => void;

  // Custom quests
  addCustomQuest: (quest: Omit<Skill, "id" | "branchId" | "order"> & { branchId: "home_admin" | "exterior_seasonal" }) => void;
  removeCustomQuest: (branchId: string, skillId: string) => void;

  // Chest pool management
  addChestSlip: (userId: UserId, text: string, category?: string) => void;
  removeChestSlip: (userId: UserId, id: string) => void;
  updateChestSlip: (userId: UserId, id: string, text: string, category?: string) => void;

  // ================================================================
  // Weekly Boss actions
  // ================================================================

  /**
   * Start a new boss instance in "spawning" status. All tasks start
   * active. For capstones (Ender Dragon), flatten all room bosses'
   * tasks into the task map. Clears any stale spawning boss first.
   * Parent-only (UI-enforced).
   */
  selectBoss: (bossId: string) => void;

  /** Toggle a task's `active` flag during the spawning phase. */
  toggleBossTask: (taskId: string) => void;

  /** Append a custom one-off task to the spawning boss. */
  addCustomBossTask: (task: { name: string; damage: number; xp: number }) => void;

  /** Remove a custom task (cannot remove built-in tasks). */
  removeCustomBossTask: (taskId: string) => void;

  /** Lock the task list and transition from "spawning" → "active". */
  spawnBoss: () => void;

  /** Reset (clear) any active boss. Parent escape hatch. */
  resetActiveBoss: () => void;

  /**
   * Mark a boss task as completed. Applies damage, awards task XP to
   * `creditedUserId`, tracks participant stats, and auto-resolves
   * the boss if HP reaches 0. For tasks with a `linkedSkillId`
   * credited to Winter, also progresses that skill (no extra XP,
   * no random chest — the task XP covers it).
   */
  completeBossTask: (params: {
    taskId: string;
    creditedUserId: UserId;
    confirmedBy: UserId;
  }) => void;

  /**
   * Dismiss the defeat celebration overlay. Called when the user
   * acknowledges their rewards.
   */
  acknowledgeBossDefeat: () => void;
}

export const useStore = create<QuestHouseStore>()(
  persist(
    (set, get) => ({
      state: buildDefaultState(),
      activeUser: "winter",
      pendingChest: null,

      setActiveUser: (id) => set({ activeUser: id }),

      resetState: () => set({ state: buildDefaultState(), pendingChest: null, activeUser: "winter" }),

      importState: (incoming) => set({ state: incoming, pendingChest: null }),

      exportState: () => get().state,

      updateConfig: (patch) =>
        set((s) => ({
          state: { ...s.state, config: { ...s.state.config, ...patch } },
        })),

      rolloverWeekIfNeeded: () => {
        const s = get().state;
        const currentWeek = getISOWeekStart();
        let changed = false;
        const users = { ...s.users };
        for (const id of Object.keys(users) as UserId[]) {
          const u = users[id];
          if (u.weekStartDate !== currentWeek) {
            // Archive last week's summary if there was activity
            if ((u.currentWeekXP > 0 || u.weeklyBonusXP > 0) && id === "winter") {
              u.weeklySummaries = [
                ...u.weeklySummaries,
                {
                  weekStartDate: u.weekStartDate,
                  weekEndDate: currentWeek,
                  xpEarned: u.currentWeekXP,
                  bonusXPEarned: u.weeklyBonusXP,
                  dollarsEarned: dollarsFor(
                    Math.min(u.currentWeekXP, s.config.weeklyXPCap),
                    s.config.xpToDollarRate
                  ),
                  bonusDollarsEarned: dollarsFor(
                    u.weeklyBonusXP,
                    s.config.xpToDollarRate
                  ),
                  tasksCompleted: 0,
                  chestsLooted: 0,
                  skillsProgressed: [],
                  newMasteries: [],
                  rankChange: null,
                },
              ];
            }
            users[id] = {
              ...u,
              weekStartDate: currentWeek,
              currentWeekXP: 0,
              weeklyBonusXP: 0,
            };
            changed = true;
          }
        }
        if (changed) set({ state: { ...s, users } });
      },

      completeTask: ({ userId, branchId, skillId, confirmedBy = "self", notes }) => {
        const s = get().state;
        const found = findSkillWithCustom(branchId, skillId, s.config.customQuests);
        if (!found) return { xpAwarded: 0, chest: null, mastered: false };
        const { skill, branch } = found;

        const user = { ...s.users[userId] };
        const branchSkills = { ...(user.skills[branchId] || {}) };
        const skillState = { ...(branchSkills[skill.id] || { unlocked: false, mastered: false, completions: 0 }) };

        if (!skillState.unlocked) {
          return { xpAwarded: 0, chest: null, mastered: false };
        }

        skillState.completions += 1;
        skillState.lastCompletedAt = nowISO();
        let mastered = skillState.mastered;
        if (!mastered && skillState.completions >= s.config.masteryThreshold) {
          skillState.mastered = true;
          mastered = true;
        }
        branchSkills[skill.id] = skillState;

        // Sequential unlock: when this skill becomes mastered, unlock the next in branch
        if (mastered && !branch.nonSequential) {
          const sorted = [...branch.skills].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((x) => x.id === skill.id);
          const next = sorted[idx + 1];
          if (next) {
            const ns = branchSkills[next.id] || { unlocked: false, mastered: false, completions: 0 };
            branchSkills[next.id] = { ...ns, unlocked: true };
          }
        }

        // XP awarding
        const isAdult = userId !== "winter";
        const xp = skill.xp;

        user.lifetimeXP += xp;
        if (isAdult) {
          user.currentMilestoneXP += xp;
        } else {
          user.currentWeekXP += xp;
        }

        const oldRank = user.rank;
        user.rank = rankFor(user.lifetimeXP);
        const rankUp = oldRank !== user.rank;

        // Task log entry
        const taskEntry: TaskLogEntry = {
          id: uuid(),
          userId,
          skillBranch: branchId,
          skillId: skill.id,
          taskName: skill.description,
          xpEarned: xp,
          completedAt: nowISO(),
          confirmedBy,
          chestTriggered: false,
          notes,
        };

        // Chest triggers
        let chest: ChestLogEntry | null = null;
        const triggers: { trigger: ChestLogEntry["trigger"]; reason: string }[] = [];
        if (isBossBranch(branchId)) triggers.push({ trigger: "boss_level", reason: skill.id });
        if (mastered) triggers.push({ trigger: "mastery", reason: skill.id });
        if (rankUp) triggers.push({ trigger: "rank_up", reason: user.rank });
        if (
          !isAdult &&
          user.currentWeekXP >= s.config.weeklyXPCap &&
          user.currentWeekXP - xp < s.config.weeklyXPCap
        ) {
          triggers.push({ trigger: "weekly_cap", reason: "weekly cap reached" });
        }
        if (Math.random() < s.config.chestDropChance) {
          triggers.push({ trigger: "random_drop", reason: skill.id });
        }

        if (triggers.length > 0) {
          // Pick the highest-priority chest (just take the first non-random if any, else random)
          const primary = triggers.find((t) => t.trigger !== "random_drop") || triggers[0];
          chest = {
            id: uuid(),
            userId,
            trigger: primary.trigger,
            triggerTask: primary.reason,
            date: nowISO(),
          };
          taskEntry.chestTriggered = true;
          user.chestsLooted += 1;
          user.chestLog = [chest, ...user.chestLog];
        }

        user.taskLog = [taskEntry, ...user.taskLog];
        user.skills = { ...user.skills, [branchId]: branchSkills };

        // Adult milestone advancement
        if (isAdult && user.currentMilestoneXP >= s.config.adultMilestoneThreshold) {
          user.milestonesEarned += 1;
          user.currentMilestoneXP = user.currentMilestoneXP - s.config.adultMilestoneThreshold;
        }

        const nextUsers = { ...s.users, [userId]: user };
        set({
          state: { ...s, users: nextUsers },
          pendingChest: chest,
        });

        return { xpAwarded: xp, chest, mastered };
      },

      completeWinterSkill: ({ skillId, confirmedBy, notes }) => {
        const s = get().state;
        const def = WINTER_SKILLS_BY_ID[skillId];
        if (!def) {
          return { xpAwarded: 0, mastered: false, chests: [], inventoryItems: [] };
        }

        const user = { ...s.users.winter };
        if (!user.skillTree) {
          return { xpAwarded: 0, mastered: false, chests: [], inventoryItems: [] };
        }

        const tree = { ...user.skillTree.skills };
        const current = tree[skillId];
        if (!current || !current.unlocked) {
          return { xpAwarded: 0, mastered: false, chests: [], inventoryItems: [] };
        }

        // Increment completion and check mastery.
        const nextState: WinterSkillState = {
          ...current,
          completions: current.completions + 1,
          lastCompletedAt: nowISO(),
        };
        let justMastered = false;
        if (!nextState.mastered && nextState.completions >= s.config.masteryThreshold) {
          nextState.mastered = true;
          justMastered = true;
        }
        tree[skillId] = nextState;

        // Cascade unlock + reveal across the whole tree.
        const cascaded = cascadeWinterTreeState(tree);
        user.skillTree = { skills: cascaded };

        // XP awarding.
        const xp = def.baseXP;
        user.lifetimeXP += xp;
        user.currentWeekXP += xp;
        const oldRank = user.rank;
        user.rank = rankFor(user.lifetimeXP);
        const rankUp = oldRank !== user.rank;

        // Task log entry. Winter's domain goes into skillBranch for
        // compatibility with the existing log filter UI.
        const taskEntry: TaskLogEntry = {
          id: uuid(),
          userId: "winter",
          skillBranch: def.domain,
          skillId: def.id,
          taskName: def.description,
          xpEarned: xp,
          completedAt: nowISO(),
          confirmedBy,
          chestTriggered: false,
          notes,
        };

        // Chest triggers (Winter only — adults don't get tiered chests).
        const triggers: ChestLogEntry["trigger"][] = [];
        if (def.guaranteedChest) triggers.push("boss_level");
        if (justMastered) triggers.push("mastery");
        if (rankUp) triggers.push("rank_up");
        if (
          user.currentWeekXP >= s.config.weeklyXPCap &&
          user.currentWeekXP - xp < s.config.weeklyXPCap
        ) {
          triggers.push("weekly_cap");
        }
        if (Math.random() < s.config.chestDropChance) {
          triggers.push("random_drop");
        }

        // Roll one chest per trigger, mint inventory items + chest log.
        const pool = s.winterChestPool ?? DEFAULT_WINTER_CHEST_POOL;
        const newChests: ChestLogEntry[] = [];
        const newInventoryItems: InventoryItem[] = [];
        for (const trigger of triggers) {
          const roll = rollWinterChest(pool, s.config.tierDropRates);
          if (!roll) continue;
          const chest: ChestLogEntry = {
            id: uuid(),
            userId: "winter",
            trigger,
            triggerTask: def.id,
            reward: roll.slip.text,
            tier: roll.tier,
            date: nowISO(),
          };
          newChests.push(chest);
          const invItem: InventoryItem = {
            id: uuid(),
            reward: roll.slip.text,
            category: roll.slip.category,
            tier: roll.tier,
            drawnAt: nowISO(),
            trigger,
            redeemed: false,
            wildcardKind:
              roll.slip.category === "Wildcard" ? "tier_choice" : undefined,
          };
          newInventoryItems.push(invItem);
        }

        if (newChests.length > 0) {
          taskEntry.chestTriggered = true;
          user.chestsLooted += newChests.length;
          user.chestLog = [...newChests, ...user.chestLog];
          user.inventory = [...(user.inventory || []), ...newInventoryItems];
        }
        user.taskLog = [taskEntry, ...user.taskLog];

        // The existing ChestDropModal listens to `pendingChest`. For
        // Winter we still surface the first chest here so the modal
        // fires — but because the reward is already baked into the
        // inventory, the UI branches on tier/reward rather than
        // prompting for manual entry.
        const firstChest = newChests[0] ?? null;

        set({
          state: { ...s, users: { ...s.users, winter: user } },
          pendingChest: firstChest,
        });

        return {
          xpAwarded: xp,
          mastered: justMastered,
          chests: newChests,
          inventoryItems: newInventoryItems,
        };
      },

      redeemInventoryItem: (itemId) =>
        set((s) => {
          const user = { ...s.state.users.winter };
          const inventory = user.inventory ?? [];
          const item = inventory.find((i) => i.id === itemId);
          if (!item || item.redeemed) return s;
          // Wildcards go through resolveWildcardSlip instead — redeeming
          // a wildcard directly is a no-op (the UI should steer users
          // toward the tier picker).
          if (item.wildcardKind === "tier_choice") return s;

          const nextInventory = inventory.map((i) =>
            i.id === itemId ? { ...i, redeemed: true, redeemedAt: nowISO() } : i
          );
          user.inventory = nextInventory;
          return {
            state: { ...s.state, users: { ...s.state.users, winter: user } },
          };
        }),

      resolveWildcardSlip: (itemId, chosenTier) =>
        set((s) => {
          const user = { ...s.state.users.winter };
          const inventory = user.inventory ?? [];
          const item = inventory.find((i) => i.id === itemId);
          if (!item || item.redeemed) return s;
          if (item.wildcardKind !== "tier_choice") return s;

          const pool = s.state.winterChestPool ?? DEFAULT_WINTER_CHEST_POOL;
          const slip = pickSlipFromTier(pool, chosenTier);
          if (!slip) return s;

          // Mark the wildcard as redeemed and mint a fresh inventory item.
          const resolvedInventory = inventory.map((i) =>
            i.id === itemId ? { ...i, redeemed: true, redeemedAt: nowISO() } : i
          );
          const newItem: InventoryItem = {
            id: uuid(),
            reward: slip.text,
            category: slip.category,
            tier: chosenTier,
            drawnAt: nowISO(),
            trigger: "manual",
            redeemed: false,
          };
          user.inventory = [...resolvedInventory, newItem];

          // Log the resolution as a chest log entry so it shows up in
          // the history.
          const chestEntry: ChestLogEntry = {
            id: uuid(),
            userId: "winter",
            trigger: "manual",
            triggerTask: "wildcard_resolution",
            reward: slip.text,
            tier: chosenTier,
            date: nowISO(),
          };
          user.chestLog = [chestEntry, ...user.chestLog];
          user.chestsLooted += 1;

          return {
            state: { ...s.state, users: { ...s.state.users, winter: user } },
          };
        }),

      parentGrantWinterChest: (tier, note) =>
        set((s) => {
          const pool = s.state.winterChestPool ?? DEFAULT_WINTER_CHEST_POOL;
          const slip = pickSlipFromTier(pool, tier);
          if (!slip) return s;

          const user = { ...s.state.users.winter };
          const item: InventoryItem = {
            id: uuid(),
            reward: slip.text,
            category: slip.category,
            tier,
            drawnAt: nowISO(),
            trigger: "manual",
            redeemed: false,
            wildcardKind:
              slip.category === "Wildcard" ? "tier_choice" : undefined,
          };
          user.inventory = [...(user.inventory || []), item];

          const chestEntry: ChestLogEntry = {
            id: uuid(),
            userId: "winter",
            trigger: "manual",
            triggerTask: note || "parent_grant",
            reward: slip.text,
            tier,
            date: nowISO(),
          };
          user.chestLog = [chestEntry, ...user.chestLog];
          user.chestsLooted += 1;

          return {
            state: { ...s.state, users: { ...s.state.users, winter: user } },
            pendingChest: chestEntry,
          };
        }),

      triggerChest: ({ userId, trigger, triggerTask }) => {
        const s = get().state;
        const chest: ChestLogEntry = {
          id: uuid(),
          userId,
          trigger,
          triggerTask,
          date: nowISO(),
        };
        const user = { ...s.users[userId] };
        user.chestsLooted += 1;
        user.chestLog = [chest, ...user.chestLog];
        set({
          state: { ...s, users: { ...s.users, [userId]: user } },
          pendingChest: chest,
        });
        return chest;
      },

      resolvePendingChest: (rewardText) => {
        const { pendingChest, state } = get();
        if (!pendingChest) return;
        const user = { ...state.users[pendingChest.userId] };
        user.chestLog = user.chestLog.map((c) =>
          c.id === pendingChest.id ? { ...c, reward: rewardText } : c
        );
        set({
          state: { ...state, users: { ...state.users, [user.id]: user } },
          pendingChest: null,
        });
      },

      dismissPendingChest: () => set({ pendingChest: null }),

      addHouseWishlistItem: (name, notes) =>
        set((s) => ({
          state: {
            ...s.state,
            adultRewardCycle: {
              ...s.state.adultRewardCycle,
              houseWishlist: [
                ...s.state.adultRewardCycle.houseWishlist,
                { id: uuid(), name, notes },
              ],
            },
          },
        })),

      removeHouseWishlistItem: (id) =>
        set((s) => ({
          state: {
            ...s.state,
            adultRewardCycle: {
              ...s.state.adultRewardCycle,
              houseWishlist: s.state.adultRewardCycle.houseWishlist.filter((i) => i.id !== id),
            },
          },
        })),

      addPersonalWishlistItem: (userId, name, notes) =>
        set((s) => {
          const user = { ...s.state.users[userId] };
          user.rewardWishlist = [...user.rewardWishlist, { id: uuid(), name, notes }];
          return { state: { ...s.state, users: { ...s.state.users, [userId]: user } } };
        }),

      removePersonalWishlistItem: (userId, id) =>
        set((s) => {
          const user = { ...s.state.users[userId] };
          user.rewardWishlist = user.rewardWishlist.filter((i) => i.id !== id);
          return { state: { ...s.state, users: { ...s.state.users, [userId]: user } } };
        }),

      redeemMilestone: (userId, itemName) =>
        set((s) => {
          const cycle = s.state.adultRewardCycle;
          const type = cycle.currentPosition;
          const nextIdx = (cycle.cycle.indexOf(type) + 1) % cycle.cycle.length;
          const nextType = cycle.cycle[nextIdx];

          const log = [
            ...cycle.rewardLog,
            { id: uuid(), type, userId, item: itemName, date: nowISO() },
          ];

          // Mark item as earned in the appropriate wishlist
          let users = s.state.users;
          let houseWishlist = cycle.houseWishlist;
          if (type === "house") {
            houseWishlist = houseWishlist.map((i) =>
              i.name === itemName ? { ...i, earned: true, earnedAt: nowISO() } : i
            );
          } else {
            const u = { ...users[userId] };
            u.rewardWishlist = u.rewardWishlist.map((i) =>
              i.name === itemName ? { ...i, earned: true, earnedAt: nowISO() } : i
            );
            users = { ...users, [userId]: u };
          }

          return {
            state: {
              ...s.state,
              users,
              adultRewardCycle: {
                ...cycle,
                houseWishlist,
                currentPosition: nextType,
                rewardLog: log,
              },
            },
          };
        }),

      logToyRotation: (outBin, inBin, donatedItems) =>
        set((s) => {
          const date = nowISO();
          const bins = s.state.toyRotation.bins.map((b) => {
            if (b.id === outBin) return { ...b, status: "inactive" as const, lastSwap: date };
            if (b.id === inBin) return { ...b, status: "active" as const, lastSwap: date };
            return b;
          });
          return {
            state: {
              ...s.state,
              toyRotation: {
                ...s.state.toyRotation,
                bins,
                lastRotationDate: date,
                rotationLog: [
                  { id: uuid(), date, outBin, inBin, donatedItems },
                  ...s.state.toyRotation.rotationLog,
                ],
              },
            },
          };
        }),

      setBinContents: (binId, contents) =>
        set((s) => ({
          state: {
            ...s.state,
            toyRotation: {
              ...s.state.toyRotation,
              bins: s.state.toyRotation.bins.map((b) =>
                b.id === binId ? { ...b, contents } : b
              ),
            },
          },
        })),

      logWeekendReset: (notes) =>
        set((s) => {
          const date = nowISO();
          return {
            state: {
              ...s.state,
              weekendReset: {
                lastResetDate: date,
                log: [
                  { id: uuid(), date, level: s.state.config.weekendResetLevel, notes },
                  ...s.state.weekendReset.log,
                ],
              },
            },
          };
        }),

      setWeekendResetLevel: (level) =>
        set((s) => ({
          state: { ...s.state, config: { ...s.state.config, weekendResetLevel: level } },
        })),

      addCustomQuest: (quest) =>
        set((s) => {
          const newSkill: Skill = {
            ...quest,
            id: `custom_${uuid().slice(0, 8)}`,
            branchId: quest.branchId,
            order: 100 + s.state.config.customQuests.length,
            nonSequential: true,
            custom: true,
          };
          // Initialize skill state for both adults
          const users = { ...s.state.users };
          for (const uid of ["rebekah", "maarten"] as UserId[]) {
            const u = { ...users[uid] };
            const branchMap = { ...(u.skills[quest.branchId] || {}) };
            branchMap[newSkill.id] = { unlocked: true, mastered: false, completions: 0, lastCompletedAt: null };
            u.skills = { ...u.skills, [quest.branchId]: branchMap };
            users[uid] = u;
          }
          return {
            state: {
              ...s.state,
              users,
              config: {
                ...s.state.config,
                customQuests: [...s.state.config.customQuests, newSkill],
              },
            },
          };
        }),

      removeCustomQuest: (branchId, skillId) =>
        set((s) => {
          const users = { ...s.state.users };
          for (const uid of ["rebekah", "maarten"] as UserId[]) {
            const u = { ...users[uid] };
            const branchMap = { ...(u.skills[branchId] || {}) };
            delete branchMap[skillId];
            u.skills = { ...u.skills, [branchId]: branchMap };
            users[uid] = u;
          }
          return {
            state: {
              ...s.state,
              users,
              config: {
                ...s.state.config,
                customQuests: s.state.config.customQuests.filter((q) => q.id !== skillId),
              },
            },
          };
        }),

      addChestSlip: (userId, text, category = "Custom") =>
        set((s) => ({
          state: {
            ...s.state,
            chestRewardPools: {
              ...s.state.chestRewardPools,
              [userId]: [...s.state.chestRewardPools[userId], { id: uuid(), text, category }],
            },
          },
        })),

      removeChestSlip: (userId, id) =>
        set((s) => ({
          state: {
            ...s.state,
            chestRewardPools: {
              ...s.state.chestRewardPools,
              [userId]: s.state.chestRewardPools[userId].filter((slip) => slip.id !== id),
            },
          },
        })),

      updateChestSlip: (userId, id, text, category) =>
        set((s) => ({
          state: {
            ...s.state,
            chestRewardPools: {
              ...s.state.chestRewardPools,
              [userId]: s.state.chestRewardPools[userId].map((slip) =>
                slip.id === id ? { ...slip, text, ...(category ? { category } : {}) } : slip
              ),
            },
          },
        })),

      // ============================================================
      // Weekly Boss actions
      // ============================================================

      selectBoss: (bossId) =>
        set((s) => {
          const def = BOSSES_BY_ID[bossId];
          if (!def || !s.state.bosses) return s;

          const now = nowISO();
          const weekStart = weekStartForDate();
          const weekEnd = weekEndForStart(weekStart);

          // Assemble task list — flatten capstones at spawn time.
          const sourceTasks = def.isCapstone ? buildCapstoneTasks() : def.tasks;
          const taskStates: Record<string, BossTaskState> = {};
          for (const t of sourceTasks) {
            taskStates[t.id] = {
              taskId: t.id,
              active: true,
              completed: false,
              damage: t.damage,
              xp: t.xp,
            };
          }
          const totalHP = Object.values(taskStates).reduce(
            (sum, t) => sum + t.damage,
            0
          );

          const active: ActiveBoss = {
            instanceId: uuid(),
            bossId,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            totalHP,
            currentHP: totalHP,
            tasks: taskStates,
            customTasks: [],
            participants: {},
            spawnedAt: now,
            status: "spawning",
          };

          return {
            state: {
              ...s.state,
              bosses: {
                ...s.state.bosses,
                active,
                pendingDefeat: null,
              },
            },
          };
        }),

      toggleBossTask: (taskId) =>
        set((s) => {
          const bosses = s.state.bosses;
          if (!bosses?.active) return s;
          if (bosses.active.status !== "spawning") return s;
          const existing = bosses.active.tasks[taskId];
          if (!existing) return s;
          const nextTasks = {
            ...bosses.active.tasks,
            [taskId]: { ...existing, active: !existing.active },
          };
          const total =
            Object.values(nextTasks).reduce(
              (sum, t) => sum + (t.active ? t.damage : 0),
              0
            ) +
            bosses.active.customTasks.reduce((sum, t) => sum + t.damage, 0);
          return {
            state: {
              ...s.state,
              bosses: {
                ...bosses,
                active: {
                  ...bosses.active,
                  tasks: nextTasks,
                  totalHP: total,
                  currentHP: total,
                },
              },
            },
          };
        }),

      addCustomBossTask: ({ name, damage, xp }) =>
        set((s) => {
          const bosses = s.state.bosses;
          if (!bosses?.active) return s;
          if (bosses.active.status !== "spawning") return s;
          if (!name.trim() || damage <= 0) return s;
          const id = `custom:${uuid()}`;
          const nextCustoms = [
            ...bosses.active.customTasks,
            { id, name: name.trim(), damage, xp },
          ];
          const nextTasks = {
            ...bosses.active.tasks,
            [id]: {
              taskId: id,
              active: true,
              completed: false,
              damage,
              xp,
            },
          };
          const total = computeTotalHP({
            ...bosses.active,
            tasks: nextTasks,
            customTasks: nextCustoms,
          });
          return {
            state: {
              ...s.state,
              bosses: {
                ...bosses,
                active: {
                  ...bosses.active,
                  tasks: nextTasks,
                  customTasks: nextCustoms,
                  totalHP: total,
                  currentHP: total,
                },
              },
            },
          };
        }),

      removeCustomBossTask: (taskId) =>
        set((s) => {
          const bosses = s.state.bosses;
          if (!bosses?.active) return s;
          if (bosses.active.status !== "spawning") return s;
          if (!taskId.startsWith("custom:")) return s;
          const nextCustoms = bosses.active.customTasks.filter(
            (t) => t.id !== taskId
          );
          const nextTasks = { ...bosses.active.tasks };
          delete nextTasks[taskId];
          const total = computeTotalHP({
            ...bosses.active,
            tasks: nextTasks,
            customTasks: nextCustoms,
          });
          return {
            state: {
              ...s.state,
              bosses: {
                ...bosses,
                active: {
                  ...bosses.active,
                  tasks: nextTasks,
                  customTasks: nextCustoms,
                  totalHP: total,
                  currentHP: total,
                },
              },
            },
          };
        }),

      spawnBoss: () =>
        set((s) => {
          const bosses = s.state.bosses;
          if (!bosses?.active) return s;
          if (bosses.active.status !== "spawning") return s;
          return {
            state: {
              ...s.state,
              bosses: {
                ...bosses,
                active: {
                  ...bosses.active,
                  status: "active",
                  spawnedAt: nowISO(),
                },
              },
            },
          };
        }),

      resetActiveBoss: () =>
        set((s) => {
          if (!s.state.bosses) return s;
          return {
            state: {
              ...s.state,
              bosses: {
                ...s.state.bosses,
                active: null,
                pendingDefeat: null,
              },
            },
          };
        }),

      completeBossTask: ({ taskId, creditedUserId, confirmedBy }) =>
        set((s) => {
          const bosses = s.state.bosses;
          if (!bosses?.active) return s;
          if (bosses.active.status !== "active") return s;
          const task = bosses.active.tasks[taskId];
          if (!task || !task.active || task.completed) return s;

          // 1. Close the task and apply damage.
          const now = nowISO();
          const nextTask: BossTaskState = {
            ...task,
            completed: true,
            creditedUserId,
            confirmedBy,
            completedAt: now,
          };
          const nextTasks = { ...bosses.active.tasks, [taskId]: nextTask };
          const nextHP = Math.max(0, bosses.active.currentHP - task.damage);

          // 2. Bookkeeping on the credited participant.
          const existingParticipant =
            bosses.active.participants[creditedUserId] ?? {
              userId: creditedUserId,
              tasksCompleted: 0,
              damageDealt: 0,
            };
          const nextParticipants = {
            ...bosses.active.participants,
            [creditedUserId]: {
              ...existingParticipant,
              tasksCompleted: existingParticipant.tasksCompleted + 1,
              damageDealt: existingParticipant.damageDealt + task.damage,
            },
          };

          // 3. Award task XP to the credited user (regular XP, not bonus).
          //    Mirrors the inline XP logic in completeTask/completeWinterSkill.
          const users = { ...s.state.users };
          const credited = { ...users[creditedUserId] };
          credited.lifetimeXP += task.xp;
          if (creditedUserId === "winter") {
            credited.currentWeekXP += task.xp;
          } else {
            credited.currentMilestoneXP += task.xp;
            if (credited.currentMilestoneXP >= s.state.config.adultMilestoneThreshold) {
              credited.milestonesEarned += 1;
              credited.currentMilestoneXP -=
                s.state.config.adultMilestoneThreshold;
            }
          }
          credited.rank = rankFor(credited.lifetimeXP);

          // 4. Task log entry.
          const taskDef = BOSSES_BY_ID[bosses.active.bossId];
          const logEntry: TaskLogEntry = {
            id: uuid(),
            userId: creditedUserId,
            skillBranch: `boss:${bosses.active.bossId}`,
            skillId: taskId,
            taskName: task.taskId
              ? // Look up the task def for the display name — fall back to
                // the task id if the def can't be found (shouldn't happen).
                findBossTaskName(taskId, bosses.active) ?? taskId
              : taskId,
            xpEarned: task.xp,
            completedAt: now,
            confirmedBy,
            chestTriggered: false,
          };
          credited.taskLog = [logEntry, ...credited.taskLog];

          // 5. Linked skill progression (Winter only). Directly bump
          //    the completion count + cascade. No extra XP or chest.
          if (
            creditedUserId === "winter" &&
            credited.skillTree
          ) {
            const linkedId = findLinkedSkillId(taskId, bosses.active);
            if (linkedId && credited.skillTree.skills[linkedId]) {
              const tree = { ...credited.skillTree.skills };
              const cur = tree[linkedId];
              const nextCompletions = cur.completions + 1;
              const justMastered =
                !cur.mastered &&
                nextCompletions >= s.state.config.masteryThreshold;
              tree[linkedId] = {
                ...cur,
                completions: nextCompletions,
                mastered: cur.mastered || justMastered,
                lastCompletedAt: now,
              };
              credited.skillTree = {
                skills: cascadeWinterTreeState(tree),
              };
            }
          }

          users[creditedUserId] = credited;

          // 6. Apply the mutation and check for defeat.
          const nextBosses = {
            ...bosses,
            active: {
              ...bosses.active,
              tasks: nextTasks,
              currentHP: nextHP,
              participants: nextParticipants,
            },
          };

          const midState: AppState = {
            ...s.state,
            users,
            bosses: nextBosses,
          };

          if (nextHP <= 0) {
            return { state: resolveBossDefeatPure(midState) };
          }

          // Touch taskDef just to keep TS happy about the unused var.
          void taskDef;
          return { state: midState };
        }),

      acknowledgeBossDefeat: () =>
        set((s) => {
          if (!s.state.bosses) return s;
          return {
            state: {
              ...s.state,
              bosses: {
                ...s.state.bosses,
                pendingDefeat: null,
              },
            },
          };
        }),
    }),
    {
      name: "quest-house-state-v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage))),
      partialize: (s) => ({ state: s.state, activeUser: s.activeUser }),
    }
  )
);

export function getAllSkillBranches() {
  return SKILL_BRANCHES;
}

export function getBranchesForUser(userId: UserId, customQuests: Skill[] = []) {
  return branchesForUserWithCustom(userId, customQuests);
}
