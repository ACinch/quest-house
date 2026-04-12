export type UserId = "winter" | "mom" | "maarten";

export type SkillType = "standard" | "one-off" | "recurring" | "seasonal";

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

export interface TaskLogEntry {
  id: string;
  userId: UserId;
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

export interface UserState {
  id: UserId;
  displayName: string;
  role: "player";
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
  skills: Record<string, Record<string, SkillState>>;
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

export interface ChestRewardSlip {
  id: string;
  text: string;
  category: string;
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
}

export interface AppState {
  config: AppConfig;
  adultRewardCycle: AdultRewardCycle;
  users: Record<UserId, UserState>;
  toyRotation: ToyRotation;
  weekendReset: { lastResetDate: string | null; log: WeekendResetLogEntry[] };
  chestRewardPools: Record<UserId, ChestRewardSlip[]>;
}
