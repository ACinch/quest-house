"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useIsParent } from "@/lib/auth-client";
import { BOSSES_BY_ID } from "@/lib/data/bosses";

/**
 * Dashboard tile for the active weekly boss. Four states:
 *
 *   1. No boss + parent signed in → "Start a boss this week!" CTA
 *      linking to /boss/select.
 *   2. No boss + child signed in → passive "No boss this week" pill.
 *   3. Spawning boss → "Set up your boss!" CTA linking to
 *      /boss/customize. Parents can customize; Winter just sees
 *      "waiting on a parent".
 *   4. Active boss → full card: mob emoji, name, HP bar, tasks
 *      remaining, days left. Taps through to /boss.
 */
export default function BossCard() {
  const bosses = useStore((s) => s.state.bosses);
  const isParent = useIsParent();

  const active = bosses?.active;

  // State 1 / 2 — no boss.
  if (!active) {
    return (
      <section className="panel space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h3">⚔️ WEEKLY BOSS</div>
          <span className="text-xs muted">none</span>
        </div>
        {isParent ? (
          <>
            <div className="text-sm muted">
              No boss active this week. Pick a room to raid!
            </div>
            <Link href="/boss/select" className="block-btn gold w-full">
              🎯 Start a Boss
            </Link>
          </>
        ) : (
          <div className="text-sm muted">
            No boss this week. Ask a parent to start one!
          </div>
        )}
      </section>
    );
  }

  const def = BOSSES_BY_ID[active.bossId];
  if (!def) return null;

  const hpPct = active.totalHP > 0
    ? Math.max(0, (active.currentHP / active.totalHP) * 100)
    : 0;
  const tasksRemaining = Object.values(active.tasks).filter(
    (t) => t.active && !t.completed
  ).length +
    active.customTasks.filter((ct) => {
      const st = active.tasks[ct.id];
      return !st || !st.completed;
    }).length;
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(active.weekEndDate).getTime() - Date.now()) / 86400000
    )
  );

  // State 3 — spawning.
  if (active.status === "spawning") {
    return (
      <section className="panel space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{def.icon}</span>
            <div>
              <div className="font-pixel text-[10px] text-yellow-300">
                {def.name.toUpperCase()}
              </div>
              <div className="text-xs muted">Waiting to spawn</div>
            </div>
          </div>
          <span className="font-pixel text-[8px] text-diamond">
            {active.totalHP} HP
          </span>
        </div>
        <div className="text-xs muted italic">&ldquo;{def.flavor}&rdquo;</div>
        {isParent ? (
          <Link href="/boss/customize" className="block-btn alt w-full">
            ⚙️ Finish setup
          </Link>
        ) : (
          <div className="text-xs muted text-center">
            A parent is setting this up.
          </div>
        )}
      </section>
    );
  }

  // State 4 — active fight.
  return (
    <section className="panel space-y-2">
      <Link href="/boss" className="block">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-4xl">{def.icon}</span>
            <div>
              <div className="font-pixel text-[10px] text-yellow-300">
                {def.name.toUpperCase()}
              </div>
              <div className="text-xs muted">{def.mob}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-pixel text-[9px] text-diamond">
              {tasksRemaining} LEFT
            </div>
            <div className="text-xs muted">{daysLeft}d left</div>
          </div>
        </div>

        {/* HP bar — Minecraft mob style */}
        <div className="relative mt-2 h-5 border-2 border-black bg-[#0d0d18] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-b from-[#ff7070] via-[#ff2020] to-[#a00000] transition-all duration-300"
            style={{ width: `${hpPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-pixel text-[8px] text-white drop-shadow">
            {active.currentHP} / {active.totalHP}
          </div>
        </div>
      </Link>
    </section>
  );
}
