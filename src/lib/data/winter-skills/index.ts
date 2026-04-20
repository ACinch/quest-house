import type { WinterSkillDef, WinterSkillDomain } from "@/lib/types";

import { KITCHEN_SKILLS } from "./kitchen";
import {
  BATHROOM_SINK_SKILLS,
  BATHROOM_HALF_SKILLS,
  BATHROOM_BTD_SKILLS,
} from "./bathroom";
import { LAUNDRY_SKILLS } from "./laundry";
import { FLOOR_SKILLS } from "./floors";
import { SURFACE_SKILLS } from "./surfaces";
import { WASTE_SKILLS } from "./waste";
import { HOME_MAINTENANCE_SKILLS } from "./home-maintenance";
import { OUTDOOR_SKILLS } from "./outdoor";
import { LIFE_SKILLS } from "./life-skills";
import { TOWEL_SKILLS } from "./towels";
import { BOSS_SKILLS } from "./boss";
import { HIDDEN_SKILLS } from "./hidden";

// ==================================================================
// Flat list of all Winter skills
// ==================================================================

export const WINTER_SKILLS: WinterSkillDef[] = [
  ...KITCHEN_SKILLS,
  ...BATHROOM_SINK_SKILLS,
  ...BATHROOM_HALF_SKILLS,
  ...BATHROOM_BTD_SKILLS,
  ...LAUNDRY_SKILLS,
  ...FLOOR_SKILLS,
  ...SURFACE_SKILLS,
  ...WASTE_SKILLS,
  ...HOME_MAINTENANCE_SKILLS,
  ...OUTDOOR_SKILLS,
  ...LIFE_SKILLS,
  ...TOWEL_SKILLS,
  ...BOSS_SKILLS,
  ...HIDDEN_SKILLS,
];

// ==================================================================
// Indexed lookup
// ==================================================================

export const WINTER_SKILLS_BY_ID: Record<string, WinterSkillDef> =
  WINTER_SKILLS.reduce<Record<string, WinterSkillDef>>((acc, skill) => {
    acc[skill.id] = skill;
    return acc;
  }, {});

export function getWinterSkill(id: string): WinterSkillDef | null {
  return WINTER_SKILLS_BY_ID[id] ?? null;
}

// ==================================================================
// Domain metadata
// ==================================================================

export interface WinterDomainMeta {
  id: WinterSkillDomain;
  displayName: string;
  icon: string;
  color: string;
  /** Whether this domain counts toward the "one skill per domain"
   *  hidden_household_apprentice gate. */
  countsForBreadthGate: boolean;
}

export const WINTER_DOMAIN_META: Record<WinterSkillDomain, WinterDomainMeta> = {
  kitchen: {
    id: "kitchen",
    displayName: "Kitchen Arts",
    icon: "🍳",
    color: "#8B6914",
    countsForBreadthGate: true,
  },
  bathroom_sink_zone: {
    id: "bathroom_sink_zone",
    displayName: "Sink Zone",
    icon: "🪞",
    color: "#4AEDD9",
    countsForBreadthGate: true,
  },
  bathroom_half: {
    id: "bathroom_half",
    displayName: "Half Bath",
    icon: "🚽",
    color: "#87CEEB",
    countsForBreadthGate: true,
  },
  bathroom_behind_door: {
    id: "bathroom_behind_door",
    displayName: "Behind the Door",
    icon: "🚪",
    color: "#7F7F7F",
    // Not counted — convergence domain, not a core domain.
    countsForBreadthGate: false,
  },
  laundry: {
    id: "laundry",
    displayName: "Laundry Mastery",
    icon: "👕",
    color: "#8932B8",
    countsForBreadthGate: true,
  },
  floors: {
    id: "floors",
    displayName: "Floor Ops",
    icon: "🧹",
    color: "#7F7F7F",
    countsForBreadthGate: true,
  },
  surfaces: {
    id: "surfaces",
    displayName: "Surface Ops",
    icon: "✨",
    color: "#FFD700",
    countsForBreadthGate: true,
  },
  waste: {
    id: "waste",
    displayName: "Waste Management",
    icon: "🗑️",
    color: "#FF5555",
    countsForBreadthGate: true,
  },
  home_maintenance: {
    id: "home_maintenance",
    displayName: "Home Maintenance",
    icon: "🔧",
    color: "#A0A0A0",
    countsForBreadthGate: true,
  },
  outdoor: {
    id: "outdoor",
    displayName: "Outdoor Ops",
    icon: "🏡",
    color: "#5D8C3E",
    countsForBreadthGate: true,
  },
  life_skills: {
    id: "life_skills",
    displayName: "Life Skills",
    icon: "💎",
    color: "#50C878",
    countsForBreadthGate: true,
  },
  towels: {
    id: "towels",
    displayName: "Towel Duty",
    icon: "🧺",
    color: "#4AEDD9",
    // Convergence — not counted toward breadth gate.
    countsForBreadthGate: false,
  },
  boss: {
    id: "boss",
    displayName: "Boss Levels",
    icon: "⚔️",
    color: "#4AEDD9",
    countsForBreadthGate: false,
  },
  hidden: {
    id: "hidden",
    displayName: "???",
    icon: "❓",
    color: "#1A1A2E",
    countsForBreadthGate: false,
  },
};

