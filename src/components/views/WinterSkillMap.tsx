"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useIsParent } from "@/lib/auth-client";
import {
  WINTER_SKILLS,
  WINTER_SKILL_DEPTHS,
  WINTER_DOMAIN_ORDER,
  WINTER_DOMAIN_META,
} from "@/lib/data/winter-skills";
import type { WinterSkillDef, WinterSkillState } from "@/lib/types";

/**
 * Map view for Winter's skill tree — an SVG layered graph with
 * connection lines between prerequisites.
 *
 * Layout strategy:
 *   - X axis = skill depth (length of longest prereq chain). Columns
 *     are COLUMN_WIDTH apart. Foundation skills live at column 0.
 *   - Y axis = domain index (domains in WINTER_DOMAIN_ORDER), plus
 *     an intra-cell offset when multiple skills share (depth, domain).
 *
 * The SVG is rendered in an overflow-auto container so it scrolls on
 * mobile. A ± zoom control changes a CSS transform scale on the SVG
 * for pinch-free zooming.
 *
 * Tapping a node selects it and surfaces a bottom inspector card with
 * full details. Parents can complete skills directly from the inspector.
 */

const PADDING = 40;
const COLUMN_WIDTH = 190;
const MIN_ROW_HEIGHT = 80;
const INTRA_CELL_STEP = 30;
const NODE_RADIUS = 16;

interface NodePosition {
  x: number;
  y: number;
}

interface LaidOutSkill {
  def: WinterSkillDef;
  pos: NodePosition;
}

