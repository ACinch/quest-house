"use client";

import BackButton from "@/components/BackButton";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useIsParent } from "@/lib/auth-client";
import {
  WINTER_SKILLS,
  WINTER_SKILLS_BY_ID,
  WINTER_DOMAIN_META,
  WINTER_DOMAIN_ORDER,
} from "@/lib/data/winter-skills";
import type { WinterSkillDef, WinterSkillState } from "@/lib/types";
import WinterSkillMap from "./WinterSkillMap";

/**
 * Winter's skill tree view. Hybrid approach per spec Q1 = option C:
 *   - List view (this component) — collapsible domain sections with
 *     prereq chips on each card. Mobile-first.
 *   - Map view (forthcoming) — SVG layered graph with lines between
 *     connected nodes for the constellation effect.
 *
 * Display rules for each skill:
 *   - not revealed        → skipped (hidden convergence nodes)
 *   - revealed + locked   → mystery card, name = hiddenName,
 *                           description muted, prereq chips shown
 *   - unlocked, ! mastered → full card with name, description,
 *                           flavor text, completion progress dots
 *   - mastered            → full card with ★ and darker background
 *
 * The "Done" button is parent-only per spec Q2 = option B. Winter
 * can view progress but cannot self-confirm.
 */

type TabId = "list" | "map";

export default function WinterSkillsView() {
  const [tab, setTab] = useState<TabId>("list");
  return (
    <div className="space-y-3">
      <div className="h2">WINTER&apos;S SKILL TREE</div>

      <div className="flex gap-2">
        <button
          type="button"
          className={`block-btn ${tab === "list" ? "" : "ghost"} flex-1`}
          onClick={() => setTab("list")}
        >
          📋 List
        </button>
        <button
          type="button"
          className={`block-btn ${tab === "map" ? "alt" : "ghost"} flex-1`}
          onClick={() => setTab("map")}
        >
          🗺️ Map
        </button>
      </div>

      {tab === "list" ? <WinterSkillList /> : <WinterSkillMap />}
    </div>
  );
}

// ==================================================================
// List view
// ==================================================================

