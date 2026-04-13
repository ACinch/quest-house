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

const PADDING = 30;
const COLUMN_WIDTH = 160;
const ROW_HEIGHT = 90;
const INTRA_CELL_STEP = 22;
const NODE_RADIUS = 14;

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

  // Build positioned layout, skipping unrevealed hidden nodes.
  const { laidOut, width, height, byId } = useMemo(() => {
    // Bucket by (domain, depth)
    const buckets: Record<string, WinterSkillDef[]> = {};
    const visible: WinterSkillDef[] = [];

    for (const def of WINTER_SKILLS) {
      const st = skillTree[def.id];
      if (!st || !st.revealed) continue;
      visible.push(def);
      const depth = WINTER_SKILL_DEPTHS[def.id] ?? 0;
      const domainIdx = WINTER_DOMAIN_ORDER.indexOf(def.domain);
      const key = `${domainIdx}:${depth}`;
      (buckets[key] ??= []).push(def);
    }

    const laidOut: LaidOutSkill[] = [];
    for (const def of visible) {
      const depth = WINTER_SKILL_DEPTHS[def.id] ?? 0;
      const domainIdx = WINTER_DOMAIN_ORDER.indexOf(def.domain);
      const key = `${domainIdx}:${depth}`;
      const bucket = buckets[key] ?? [];
      const indexInBucket = bucket.indexOf(def);
      const bucketSize = bucket.length;
      // Center the bucket around the row, offsetting within the cell.
      const offset =
        (indexInBucket - (bucketSize - 1) / 2) * INTRA_CELL_STEP;
      laidOut.push({
        def,
        pos: {
          x: PADDING + depth * COLUMN_WIDTH,
          y: PADDING + domainIdx * ROW_HEIGHT + offset,
        },
      });
    }

    const maxDepth = Math.max(
      0,
      ...laidOut.map((l) => WINTER_SKILL_DEPTHS[l.def.id] ?? 0)
    );
    const width = PADDING * 2 + (maxDepth + 1) * COLUMN_WIDTH;
    const height = PADDING * 2 + WINTER_DOMAIN_ORDER.length * ROW_HEIGHT;

    const byId: Record<string, LaidOutSkill> = {};
    for (const l of laidOut) byId[l.def.id] = l;

    return { laidOut, width, height, byId };
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
          {WINTER_DOMAIN_ORDER.map((domain, idx) => {
            const meta = WINTER_DOMAIN_META[domain];
            const y = PADDING + idx * ROW_HEIGHT;
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
                />
                <text
                  x={6}
                  y={y - 4}
                  fontSize={8}
                  fill={meta.color}
                  fontFamily="Press Start 2P, monospace"
                >
                  {meta.icon} {meta.displayName.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Connection lines (draw before nodes so they render behind) */}
          {laidOut.map(({ def, pos }) => {
            const lines: React.ReactNode[] = [];
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
              lines.push(
                <line
                  key={`${prereqId}-${def.id}`}
                  x1={from.pos.x}
                  y1={from.pos.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={stroke}
                  strokeWidth={bothUnlocked ? 2 : 1}
                  strokeDasharray={active || bothUnlocked ? undefined : "3 3"}
                  opacity={0.75}
                />
              );
            }
            return <g key={`lines-${def.id}`}>{lines}</g>;
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
                  y={3}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#fff"
                  pointerEvents="none"
                >
                  {state.mastered
                    ? "★"
                    : state.unlocked
                    ? domainMeta.icon
                    : "?"}
                </text>
                {/* Small label under the node (truncated) */}
                <text
                  y={NODE_RADIUS + 10}
                  textAnchor="middle"
                  fontSize={7}
                  fill={state.unlocked ? "#f5f5f5" : "#6a6a80"}
                  fontFamily="VT323, monospace"
                  pointerEvents="none"
                >
                  {state.unlocked
                    ? def.name.length > 16
                      ? def.name.slice(0, 15) + "…"
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
