"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AppState,
  ChestLogEntry,
  Skill,
  TaskLogEntry,
  UserId,
} from "./types";
import { buildDefaultState } from "./defaults";
import { SKILL_BRANCHES, branchesForUserWithCustom, findSkillWithCustom, isBossBranch, rankFor } from "./skills";

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
            if (u.currentWeekXP > 0 && id === "winter") {
              u.weeklySummaries = [
                ...u.weeklySummaries,
                {
                  weekStartDate: u.weekStartDate,
                  weekEndDate: currentWeek,
                  xpEarned: u.currentWeekXP,
                  dollarsEarned: dollarsFor(u.currentWeekXP, s.config.xpToDollarRate),
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