export default function WinterSkillMap() {
  const skillTree = useStore(
    (s) => s.state.users.winter.skillTree?.skills ?? {}
  );
  const masteryThreshold = useStore((s) => s.state.config.masteryThreshold);
  const completeWinterSkill = useStore((s) => s.completeWinterSkill);
  const signedInUser = useStore((s) => s.activeUser);
  const isParent = useIsParent();

  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Build positioned layout, skipping empty domains and sizing rows dynamically.
  const { laidOut, width, height, byId, activeDomains, domainY } = useMemo(() => {
    // Collect visible skills and bucket by (domain, depth).
    const buckets: Record<string, WinterSkillDef[]> = {};
    const visible: WinterSkillDef[] = [];
    const domainSkills: Record<string, WinterSkillDef[]> = {};

    for (const def of WINTER_SKILLS) {
      const st = skillTree[def.id];
      if (!st || !st.revealed) continue;
      visible.push(def);
      (domainSkills[def.domain] ??= []).push(def);
      const depth = WINTER_SKILL_DEPTHS[def.id] ?? 0;
      const key = `${def.domain}:${depth}`;
      (buckets[key] ??= []).push(def);
    }

    // Only include domains that have visible skills.
    const activeDomains = WINTER_DOMAIN_ORDER.filter(
      (d) => (domainSkills[d]?.length ?? 0) > 0
    );

    // Compute row height per domain based on the largest bucket.
    const domainRowHeight: Record<string, number> = {};
    for (const domain of activeDomains) {
      let maxBucket = 1;
      for (const def of domainSkills[domain] ?? []) {
        const depth = WINTER_SKILL_DEPTHS[def.id] ?? 0;
        const key = `${domain}:${depth}`;
        maxBucket = Math.max(maxBucket, (buckets[key]?.length ?? 1));
      }
      domainRowHeight[domain] = Math.max(
        MIN_ROW_HEIGHT,
        (maxBucket - 1) * INTRA_CELL_STEP + MIN_ROW_HEIGHT
      );
    }

    // Accumulate Y positions per domain.
    const domainY: Record<string, number> = {};
    let yOffset = PADDING;
    for (const domain of activeDomains) {
      domainY[domain] = yOffset + domainRowHeight[domain] / 2;
      yOffset += domainRowHeight[domain];
    }

    // Position each skill node.
    const laidOut: LaidOutSkill[] = [];
    for (const def of visible) {
      const depth = WINTER_SKILL_DEPTHS[def.id] ?? 0;
      const key = `${def.domain}:${depth}`;
      const bucket = buckets[key] ?? [];
      const indexInBucket = bucket.indexOf(def);
      const bucketSize = bucket.length;
      const centerY = domainY[def.domain] ?? PADDING;
      const offset =
        (indexInBucket - (bucketSize - 1) / 2) * INTRA_CELL_STEP;
      laidOut.push({
        def,
        pos: {
          x: PADDING + depth * COLUMN_WIDTH,
          y: centerY + offset,
        },
      });
    }

    const maxDepth = Math.max(
      0,
      ...laidOut.map((l) => WINTER_SKILL_DEPTHS[l.def.id] ?? 0)
    );
    const width = PADDING * 2 + (maxDepth + 1) * COLUMN_WIDTH;
    const height = yOffset + PADDING;

    const byId: Record<string, LaidOutSkill> = {};
    for (const l of laidOut) byId[l.def.id] = l;

    return { laidOut, width, height, byId, activeDomains, domainY };
  }, [skillTree]);

  const selected = selectedId ? byId[selectedId] : null;

  const handleComplete = (skillId: string) => {
    completeWinterSkill({ skillId, confirmedBy: signedInUser });
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-xs muted">
          Tap a node for details. Lines show prerequisites.
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="block-btn ghost"
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          >
            −
          </button>
          <button
            type="button"
            className="block-btn ghost"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="block-btn ghost"
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
          >
            +
          </button>
        </div>
      </div>

      <div
        className="panel"
        style={{
          overflow: "auto",
          padding: 0,
          maxHeight: "70vh",
          background: "#0d0d18",
        }}
      >
        <svg
          width={width * zoom}
          height={height * zoom}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: "block", minWidth: "100%" }}
        >
          {/* Domain row labels (subtle, left-aligned) */}
          {activeDomains.map((domain) => {
            const meta = WINTER_DOMAIN_META[domain];
            const y = domainY[domain];
            return (
              <g key={domain}>
                <line
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#2a2a3e"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  opacity={0.5}
                />
                <text
                  x={6}
                  y={y - 6}
                  fontSize={8}
                  fill={meta.color}
                  fontFamily="Press Start 2P, monospace"
                  opacity={0.6}
                >
                  {meta.icon} {meta.displayName.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Connection curves (drawn before nodes so they render behind) */}
          {laidOut.map(({ def, pos }) => {
            const paths: React.ReactNode[] = [];
            for (const prereqId of def.prerequisites) {
              const from = byId[prereqId];
              if (!from) continue;
              const fromSt = skillTree[prereqId];
              const thisSt = skillTree[def.id];
              const active = (fromSt?.completions ?? 0) > 0;
              const bothUnlocked = thisSt?.unlocked;
              const stroke = bothUnlocked
                ? "#FFD700"
                : active
                ? "#4AEDD9"
                : "#4a4a6a";
              const dx = (pos.x - from.pos.x) * 0.45;
              const d = `M${from.pos.x},${from.pos.y} C${from.pos.x + dx},${from.pos.y} ${pos.x - dx},${pos.y} ${pos.x},${pos.y}`;
              paths.push(
                <path
                  key={`${prereqId}-${def.id}`}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={bothUnlocked ? 2.5 : 1.5}
                  strokeDasharray={active || bothUnlocked ? undefined : "4 4"}
                  opacity={0.6}
                />
              );
            }
            return <g key={`lines-${def.id}`}>{paths}</g>;
          })}

          {/* Skill nodes */}
          {laidOut.map(({ def, pos }) => {
            const state = skillTree[def.id];
            if (!state) return null;
            const domainMeta = WINTER_DOMAIN_META[def.domain];
            const isSelected = selectedId === def.id;

            const fill = state.mastered
              ? "#3a5a25"
              : state.unlocked
              ? "#2d3552"
              : "#1a1a2e";
            const stroke = state.mastered
              ? "#FFD700"
              : state.unlocked
              ? domainMeta.color
              : "#4a4a6a";
            const strokeWidth = isSelected ? 4 : state.mastered ? 3 : 2;

            // Progress arc (simple pie-slice fill indicator).
            const fillPct =
              state.unlocked && !state.mastered
                ? Math.min(state.completions, masteryThreshold) /
                  masteryThreshold
                : state.mastered
                ? 1
                : 0;

            return (
              <g
                key={def.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedId(def.id)}
              >
                <circle
                  r={NODE_RADIUS}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                {fillPct > 0 && fillPct < 1 && (
                  <circle
                    r={NODE_RADIUS - 4}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth={2}
                    strokeDasharray={`${fillPct * (NODE_RADIUS - 4) * 2 * Math.PI} ${(NODE_RADIUS - 4) * 2 * Math.PI}`}
                    transform="rotate(-90)"
                  />
                )}
                <text
                  y={4}
                  textAnchor="middle"
                  fontSize={14}
                  fill="#fff"
                  pointerEvents="none"
                >
                  {state.mastered
                    ? "★"
                    : state.unlocked
                    ? domainMeta.icon
                    : "?"}
                </text>
                {/* Label under the node */}
                <text
                  y={NODE_RADIUS + 12}
                  textAnchor="middle"
                  fontSize={8}
                  fill={state.unlocked ? "#e5e5ef" : "#6a6a80"}
                  fontFamily="VT323, monospace"
                  pointerEvents="none"
                >
                  {state.unlocked
                    ? def.name.length > 20
                      ? def.name.slice(0, 19) + "…"
                      : def.name
                    : "???"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Inspector */}
      {selected && (
        <Inspector
          def={selected.def}
          state={skillTree[selected.def.id]}
          masteryThreshold={masteryThreshold}
          canComplete={isParent}
          onComplete={() => handleComplete(selected.def.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

interface InspectorProps {
  def: WinterSkillDef;
  state: WinterSkillState;
  masteryThreshold: number;
  canComplete: boolean;
  onComplete: () => void;
  onClose: () => void;
}

function Inspector({
  def,
  state,
  masteryThreshold,
  canComplete,
  onComplete,
  onClose,
}: InspectorProps) {
  const unlocked = state?.unlocked ?? false;
  const mastered = state?.mastered ?? false;
  const completions = state?.completions ?? 0;
  const displayName = unlocked ? def.name : def.hiddenName;

  return (
    <div className="panel space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-pixel text-[10px] text-yellow-300">
          {mastered ? "★ " : ""}
          {displayName.toUpperCase()}
        </div>
        <button type="button" className="block-btn ghost" onClick={onClose}>
          ✕
        </button>
      </div>
      {unlocked ? (
        <>
          <div className="text-sm">{def.description}</div>
          <div className="text-xs italic muted">
            &ldquo;{def.minecraftFlavor}&rdquo;
          </div>
          <div className="text-xs muted">
            Progress: {Math.min(completions, masteryThreshold)}/
            {masteryThreshold}
            {mastered && " ★"}
          </div>
          {def.supervised && (
            <div className="text-xs muted">
              ⚠ Supervised — needs a parent present.
            </div>
          )}
          <div className="flex justify-end">
            <span className="font-pixel text-[9px] text-yellow-300 mr-2 self-center">
              +{def.baseXP} XP
            </span>
            {canComplete && (
              <button
                type="button"
                className="block-btn"
                onClick={onComplete}
              >
                Done
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="text-sm muted italic">
            Locked — complete prerequisites to unlock.
          </div>
          <div className="text-xs muted">
            {def.prerequisites.length > 0 &&
              `Requires: ${def.prerequisites.length} skill${def.prerequisites.length === 1 ? "" : "s"}`}
            {def.prerequisiteTotalMastered &&
              ` · ${def.prerequisiteTotalMastered} total mastered`}
            {def.prerequisiteDomainsRequired &&
              ` · 1 mastered in ${def.prerequisiteDomainsRequired.length} domains`}
          </div>
        </>
      )}
    </div>
  );
}