function WinterSkillList() {
  const skillTree = useStore(
    (s) => s.state.users.winter.skillTree?.skills ?? {}
  );
  const masteryThreshold = useStore((s) => s.state.config.masteryThreshold);
  const completeWinterSkill = useStore((s) => s.completeWinterSkill);
  const signedInUser = useStore((s) => s.activeUser);
  const isParent = useIsParent();

  // Group by domain in the canonical order.
  const byDomain = useMemo(() => {
    const map: Record<string, WinterSkillDef[]> = {};
    for (const def of WINTER_SKILLS) {
      (map[def.domain] ??= []).push(def);
    }
    return map;
  }, []);

  const [openDomain, setOpenDomain] = useState<string | null>(
    WINTER_DOMAIN_ORDER[0]
  );

  const handleComplete = (skillId: string) => {
    completeWinterSkill({
      skillId,
      confirmedBy: signedInUser,
    });
  };

  return (
    <div className="space-y-3">
      {WINTER_DOMAIN_ORDER.map((domainId) => {
        const meta = WINTER_DOMAIN_META[domainId];
        const defs = byDomain[domainId] ?? [];

        // Filter out unrevealed hidden nodes so they don't leak.
        const visible = defs.filter((def) => {
          const st = skillTree[def.id];
          return st && st.revealed;
        });
        if (visible.length === 0) return null;

        const mastered = visible.filter(
          (def) => skillTree[def.id]?.mastered
        ).length;
        const unlocked = visible.filter(
          (def) => skillTree[def.id]?.unlocked
        ).length;

        const isOpen = openDomain === domainId;
        return (
          <div key={domainId} className="panel space-y-2">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 text-left"
              onClick={() => setOpenDomain(isOpen ? null : domainId)}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <div className="font-pixel text-[11px] text-yellow-300">
                    {meta.displayName.toUpperCase()}
                  </div>
                  <div className="text-xs muted">
                    {unlocked} unlocked · {mastered} mastered
                  </div>
                </div>
              </div>
              <div className="text-sm muted">
                {mastered}/{visible.length}
              </div>
            </button>

            {isOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visible.map((def) => (
                  <SkillCard
                    key={def.id}
                    def={def}
                    state={skillTree[def.id]}
                    masteryThreshold={masteryThreshold}
                    canComplete={isParent}
                    onComplete={() => handleComplete(def.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================================================================
// Skill card
// ==================================================================

interface SkillCardProps {
  def: WinterSkillDef;
  state: WinterSkillState;
  masteryThreshold: number;
  canComplete: boolean;
  onComplete: () => void;
}

function SkillCard({
  def,
  state,
  masteryThreshold,
  canComplete,
  onComplete,
}: SkillCardProps) {
  const unlocked = state?.unlocked ?? false;
  const mastered = state?.mastered ?? false;
  const completions = state?.completions ?? 0;

  const className = mastered
    ? "skill-node mastered"
    : unlocked
    ? "skill-node unlocked"
    : "skill-node locked";

  // Locked but revealed skills show the hidden name (usually "Unknown
  // Skill") and keep descriptions muted.
  const displayName = unlocked ? def.name : def.hiddenName;
  const showDescription = unlocked;

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-pixel text-[9px] text-yellow-200">
            {mastered ? "★ " : ""}
            {displayName.toUpperCase()}
          </div>
          {showDescription ? (
            <>
              <div className="text-sm">{def.description}</div>
              <div className="text-xs italic muted">
                &ldquo;{def.minecraftFlavor}&rdquo;
              </div>
            </>
          ) : (
            <div className="text-sm muted italic">
              Locked — complete prerequisites to unlock.
            </div>
          )}
          <ProgressDots
            progress={Math.min(completions, masteryThreshold)}
            max={masteryThreshold}
          />
          {!unlocked && <PrereqChips def={def} />}
          {def.supervised && (
            <div className="text-[10px] muted mt-1">
              ⚠ Supervised — needs a parent present.
            </div>
          )}
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="font-pixel text-[9px] text-yellow-300">
            +{def.baseXP}
          </span>
          {!unlocked && <div className="text-xl">🔒</div>}
          {unlocked && canComplete && (
            <button
              type="button"
              className="block-btn"
              onClick={onComplete}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressDots({
  progress,
  max,
}: {
  progress: number;
  max: number;
}) {
  return (
    <div className="flex gap-0.5 mt-1 flex-wrap">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 ${i < progress ? "bg-yellow-300" : "bg-[#0d0d18]"} border border-black`}
        />
      ))}
    </div>
  );
}

function PrereqChips({ def }: { def: WinterSkillDef }) {
  const tree = useStore(
    (s) => s.state.users.winter.skillTree?.skills ?? {}
  );

  const chips: { label: string; done: boolean }[] = [];

  for (const prereqId of def.prerequisites) {
    const prereqDef = WINTER_SKILLS_BY_ID[prereqId];
    if (!prereqDef) continue;
    const st = tree[prereqId];
    const touched = def.prerequisitesMastered
      ? st?.mastered
      : (st?.completions ?? 0) > 0;
    chips.push({
      label: prereqDef.name,
      done: Boolean(touched),
    });
  }
  if (def.prerequisiteTotalMastered) {
    const masteredCount = Object.values(tree).filter((s) => s.mastered).length;
    chips.push({
      label: `${masteredCount}/${def.prerequisiteTotalMastered} skills mastered`,
      done: masteredCount >= def.prerequisiteTotalMastered,
    });
  }
  if (def.prerequisiteDomainsRequired) {
    for (const domain of def.prerequisiteDomainsRequired) {
      const hasMastered = WINTER_SKILLS.some(
        (s) => s.domain === domain && tree[s.id]?.mastered
      );
      chips.push({
        label: WINTER_DOMAIN_META[domain].displayName,
        done: hasMastered,
      });
    }
  }

  if (chips.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {chips.map((chip, i) => (
        <span
          key={i}
          className={`pixel-border text-[9px] px-1 py-0.5 ${
            chip.done
              ? "bg-grass text-white"
              : "bg-[#0d0d18] text-[#b6b6c8]"
          }`}
        >
          {chip.done ? "✓ " : ""}
          {chip.label}
        </span>
      ))}
      <BackButton />

    </div>
  );
}

