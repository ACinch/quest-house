export type UserId = "winter" | "rebekah" | "maarten";
export type Role = "child" | "parent";

export type SkillType = "standard" | "one-off" | "recurring" | "seasonal";

// =====================================================================
// Adult skill model — branch-based, sequential or non-sequential
// =====================================================================

export interface Skill {
  id: string;
  branchId: string;
  name: string;
  flavor: string;
  description: string;
  xp: number;
  /** Sequential position within the branch. Non-sequential branches use 0. */
  order: number;
  /** True for branches that don't enforce sequential unlocks (Home Admin, Exterior). */
  nonSequential?: boolean;
  type?: SkillType;
  intervalDays?: number;
  custom?: boolean;
}

export interface SkillBranch {
  id: string;
  name: string;
  icon: string;
  description: string;
  skills: Skill[];
  nonSequential?: boolean;
  /** Users who have access to this branch. */
  users: UserId[];
}

export interface SkillState {
  unlocked: boolean;
  mastered: boolean;
  completions: number;
  /** ISO timestamp of last completion - used for seasonal cooldowns. */
  lastCompletedAt?: string | null;
}

// =====================================================================
// Winter skill model — web-based with prerequisites and hidden nodes
// =====================================================================

export type WinterSkillDomain =
  | "kitchen"
  | "bathroom_sink_zone"
  | "bathroom_half"
  | "bathroom_behind_door"
  | "laundry"
  | "floors"
  | "surfaces"
  | "waste"
  | "home_maintenance"
  | "outdoor"
  | "life_skills"
  | "towels"
  | "boss"
  | "hidden";

export interface WinterSkillDef {
  id: string;
  name: string;
  hiddenName: string;
  description: string;
  domain: WinterSkillDomain;
  baseXP: number;
  /** Skills that must be touched (or mastered, depending on flag) before this unlocks. */
  prerequisites: string[];
  /** When true, every prereq must be MASTERED, not merely touched. */
  prerequisitesMastered?: boolean;
  /** Generic "you must have mastered N total skills" gate (for life-skills goalposts). */
  prerequisiteTotalMastered?: number;
  /** Hidden converge gate: must have mastered ≥1 skill in each listed domain. */
  prerequisiteDomainsRequired?: WinterSkillDomain[];
  /** Boss skills always drop a chest on completion. */
  guaranteedChest?: boolean;
  /** True for hidden converge nodes — only appear once a prereq is touched. */
  isHidden?: boolean;
  /** Supervised tasks need a parent present in real life. */
  supervised?: boolean;
  minecraftFlavor: string;
  minecraftIcon: string;
}

export interface WinterSkillState {
  unlocked: boolean;
  mastered: boolean;
  /** True once Winter has seen this node in his UI (regular nodes always
   *  start revealed; hidden nodes flip to true when ≥1 prereq is touched). */
  revealed: boolean;
  completions: number;
  lastCompletedAt?: string | null;
}

export interface WinterSkillTreeState {
  /** Per-skill runtime state. The static defs live in `winter-skills.ts`. */
  skills: Record<string, WinterSkillState>;
}

// =====================================================================
// Winter chest tier system
// =====================================================================

export type ChestTier = "stone" | "iron" | "gold" | "diamond" | "netherite";

export interface ChestRewardSlip {
  id: string;
  text: string;
  category: string;
  /** Set on Winter slips so we can keep tier provenance after redemption. */
  tier?: ChestTier;
}

/** Winter's chest pool is split by tier. Adults still use a flat list. */
export type TieredChestPool = Record<ChestTier, ChestRewardSlip[]>;

export interface InventoryItem {
  id: string;
  /** Human-readable reward text drawn from the pool. */
  reward: string;
  category: string;
  tier: ChestTier;
  /** ISO timestamp the chest dropped. */
  drawnAt: string;
  /** Why the chest dropped — boss, random, mastery, manual, etc. */
  trigger: ChestLogEntry["trigger"];
  /** True once Winter (or a parent on his behalf) has used the reward. */
  redeemed: boolean;
  redeemedAt?: string;
  /** When set, this is a special wildcard slip ("Extra Pull from Tier of Choice"). */
  wildcardKind?: "tier_choice";
}

// =====================================================================
// Logs and summaries
// =====================================================================

