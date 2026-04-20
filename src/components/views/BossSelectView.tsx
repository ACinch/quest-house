"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { BOSSES, ROOM_BOSSES } from "@/lib/data/bosses";
import { computeStaticBossHP } from "@/lib/data/bosses";

/**
 * Boss selection screen at /boss/select.
 *
 * Shows all 6 starter bosses (5 room + Ender Dragon capstone) as
 * tappable cards. Tapping calls selectBoss(bossId) which creates a
 * "spawning" instance, then routes to /boss/customize where the
 * parent can toggle tasks and add customs before locking in.
 *
 * Wrapped in <ParentOnly> at the page level — Winter never reaches
 * this view.
 */
export default function BossSelectView() {
  const selectBoss = useStore((s) => s.selectBoss);
  const router = useRouter();

  const handlePick = (bossId: string) => {
    selectBoss(bossId);
    router.push("/boss/customize");
  };

  return (
    <div className="space-y-3">
      <div className="h2">⚔️ PICK THIS WEEK&apos;S BOSS</div>
      <div className="text-sm muted">
        Each boss represents one area of the house. Tap a boss to set
        up the fight — you&apos;ll choose which tasks count toward HP
        before you spawn it.
      </div>

      <div className="space-y-2">
        <div className="h3 text-yellow-300">ROOM BOSSES</div>
        {ROOM_BOSSES.map((boss) => {
          const hp = computeStaticBossHP(boss);
          return (
            <button
              key={boss.id}
              type="button"
              className="panel w-full text-left flex items-center gap-3"
              onClick={() => handlePick(boss.id)}
            >
              <span className="text-5xl">{boss.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[10px] text-yellow-300">
                  {boss.name.toUpperCase()}
                </div>
                <div className="text-xs muted italic">
                  &ldquo;{boss.flavor}&rdquo;
                </div>
                <div className="text-xs muted mt-1">
                  {boss.tasks.length} tasks · {hp} HP
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="h3 text-diamond">CAPSTONE</div>
        {BOSSES.filter((b) => b.isCapstone).map((boss) => {
          const hp = computeStaticBossHP(boss);
          return (
            <button
              key={boss.id}
              type="button"
              className="panel w-full text-left flex items-center gap-3"
              style={{ borderColor: "#4AEDD9" }}
              onClick={() => handlePick(boss.id)}
            >
              <span className="text-5xl">{boss.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[10px] text-diamond">
                  {boss.name.toUpperCase()}
                </div>
                <div className="text-xs muted italic">
                  &ldquo;{boss.flavor}&rdquo;
                </div>
                <div className="text-xs muted mt-1">
                  Whole house · {hp} HP · ⚠️ Hard
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Link href="/" className="block-btn ghost w-full">
        ← Cancel
      </Link>
    </div>
  );
}