export const WINTER_DOMAIN_ORDER: WinterSkillDomain[] = [
  "kitchen",
  "bathroom_sink_zone",
  "bathroom_half",
  "bathroom_behind_door",
  "laundry",
  "floors",
  "surfaces",
  "waste",
  "home_maintenance",
  "outdoor",
  "life_skills",
  "towels",
  "boss",
  "hidden",
];

// ==================================================================
// Depth computation (for the map layout)
// ==================================================================

/**
 * Compute a "layer depth" for each skill — the length of the longest
 * prerequisite chain ending at that skill. Foundation skills are
 * depth 0, Layer 2 skills are depth 1, etc.
 *
 * Used by the SVG map view to place skills in columns/rows.
 */
export function computeSkillDepths(
  skills: WinterSkillDef[] = WINTER_SKILLS
): Record<string, number> {
  const depth: Record<string, number> = {};
  const byId = skills.reduce<Record<string, WinterSkillDef>>((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const visiting = new Set<string>();
  const compute = (id: string): number => {
    if (depth[id] !== undefined) return depth[id];
    if (visiting.has(id)) {
      // Cycle — treat as depth 0 and log. Validation will flag this.
      return 0;
    }
    visiting.add(id);
    const skill = byId[id];
    if (!skill || skill.prerequisites.length === 0) {
      depth[id] = 0;
    } else {
      const maxPrereqDepth = Math.max(
        ...skill.prerequisites.map((p) => compute(p))
      );
      depth[id] = maxPrereqDepth + 1;
    }
    visiting.delete(id);
    return depth[id];
  };

  for (const s of skills) compute(s.id);
  return depth;
}

export const WINTER_SKILL_DEPTHS = computeSkillDepths();

// ==================================================================
// Validation (runs at module load)
//
// Walks every skill and confirms all prerequisite IDs exist in the
// set. Any missing reference is a data bug — we throw at module load
// so the server won't start with a broken skill tree, and the Next.js
// dev overlay / Vercel build surface the error immediately.
// ==================================================================

function validateWinterSkillTree(skills: WinterSkillDef[]) {
  const ids = new Set(skills.map((s) => s.id));
  const errors: string[] = [];

  // Duplicate IDs
  const seen = new Set<string>();
  for (const s of skills) {
    if (seen.has(s.id)) errors.push(`Duplicate skill id: ${s.id}`);
    seen.add(s.id);
  }

  // Unknown prerequisites
  for (const s of skills) {
    for (const p of s.prerequisites) {
      if (!ids.has(p)) {
        errors.push(`${s.id}: prerequisite ${p} does not exist`);
      }
    }
  }

  // Self-reference
  for (const s of skills) {
    if (s.prerequisites.includes(s.id)) {
      errors.push(`${s.id}: prerequisite list contains self`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Winter skill tree validation failed:\n  - ${errors.join("\n  - ")}`
    );
  }
}

// Throws synchronously at module load on any data bug.
validateWinterSkillTree(WINTER_SKILLS);
