import {
  AppState,
  ChestRewardSlip,
  SkillState,
  UserId,
  UserState,
} from "./types";
import { SKILL_BRANCHES, branchesForUser } from "./skills";

const WEEK_START = "2026-04-12"; // Sunday

function buildSkills(userId: UserId): Record<string, Record<string, SkillState>> {
  const out: Record<string, Record<string, SkillState>> = {};
  for (const branch of branchesForUser(userId)) {
    out[branch.id] = {};
    for (const skill of branch.skills) {
      const isFirstSequential = !branch.nonSequential && skill.order === 1;
      out[branch.id][skill.id] = {
        unlocked: branch.nonSequential ? true : isFirstSequential,
        mastered: false,
        completions: 0,
        lastCompletedAt: null,
      };
    }
  }
  return out;
}

function buildWinter(): UserState {
  const skills = buildSkills("winter");
  // Pre-mastered skills per spec
  const preMastered: [string, string][] = [
    ["kitchen_arts", "chest_sorter"],
    ["waste_management", "minecart_runner"],
    ["laundry_mastery", "armor_sorter"],
    ["laundry_mastery", "armor_display"],
    ["laundry_mastery", "inventory_stacker"],
  ];
  for (const [b, s] of preMastered) {
    if (skills[b]?.[s]) {
      skills[b][s] = { unlocked: true, mastered: true, completions: 10, lastCompletedAt: null };
    }
  }
  // Unlock the next sequential skill after each mastered one
  for (const branch of branchesForUser("winter")) {
    if (branch.nonSequential) continue;
    const sorted = [...branch.skills].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      const cur = skills[branch.id][sorted[i].id];
      if (cur.mastered && sorted[i + 1]) {
        skills[branch.id][sorted[i + 1].id].unlocked = true;
      }
    }
  }
  return {
    id: "winter",
    displayName: "Winter",
    role: "player",
    skin: "winter-default",
    lifetimeXP: 0,
    currentWeekXP: 0,
    weekStartDate: WEEK_START,
    currentMilestoneXP: 0,
    milestonesEarned: 0,
    rank: "Noob",
    chestsLooted: 0,
    skills,
    rewardWishlist: [],
    taskLog: [],
    chestLog: [],
    weeklySummaries: [],
  };
}

function buildAdult(id: UserId, displayName: string, skin: string): UserState {
  return {
    id,
    displayName,
    role: "player",
    skin,
    lifetimeXP: 0,
    currentWeekXP: 0,
    weekStartDate: WEEK_START,
    currentMilestoneXP: 0,
    milestonesEarned: 0,
    rank: "Noob",
    chestsLooted: 0,
    skills: buildSkills(id),
    rewardWishlist: [],
    taskLog: [],
    chestLog: [],
    weeklySummaries: [],
  };
}

const WINTER_CHEST_POOL: ChestRewardSlip[] = [
  { id: "w1", text: "Bonus $1 on Greenlight card", category: "Money" },
  { id: "w2", text: "Bonus $2 on Greenlight card", category: "Money" },
  { id: "w3", text: "Bonus $3 on Greenlight card", category: "Money" },
  { id: "w4", text: "30 extra minutes of screen time", category: "Time" },
  { id: "w5", text: "Stay up 30 min past bedtime", category: "Time" },
  { id: "w6", text: "Pick what's for dinner tonight", category: "Choice" },
  { id: "w7", text: "Pick the family movie/show", category: "Choice" },
  { id: "w8", text: "Skip one chore (bankable)", category: "Power-up" },
  { id: "w9", text: "Small treat from the store (under $5)", category: "Treat" },
  { id: "w10", text: "Bonus dessert", category: "Treat" },
  { id: "w11", text: "Pick a new app theme/skin", category: "Meta" },
  { id: "w12", text: "Wildcard — pick any reward", category: "Wildcard" },
];

const ADULT_CHEST_POOL: ChestRewardSlip[] = [
  { id: "a1", text: "Bonus 25 XP toward next milestone", category: "Progress" },
  { id: "a2", text: "Sleep in — other adult handles morning", category: "Time" },
  { id: "a3", text: "Solo errand — 1 hour alone, no guilt", category: "Time" },
  { id: "a4", text: "Treat yourself — small personal purchase (under $15)", category: "Treat" },
  { id: "a5", text: "Pick the takeout restaurant", category: "Choice" },
  { id: "a6", text: "Pick the show/movie for date or family night", category: "Choice" },
  { id: "a7", text: "1 hour uninterrupted hobby time", category: "Time" },
  { id: "a8", text: "Other adult does your weekday tasks for a day", category: "Power-up" },
  { id: "a9", text: "Fancy coffee/drink of choice", category: "Treat" },
  { id: "a10", text: "Uninterrupted bath/shower — no knocking", category: "Self-care" },
  { id: "a11", text: "Wildcard — pick any reward", category: "Wildcard" },
];

export function buildDefaultState(): AppState {
  return {
    config: {
      weeklyXPCap: 100,
      xpToDollarRate: 0.10,
      adultMilestoneThreshold: 500,
      chestDropChance: 0.15,
      masteryThreshold: 10,
      currentTheme: "minecraft",
      payDay: "Sunday",
      rotationIntervalWeeks: 3,
      weekendResetLevel: 1,
      customQuests: [],
    },
    adultRewardCycle: {
      currentPosition: "house",
      cycle: ["house", "personal"],
      houseWishlist: [],
      rewardLog: [],
    },
    users: {
      winter: buildWinter(),
      rebekah: buildAdult("rebekah", "Rebekah", "alex"),
      maarten: buildAdult("maarten", "Maarten", "steve"),
    },
    toyRotation: {
      bins: [
        { id: "forest", name: "Forest Biome", status: "active", contents: "", lastSwap: null },
        { id: "desert", name: "Desert Biome", status: "inactive", contents: "", lastSwap: null },
        { id: "ocean", name: "Ocean Biome", status: "inactive", contents: "", lastSwap: null },
        { id: "nether", name: "Nether Biome", status: "inactive", contents: "", lastSwap: null },
      ],
      rotationLog: [],
      lastRotationDate: null,
      nudgeAfterWeeks: 4,
    },
    weekendReset: {
      lastResetDate: null,
      log: [],
    },
    chestRewardPools: {
      winter: WINTER_CHEST_POOL,
      rebekah: ADULT_CHEST_POOL,
      maarten: ADULT_CHEST_POOL,
    },
  };
}

// Make these available at module-level for use elsewhere if needed
export const SKILL_BRANCH_INDEX = SKILL_BRANCHES;
