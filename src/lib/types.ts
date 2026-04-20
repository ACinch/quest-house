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
  /** Bonus XP earned from boss defeats this week. */
  bonusXPEarned: number;
  dollarsEarned: number;
  /** Dollar value of bonus XP (Winter only). */
  bonusDollarsEarned: number;
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
  /**
   * Bonus XP earned from boss defeats this week. Tracked separately
   * so Winter's dollar calc can bypass the weekly cap for bonus
   * earnings. Resets weekly alongside currentWeekXP.
   */
  weeklyBonusXP: number;
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
  /** Weekly boss system state. Optional for back-compat with pre-boss data. */
  bosses?: BossesSlice;
}

// =====================================================================
// Weekly boss system
// =====================================================================

export type BossZone =
  | "kitchen"
  | "living_room"
  | "bathroom_half"
  | "dining_room"
  | "bonus_room"
  | "whole_house";

/** Static definition for a boss (lives in data files, not persisted). */
export interface BossDef {
  id: string;
  name: string;
  mob: string;
  icon: string;
  flavor: string;
  zone: BossZone;
  tasks: BossTaskDef[];
  /** Capstone bosses (Ender Dragon) flatten all other bosses' tasks at spawn. */
  isCapstone?: boolean;
}

export interface BossTaskDef {
  id: string;
  name: string;
  /** Difficulty-calibrated damage dealt to the boss when completed. */
  damage: number;
  /**
   * XP awarded to the credited user on completion. Independent of damage
   * per spec. Defaults to `damage` in seed data.
   */
  xp: number;
  /** Optional link to a Winter skill tree node. Fires skill progression. */
  linkedSkillId?: string;
  /** Used by capstone flattening so task IDs stay unique and traceable. */
  sourceBossId?: string;
}

/** Per-instance runtime state for one task in an active boss. */
export interface BossTaskState {
  taskId: string;
  active: boolean;
  completed: boolean;
  creditedUserId?: UserId;
  confirmedBy?: UserId;
  completedAt?: string;
  damage: number;
  xp: number;
}

export interface BossParticipant {
  userId: UserId;
  tasksCompleted: number;
  damageDealt: number;
}

export interface CustomBossTask {
  id: string;
  name: string;
  damage: number;
  xp: number;
}

export type ActiveBossStatus =
  | "spawning"
  | "active"
  | "defeated"
  | "expired";

export interface ActiveBoss {
  instanceId: string;
  bossId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalHP: number;
  currentHP: number;
  /** Keyed by taskId (including capstone-namespaced ids). */
  tasks: Record<string, BossTaskState>;
  customTasks: CustomBossTask[];
  /** Keyed by userId. Lazy-initialized on first task completion. */
  participants: Record<string, BossParticipant>;
  spawnedAt: string;
  status: ActiveBossStatus;
  defeatedAt?: string;
}

export interface BossDefeatParticipant {
  userId: UserId;
  tasksCompleted: number;
  damageDealt: number;
  damagePercent: number;
  /** null for adults (no chest on defeat). */
  chestTier: ChestTier | null;
  bonusXP: number;
  /** Slip drawn from the chest pool, Winter only. */
  chestReward?: string;
}

export interface BossDefeatLogEntry {
  id: string;
  bossId: string;
  bossName: string;
  weekStartDate: string;
  /** false = boss expired at week end without being killed. */
  defeated: boolean;
  finalHP: number;
  totalDamageDealt: number;
  participants: BossDefeatParticipant[];
  defeatedAt: string;
}

export interface BossTierThreshold {
  /** Lower bound, inclusive. */
  minPct: number;
  /** Upper bound, exclusive. Netherite uses 101 to cover 100% exactly. */
  maxPctExclusive: number;
  bonusXP: number;
}

export interface BossConfig {
  enabled: boolean;
  carryOverUndefeated: boolean;
  selectionMode: "manual" | "rotate";
  tierThresholds: Record<ChestTier, BossTierThreshold>;
  rotationOrder: string[];
}

export interface BossesSlice {
  active: ActiveBoss | null;
  log: BossDefeatLogEntry[];
  rotationIndex: number;
  config: BossConfig;
  /** Celebration payload for the defeat overlay. Cleared on dismiss. */
  pendingDefeat: BossDefeatLogEntry | null;
}
