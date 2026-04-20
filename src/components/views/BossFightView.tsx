"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import BackButton from "@/components/BackButton";
import { useIsParent, useSession } from "@/lib/auth-client";
import { BOSSES_BY_ID } from "@/lib/data/bosses";
import {
  computeDamageShares,
  tierFromPercent,
  bonusXPForTier,
} from "@/lib/bosses";
import { CHEST_TIER_META } from "@/lib/data/winter-chest-pool";
import type {
  ActiveBoss,
  BossTaskState,
  ChestTier,
  UserId,
} from "@/lib/types";

/**
 * The boss fight screen at /boss. Mob emoji + HP bar + task list +
 * participants. Parents can complete tasks; Winter sees read-only.
 */
export default function BossFightView() {
  const bosses = useStore((s) => s.state.bosses);
  const users = useStore((s) => s.state.users);
  const completeBossTask = useStore((s) => s.completeBossTask);
  const resetActiveBoss = useStore((s) => s.resetActiveBoss);
  const isParent = useIsParent();
  const { data: sessionUser } = useSession();
  const activeView = useStore((s) => s.activeUser);

  // Confirmation modal state for killing-blow.
  const [pendingKill, setPendingKill] = useState<{
    taskId: string;
    creditedUserId: UserId;
  } | null>(null);

  const active = bosses?.active ?? null;
  const def = active ? BOSSES_BY_ID[active.bossId] : null;

  // Group tasks: capstone groups by sourceBossId, otherwise flat.
  const taskGroups = useMemo(() => {
    if (!active || !def) return [] as { label: string; icon: string; tasks: BossTaskState[] }[];

    if (def.isCapstone) {
      const groups: Record<string, BossTaskState[]> = {};
      for (const task of Object.values(active.tasks)) {
        if (!task.active) continue;
        const sourceBossId = task.taskId.split(":")[0];
        (groups[sourceBossId] ??= []).push(task);
      }
      return Object.keys(groups).map((sourceId) => {
        const sourceDef = BOSSES_BY_ID[sourceId];
        return {
          label: sourceDef?.name ?? sourceId,
          icon: sourceDef?.icon ?? "❓",
          tasks: groups[sourceId],
        };
      });
    }

    const allTasks = Object.values(active.tasks).filter((t) => t.active);
    return [{ label: "Tasks", icon: def.icon, tasks: allTasks }];
  }, [active, def]);

  if (!active || !def) {
    return (
      <div className="space-y-3">
        <div className="h2">⚔️ NO ACTIVE BOSS</div>
        <div className="panel text-sm muted">
          There&apos;s no active boss right now. {isParent ? (
            <>
              Head to{" "}
              <Link href="/boss/select" className="text-yellow-300 underline">
                Boss Select
              </Link>{" "}
              to start one.
            </>
          ) : (
            <>Ask a parent to start one.</>
          )}
        </div>
        <BackButton />
      </div>
    );
  }

  const totalCompletions = Object.values(active.tasks).filter(
    (t) => t.completed
  ).length;
  const totalActive = Object.values(active.tasks).filter((t) => t.active).length;

  // Live participant percent prediction.
  const totalDamageDealt = Object.values(active.participants).reduce(
    (sum, p) => sum + p.damageDealt,
    0
  );
  const liveShares = computeDamageShares(
    active.participants,
    Math.max(active.totalHP, 1) // base on totalHP for accurate live preview
  );

  const config = bosses!.config;

  const tryComplete = (taskId: string) => {
    const task = active.tasks[taskId];
    if (!task) return;
    // Default credited user: when viewing Winter, credit Winter so
    // parents marking on Winter's behalf flow correctly. Otherwise
    // credit the signed-in user.
    const credited: UserId = activeView;

    const wouldHitZero = active.currentHP - task.damage <= 0;
    if (wouldHitZero) {
      setPendingKill({ taskId, creditedUserId: credited });
      return;
    }
    completeBossTask({
      taskId,
      creditedUserId: credited,
      confirmedBy: sessionUser?.id ?? credited,
    });
  };

  const confirmKill = () => {
    if (!pendingKill) return;
    completeBossTask({
      taskId: pendingKill.taskId,
      creditedUserId: pendingKill.creditedUserId,
      confirmedBy: sessionUser?.id ?? pendingKill.creditedUserId,
    });
    setPendingKill(null);
  };

  const hpPct = active.totalHP > 0
    ? Math.max(0, (active.currentHP / active.totalHP) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* Hero — mob emoji + name + HP bar */}
      <section className="panel space-y-2">
        <div className="text-center">
          <div className="text-7xl">{def.icon}</div>
          <div className="font-pixel text-[12px] text-yellow-300 mt-2">
            {def.name.toUpperCase()}
          </div>
          <div className="text-xs muted italic">&ldquo;{def.flavor}&rdquo;</div>
        </div>

        {/* Big HP bar */}
        <div className="relative h-7 border-2 border-black bg-[#0d0d18] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-b from-[#ff7070] via-[#ff2020] to-[#a00000] transition-all duration-300"
            style={{ width: `${hpPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-pixel text-[10px] text-white drop-shadow">
            {active.currentHP} / {active.totalHP} HP
          </div>
        </div>

        <div className="text-xs muted text-center">
          {totalCompletions} / {totalActive} tasks done
        </div>
      </section>

      {/* Task list, grouped */}
      {taskGroups.map((group, gIdx) => (
        <section key={gIdx} className="panel space-y-2">
          {def.isCapstone && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{group.icon}</span>
              <div className="font-pixel text-[10px] text-yellow-300">
                {group.label.toUpperCase()}
              </div>
            </div>
          )}
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <BossTaskRow
                key={task.taskId}
                task={task}
                bossActive={active}
                isParent={isParent}
                onComplete={() => tryComplete(task.taskId)}
                users={users}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Participants panel */}
      <section className="panel space-y-2">
        <div className="h3">⚔️ DAMAGE</div>
        {Object.values(active.participants).length === 0 ? (
          <div className="text-sm muted">No tasks completed yet.</div>
        ) : (
          <div className="space-y-1">
            {liveShares.map((share) => {
              const user = users[share.userId];
              const tier = tierFromPercent(share.damagePercent, config);
              const bonusXP = tier ? bonusXPForTier(tier, config) : 0;
              return (
                <div
                  key={share.userId}
                  className="flex justify-between items-center text-sm"
                >
                  <div>
                    <span className="font-pixel text-[8px] text-yellow-300 mr-2">
                      {user.displayName.toUpperCase()}
                    </span>
                    <span className="muted">
                      {share.damageDealt} dmg ({share.damagePercent}%)
                    </span>
                  </div>
                  {tier && <TierChip tier={tier} bonusXP={bonusXP} />}
                </div>
              );
            })}
          </div>
        )}
        <div className="text-xs muted">
          Total damage dealt: {totalDamageDealt} / {active.totalHP}
        </div>
      </section>

      {/* Parent escape hatch */}
      {isParent && (
        <button
          type="button"
          className="block-btn danger w-full"
          onClick={() => {
            if (
              confirm(
                "Reset the active boss? All progress is lost — no rewards. This can't be undone."
              )
            ) {
              resetActiveBoss();
            }
          }}
        >
          ⚠️ Reset Active Boss
        </button>
      )}

      <BackButton />

      {/* Killing-blow confirmation */}
      {pendingKill && (
        <KillConfirmModal
          bossName={def.name}
          mobIcon={def.icon}
          onConfirm={confirmKill}
          onCancel={() => setPendingKill(null)}
        />
      )}
    </div>
  );
}

// ==================================================================
// Task row
// ==================================================================

function BossTaskRow({
  task,
  bossActive,
  isParent,
  onComplete,
  users,
}: {
  task: BossTaskState;
  bossActive: ActiveBoss;
  isParent: boolean;
  onComplete: () => void;
  users: Record<UserId, { displayName: string }>;
}) {
  const def = BOSSES_BY_ID[bossActive.bossId];
  const taskName =
    bossActive.customTasks.find((c) => c.id === task.taskId)?.name ??
    (def?.isCapstone
      ? BOSSES_BY_ID[task.taskId.split(":")[0]]?.tasks.find(
          (t) => t.id === task.taskId
        )?.name
      : def?.tasks.find((t) => t.id === task.taskId)?.name) ??
    task.taskId;

  return (
    <div
      className="panel panel-tight"
      style={{ opacity: task.completed ? 0.5 : 1 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            {task.completed && "✓ "}
            {taskName}
          </div>
          {task.completed && task.creditedUserId && (
            <div className="text-xs muted">
              by {users[task.creditedUserId]?.displayName ?? task.creditedUserId}
              {task.confirmedBy &&
                task.confirmedBy !== task.creditedUserId &&
                ` (confirmed by ${users[task.confirmedBy]?.displayName ?? task.confirmedBy})`}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="font-pixel text-[8px]"
            style={{ color: task.completed ? "#6a6a80" : "#FF5555" }}
          >
            -{task.damage}
          </span>
          {!task.completed && isParent && (
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

// ==================================================================
// Tier chip
// ==================================================================

function TierChip({ tier, bonusXP }: { tier: ChestTier; bonusXP: number }) {
  const meta = CHEST_TIER_META[tier];
  return (
    <span
      className="pixel-border px-2 py-0.5 text-[9px] font-pixel"
      style={{ background: meta.color, color: "#000" }}
    >
      {meta.icon} {meta.displayName.toUpperCase()} +{bonusXP}
    </span>
  );
}

// ==================================================================
// Killing-blow confirmation modal
// ==================================================================

function KillConfirmModal({
  bossName,
  mobIcon,
  onConfirm,
  onCancel,
}: {
  bossName: string;
  mobIcon: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal space-y-3 text-center">
        <div className="text-7xl">{mobIcon}</div>
        <div className="h2">FINAL BLOW?</div>
        <div className="text-sm">
          This will defeat <span className="text-yellow-300">{bossName}</span>.
          Rewards will be distributed and the boss will despawn.
        </div>
        <div className="text-xs muted">
          Once the boss is defeated, this can&apos;t be undone.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="block-btn ghost flex-1"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="block-btn gold flex-1"
            onClick={onConfirm}
          >
            ⚔️ Strike!
          </button>
        </div>
      </div>
    </div>
  );
}
