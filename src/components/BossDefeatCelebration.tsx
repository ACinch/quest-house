"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { BOSSES_BY_ID } from "@/lib/data/bosses";
import { CHEST_TIER_META } from "@/lib/data/winter-chest-pool";
import type { ChestTier } from "@/lib/types";

/**
 * Full-screen celebration overlay that fires when bosses.pendingDefeat
 * is set. Mounted globally in AppShell so it can fire from any route.
 *
 * Sequence (mid-fidelity per spec Q8 = b):
 *   1. Mob emoji flashes red 3× then collapses (CSS keyframe
 *      `bossDefeat`, ~1.8s total)
 *   2. "BOSS DEFEATED" banner drops in (keyframe
 *      `bossDefeatBannerDrop`, delayed 1.5s)
 *   3. Per-participant rows slide in with staggered delays
 *      (keyframe `bossDefeatRow`)
 *   4. Sparkle particles burst around the celebration (CSS only)
 *   5. "Claim Rewards" button calls acknowledgeBossDefeat to dismiss
 */
export default function BossDefeatCelebration() {
  const pending = useStore((s) => s.state.bosses?.pendingDefeat ?? null);
  const acknowledge = useStore((s) => s.acknowledgeBossDefeat);

  if (!pending) return null;

  const def = BOSSES_BY_ID[pending.bossId];
  if (!def) return null;

  // Sparkle positions — spread around the mob emoji.
  const sparkles = [
    { sx: 60, sy: -40 },
    { sx: -50, sy: -50 },
    { sx: 70, sy: 20 },
    { sx: -60, sy: 30 },
    { sx: 0, sy: -70 },
    { sx: 80, sy: -10 },
    { sx: -75, sy: -10 },
    { sx: 30, sy: 60 },
    { sx: -30, sy: 60 },
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal space-y-4" style={{ maxWidth: "32rem" }}>
        {/* Hero — mob + sparkles */}
        <div className="text-center relative" style={{ minHeight: 160 }}>
          <div
            className="text-7xl boss-defeat-mob inline-block relative"
            aria-hidden="true"
          >
            {def.icon}
          </div>
          {sparkles.map((s, i) => (
            <div
              key={i}
              className="boss-sparkle"
              style={
                {
                  top: "50%",
                  left: "50%",
                  animationDelay: `${1.6 + i * 0.05}s`,
                  ["--sx" as string]: `${s.sx}px`,
                  ["--sy" as string]: `${s.sy}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Banner */}
        <div className="boss-defeat-banner text-center">
          <div className="font-pixel text-[14px] text-yellow-300 drop-shadow">
            BOSS DEFEATED
          </div>
          <div className="font-pixel text-[10px] text-white mt-1">
            {def.name.toUpperCase()}
          </div>
          <div className="text-xs muted mt-1">
            Total damage: {pending.totalDamageDealt}
          </div>
        </div>

        {/* Per-participant rewards */}
        <div className="space-y-2">
          {pending.participants
            .sort((a, b) => b.damagePercent - a.damagePercent)
            .map((p, i) => (
              <ParticipantRow
                key={p.userId}
                userId={p.userId}
                damageDealt={p.damageDealt}
                damagePercent={p.damagePercent}
                tier={p.chestTier}
                bonusXP={p.bonusXP}
                chestReward={p.chestReward}
                delayMs={1900 + i * 250}
              />
            ))}
          {pending.participants.length === 0 && (
            <div className="text-sm muted text-center">
              No participants? You defeated this boss with zero damage
              dealt. Impressive AND impossible.
            </div>
          )}
        </div>

        {/* Dismiss */}
        <div className="flex gap-2">
          <Link
            href="/inventory"
            className="block-btn alt flex-1 text-center"
            onClick={() => acknowledge()}
          >
            🎒 Inventory
          </Link>
          <button
            type="button"
            className="block-btn gold flex-1"
            onClick={() => acknowledge()}
          >
            Claim!
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================================
// Participant row
// ==================================================================

function ParticipantRow({
  userId,
  damageDealt,
  damagePercent,
  tier,
  bonusXP,
  chestReward,
  delayMs,
}: {
  userId: string;
  damageDealt: number;
  damagePercent: number;
  tier: ChestTier | null;
  bonusXP: number;
  chestReward?: string;
  delayMs: number;
}) {
  const users = useStore((s) => s.state.users);
  const user = users[userId as keyof typeof users];
  const meta = tier ? CHEST_TIER_META[tier] : null;

  return (
    <div
      className="boss-defeat-row panel panel-tight"
      style={{
        animationDelay: `${delayMs}ms`,
        borderColor: meta?.color ?? "#4a4a6a",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-pixel text-[9px] text-yellow-300">
            {(user?.displayName ?? userId).toUpperCase()}
          </div>
          <div className="text-xs muted">
            {damageDealt} dmg · {damagePercent}%
          </div>
        </div>
        {meta && (
          <div className="text-right">
            <div
              className="font-pixel text-[9px]"
              style={{ color: meta.color }}
            >
              {meta.icon} {meta.displayName.toUpperCase()}
            </div>
            <div className="text-xs text-yellow-300">+{bonusXP} XP</div>
          </div>
        )}
      </div>
      {chestReward && (
        <div className="mt-2 text-sm text-center text-yellow-100">
          🎁 {chestReward}
        </div>
      )}
    </div>
  );
}