export interface TaskLogEntry {
  id: string;
  userId: UserId;
  /** Empty string for Winter's web-based tasks (no branch). */
  skillBranch: string;
  skillId: string;
  taskName: string;
  xpEarned: number;
  completedAt: string;
  confirmedBy: UserId | "self";
  chestTriggered: boolean;
  notes?: string;
}

export interface ChestLogEntry {
  id: string;
  userId: UserId;
  trigger:
    | "random_drop"
    | "boss_level"
    | "weekly_cap"
    | "mastery"
    | "rank_up"
    | "manual";
  triggerTask?: string;
  reward?: string;
  /** Set for Winter's tier-based pulls. */
  tier?: ChestTier;
  date: string;
}

export interface WeeklySummary {
  weekStartDate: string;
  weekEndDate: string;
  xpEarned: number;
  dollarsEarned: number;
  tasksCompleted: number;
  chestsLooted: number;
  skillsProgressed: string[];
  newMasteries: string[];
  rankChange: string | null;
}

// =====================================================================
// User state
// =====================================================================

export interface UserState {
  id: UserId;
  displayName: string;
  role: Role;
  skin: string;
  lifetimeXP: number;
  /** Winter only - resets weekly. */
  currentWeekXP: number;
  weekStartDate: string;
  /** Adults only - rolling toward milestone. */
  currentMilestoneXP: number;
  milestonesEarned: number;
  rank: string;
  chestsLooted: number;
  /** Adults: branch-based skill state. Winter: empty (uses skillTree instead). */
  skills: Record<string, Record<string, SkillState>>;
  /** Winter only — web-based skill tree state. */
  skillTree?: WinterSkillTreeState;
  /** Winter only — bankable chest reward inventory. */
  inventory?: InventoryItem[];
  rewardWishlist: WishlistItem[];
  taskLog: TaskLogEntry[];
  chestLog: ChestLogEntry[];
  weeklySummaries: WeeklySummary[];
}

export interface WishlistItem {
  id: string;
  name: string;
  notes?: string;
  earned?: boolean;
  earnedAt?: string;
}

export interface ToyBin {
  id: string;
  name: string;
  status: "active" | "inactive";
  contents: string;
  lastSwap: string | null;
}

export interface RotationLogEntry {
  id: string;
  date: string;
  outBin: string;
  inBin: string;
  donatedItems?: string;
}

export interface ToyRotation {
  bins: ToyBin[];
  rotationLog: RotationLogEntry[];
  lastRotationDate: string | null;
  nudgeAfterWeeks: number;
}

export interface WeekendResetLogEntry {
  id: string;
  date: string;
  level: number;
  notes?: string;
}

export interface AdultRewardCycle {
  currentPosition: "house" | "personal";
  cycle: ("house" | "personal")[];
  houseWishlist: WishlistItem[];
  rewardLog: { id: string; type: "house" | "personal"; userId: UserId; item: string; date: string }[];
}

export interface AppConfig {
  weeklyXPCap: number;
  xpToDollarRate: number;
  adultMilestoneThreshold: number;
  chestDropChance: number;
  masteryThreshold: number;
  currentTheme: string;
  payDay: string;
  rotationIntervalWeeks: number;
  weekendResetLevel: 1 | 2 | 3;
  customQuests: Skill[];
  /** Winter chest tier weights. Must sum to 100. */
  tierDropRates: Record<ChestTier, number>;
}

/**
 * Per-user chest pools. Currently flat lists for everyone — same shape as
 * before the tier system was introduced. The new tier-weighted pool for
 * Winter lives separately on `AppState.winterChestPool` (still in dev) and
 * will eventually replace the `winter` entry here.
 */
export type ChestRewardPools = Record<UserId, ChestRewardSlip[]>;

export interface AppState {
  config: AppConfig;
  adultRewardCycle: AdultRewardCycle;
  users: Record<UserId, UserState>;
  toyRotation: ToyRotation;
  weekendReset: { lastResetDate: string | null; log: WeekendResetLogEntry[] };
  chestRewardPools: ChestRewardPools;
  /**
   * Winter's tier-weighted chest pool. Optional during the migration —
   * once the new chest drop logic ships, this becomes the source of truth
   * for Winter and `chestRewardPools.winter` is removed.
   */
  winterChestPool?: TieredChestPool;
}
