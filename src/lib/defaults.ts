import {
  AppState,
  ChestRewardSlip,
  SkillState,
  UserId,
  UserState,
  WinterSkillState,
} from "./types";
import { SKILL_BRANCHES, branchesForUser } from "./skills";
import { WINTER_SKILLS } from "./data/winter-skills";
import { DEFAULT_WINTER_CHEST_POOL } from "./data/winter-chest-pool";

const WEEK_START = "2026-04-12"; // Sunday

/**
 * Adults still use the branch-based skill model (SkillBranch[] from
 * skills.ts). Winter has moved to the web-based model (WinterSkillDef[]
 * in data/winter-skills/). This helper builds the adult branch state;
 * Winter uses buildWinterSkillTree() below.
 */
function buildSkills(
  userId: UserId
): Record<string, Record<string, SkillState>> {
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

/**
 * Build Winter's initial web-based skill tree state.
 *
 * Rules (per spec):
 *   - ALL skills start at 0 completions, including skills Winter has
 *     already mastered in real life (spec Q from prior wave).
 *   - Skills with no prerequisites unlock immediately (foundation
 *     skills). This is the only way Winter can start playing.
 *   - Hidden convergence nodes (isHidden: true) start NOT revealed.
 *     They flip to revealed when ≥1 prereq has been touched (store
 *     handles this at completeTask time).
 *   - All other locked skills start revealed: true — Winter sees
 *     them in the UI as mystery nodes (name shown as hiddenName
 *     until unlocked).
 */
function buildWinterSkillTree(): Record<string, WinterSkillState> {
  const out: Record<string, WinterSkillState> = {};
  for (const def of WINTER_SKILLS) {
    const foundation = def.prerequisites.length === 0 && !def.isHidden
      && !def.prerequisiteTotalMastered
      && !def.prerequisiteDomainsRequired;
    out[def.id] = {
      unlocked: foundation,
      mastered: false,
      revealed: !def.isHidden,
      completions: 0,
      lastCompletedAt: null,
    };
  }
  return out;
}

function buildWinter(): UserState {
  return {
    id: "winter",
    displayName: "Winter",
    role: "child",
    skin: "winter-default",
    lifetimeXP: 0,
    currentWeekXP: 0,
    weeklyBonusXP: 0,
    weekStartDate: WEEK_START,
    currentMilestoneXP: 0,
    milestonesEarned: 0,
    rank: "Noob",
    chestsLooted: 0,
    // Winter doesn't use the adult branch-based model — this stays empty.
    skills: {},
    skillTree: { skills: buildWinterSkillTree() },
    inventory: [],
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
    role: "parent",
    skin,
    lifetimeXP: 0,
    currentWeekXP: 0,
    weeklyBonusXP: 0,
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

/**
 * Legacy flat pool for Winter — kept only so existing consumers of
 * chestRewardPools.winter compile. The new tier-aware chest drop logic
 * reads from AppState.winterChestPool instead. Once the Phase 4 store
 * update ships, this can be removed and chestRewardPools typed to
 * adults only.
 */
const LEGACY_WINTER_CHEST_POOL: ChestRewardSlip[] = [];

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
      tierDropRates: {
        stone: 35,
        iron: 30,
        gold: 20,
        diamond: 12,
        netherite: 3,
      },
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
      winter: LEGACY_WINTER_CHEST_POOL,
      rebekah: ADULT_CHEST_POOL,
      maarten: ADULT_CHEST_POOL,
    },
    winterChestPool: DEFAULT_WINTER_CHEST_POOL,
  };
}

// Make these available at module-level for use elsewhere if needed
export const SKILL_BRANCH_INDEX = SKILL_BRANCHES;
