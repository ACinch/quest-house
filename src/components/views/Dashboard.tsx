"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useIsParent } from "@/lib/auth-client";
import { branchesForUserWithCustom } from "@/lib/skills";
import {
  WINTER_SKILLS,
  WINTER_DOMAIN_META,
} from "@/lib/data/winter-skills";
import XPBar from "@/components/XPBar";
import RankBadge from "@/components/RankBadge";
import BossCard from "./BossCard";

/**
 * The dashboard adapts to the active user:
 *   - Winter (web-based):  pulls available quests from skillTree,
 *     shows inventory count, and renders Done buttons only if the
 *     signed-in user is a parent (spec Q2 = b, parent-driven).
 *   - Adults (branch-based): the original branch-driven quest list.
 */
export default function Dashboard() {
  const activeUser = useStore((s) => s.activeUser);
  if (activeUser === "winter") return <WinterDashboard />;
  return <AdultDashboard />;
}

// ==================================================================
// Winter dashboard (web model)
// ==================================================================

function WinterDashboard() {
  const user = useStore((s) => s.state.users.winter);
  const config = useStore((s) => s.state.config);
  const completeWinterSkill = useStore((s) => s.completeWinterSkill);
  const toyRotation = useStore((s) => s.state.toyRotation);
  const isParent = useIsParent();
  const signedInUser = useStore((s) => s.activeUser);

  const skillTreeState = user.skillTree;
  const inventory = user.inventory ?? [];
  const unredeemed = inventory.filter((i) => !i.redeemed).length;

  // Top unlocked-but-not-mastered skills, sorted by base XP descending
  // (highest value first is more motivating).
  const availableSkills = useMemo(() => {
    const tree = skillTreeState?.skills ?? {};
    const out = WINTER_SKILLS.filter((def) => {
      const st = tree[def.id];
      return st && st.unlocked && !st.mastered;
    })
      .map((def) => ({
        def,
        state: tree[def.id],
      }))
      .sort((a, b) => b.def.baseXP - a.def.baseXP)
      .slice(0, 8);
    return out;
  }, [skillTreeState]);

  const lastRotationDays = toyRotation.lastRotationDate
    ? Math.floor(
        (Date.now() - new Date(toyRotation.lastRotationDate).getTime()) /
          86400000
      )
    : null;

  const handleComplete = (skillId: string) => {
    completeWinterSkill({ skillId, confirmedBy: signedInUser });
  };

  return (
    <div className="space-y-4">
      <section className="panel space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="h2">{user.displayName.toUpperCase()}</div>
          <RankBadge rank={user.rank} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="muted">Weekly XP</span>
          <span className="font-pixel text-[10px] text-yellow-300">
            ${(user.currentWeekXP * config.xpToDollarRate).toFixed(2)}
          </span>
        </div>
        <XPBar
          current={Math.min(user.currentWeekXP, config.weeklyXPCap)}
          max={config.weeklyXPCap}
          label={`${user.currentWeekXP} / ${config.weeklyXPCap} XP`}
        />
        <div className="text-sm muted">
          Lifetime XP:{" "}
          <span className="text-yellow-300">{user.lifetimeXP}</span>
        </div>

        <div className="flex gap-2 flex-wrap text-sm">
          <div className="pixel-border bg-[#0d0d18] px-2 py-1">
            🎒 Inventory:{" "}
            <span className="text-yellow-300">{unredeemed}</span>
          </div>
          <div className="pixel-border bg-[#0d0d18] px-2 py-1">
            🎁 Looted:{" "}
            <span className="text-yellow-300">{user.chestsLooted}</span>
          </div>
          <div className="pixel-border bg-[#0d0d18] px-2 py-1">
            🏗️ Reset Lvl:{" "}
            <span className="text-diamond">{config.weekendResetLevel}</span>
          </div>
        </div>
      </section>

      <BossCard />

      <section>
        <div className="h3 mb-2">⚡ AVAILABLE QUESTS</div>
        {availableSkills.length === 0 ? (
          <div className="panel muted text-sm">
            No quests unlocked yet. Visit the Skills page.
          </div>
        ) : (
          <div className="space-y-2">
            {availableSkills.map(({ def, state }) => {
              const domainMeta = WINTER_DOMAIN_META[def.domain];
              return (
                <div key={def.id} className="panel panel-tight">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{domainMeta.icon}</span>
                        <span className="font-pixel text-[10px] text-yellow-300">
                          {def.name.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm leading-snug">
                        {def.description}
                      </div>
                      <div className="text-xs muted italic">
                        &ldquo;{def.minecraftFlavor}&rdquo;
                      </div>
                      <div className="text-xs muted">
                        Completions: {state.completions}
                        {def.supervised && " · ⚠ supervised"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-pixel text-[9px] text-yellow-300">
                        +{def.baseXP} XP
                      </span>
                      {isParent ? (
                        <button
                          type="button"
                          className="block-btn"
                          onClick={() => handleComplete(def.id)}
                        >
                          Done
                        </button>
                      ) : (
                        <span className="font-pixel text-[7px] muted">
                          parent only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link href="/skills" className="block-btn alt">
          🧱 Skill Tree
        </Link>
        <Link href="/inventory" className="block-btn gold">
          🎒 Inventory
        </Link>
        <Link href="/log" className="block-btn ghost">
          📜 Task Log
        </Link>
        <Link href="/weekly" className="block-btn dirt">
          📊 Weekly
        </Link>
      </section>

      {lastRotationDays !== null && lastRotationDays > 28 && (
        <section className="panel text-xs muted">
          ⚠️ Toy rotation overdue ({lastRotationDays} days).{" "}
          <Link href="/rotation" className="text-yellow-300 underline">
            Swap a bin →
          </Link>
        </section>
      )}
    </div>
  );
}

// ==================================================================
// Adult dashboard (branch-based, unchanged logic)
// ==================================================================

function AdultDashboard() {
  const activeUser = useStore((s) => s.activeUser);
  const user = useStore((s) => s.state.users[s.activeUser]);
  const config = useStore((s) => s.state.config);
  const customQuests = useStore((s) => s.state.config.customQuests);
  const toyRotation = useStore((s) => s.state.toyRotation);
  const completeTask = useStore((s) => s.completeTask);
  const isParent = useIsParent();
  const sessionId = useStore((s) => s.activeUser);
  const canEdit = isParent && activeUser === sessionId;

  const branches = useMemo(
    () => branchesForUserWithCustom(activeUser, customQuests),
    [activeUser, customQuests]
  );

  const availableSkills = useMemo(() => {
    const out: {
      branchId: string;
      branchName: string;
      branchIcon: string;
      skillId: string;
      name: string;
      xp: number;
      description: string;
      flavor: string;
      completions: number;
    }[] = [];
    for (const b of branches) {
      const sorted = [...b.skills].sort((a, c) => a.order - c.order);
      for (const skill of sorted) {
        const st = user.skills[b.id]?.[skill.id];
        if (!st || !st.unlocked) continue;
        out.push({
          branchId: b.id,
          branchName: b.name,
          branchIcon: b.icon,
          skillId: skill.id,
          name: skill.name,
          xp: skill.xp,
          description: skill.description,
          flavor: skill.flavor,
          completions: st.completions,
        });
        if (out.length >= 8) return out;
      }
      if (out.length >= 8) break;
    }
    return out;
  }, [branches, user]);

  const lastRotationDays = toyRotation.lastRotationDate
    ? Math.floor(
        (Date.now() - new Date(toyRotation.lastRotationDate).getTime()) /
          86400000
      )
    : null;

  const handleComplete = (branchId: string, skillId: string) => {
    completeTask({
      userId: activeUser,
      branchId,
      skillId,
      confirmedBy: "self",
    });
  };

  return (
    <div className="space-y-4">
      <section className="panel space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="h2">{user.displayName.toUpperCase()}</div>
          <RankBadge rank={user.rank} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="muted">Next Reward</span>
          <span className="font-pixel text-[10px] text-diamond">
            <NextRewardLabel />
          </span>
        </div>
        <XPBar
          current={user.currentMilestoneXP}
          max={config.adultMilestoneThreshold}
          label={`${user.currentMilestoneXP} / ${config.adultMilestoneThreshold} XP`}
        />
        <div className="text-sm muted">
          Lifetime XP:{" "}
          <span className="text-yellow-300">{user.lifetimeXP}</span>
          {" · "}
          Milestones:{" "}
          <span className="text-yellow-300">{user.milestonesEarned}</span>
        </div>

        <div className="flex gap-2 flex-wrap text-sm">
          <div className="pixel-border bg-[#0d0d18] px-2 py-1">
            🎁 Chests Looted:{" "}
            <span className="text-yellow-300">{user.chestsLooted}</span>
          </div>
          <div className="pixel-border bg-[#0d0d18] px-2 py-1">
            🏗️ Reset Lvl:{" "}
            <span className="text-diamond">{config.weekendResetLevel}</span>
          </div>
        </div>
      </section>

      <BossCard />

      <section>
        <div className="h3 mb-2">⚡ AVAILABLE QUESTS</div>
        {!canEdit && (
          <div className="text-xs muted mb-2">
            Read-only — you can&apos;t edit {user.displayName}&apos;s tasks.
          </div>
        )}
        {availableSkills.length === 0 ? (
          <div className="panel muted text-sm">
            No quests unlocked yet. Visit the Skills page.
          </div>
        ) : (
          <div className="space-y-2">
            {availableSkills.map((s) => (
              <div
                key={`${s.branchId}-${s.skillId}`}
                className="panel panel-tight"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{s.branchIcon}</span>
                      <span className="font-pixel text-[10px] text-yellow-300">
                        {s.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm leading-snug">{s.description}</div>
                    <div className="text-xs muted italic">
                      &ldquo;{s.flavor}&rdquo;
                    </div>
                    <div className="text-xs muted">
                      Completions: {s.completions}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-pixel text-[9px] text-yellow-300">
                      +{s.xp} XP
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        className="block-btn"
                        onClick={() => handleComplete(s.branchId, s.skillId)}
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link href="/skills" className="block-btn alt">
          🧱 Skill Tree
        </Link>
        <Link href="/log" className="block-btn ghost">
          📜 Task Log
        </Link>
        <Link href="/weekly" className="block-btn dirt">
          📊 Weekly
        </Link>
        <Link href="/rotation" className="block-btn ghost">
          🧸 Toys
          {lastRotationDays !== null && lastRotationDays > 28 && (
            <span className="text-yellow-300 ml-1">!</span>
          )}
        </Link>
      </section>
    </div>
  );
}

function NextRewardLabel() {
  const cycle = useStore((s) => s.state.adultRewardCycle);
  const next = cycle.currentPosition;
  return <span>{next === "house" ? "🏠 HOUSE" : "🎁 PERSONAL"}</span>;
}
