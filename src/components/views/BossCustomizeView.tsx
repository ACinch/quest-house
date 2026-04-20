"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BOSSES_BY_ID } from "@/lib/data/bosses";

/**
 * Boss customize screen at /boss/customize.
 *
 * Shows the spawning boss's task list with toggles. Parents can
 * toggle tasks off (skip them this week) or add custom one-off
 * tasks with their own damage / xp values. HP previews live as
 * tasks toggle.
 *
 * Hitting "Spawn Boss" calls spawnBoss() which transitions the
 * status from spawning → active and routes back to /boss for the
 * fight.
 *
 * Wrapped in <ParentOnly> at the page level.
 */
export default function BossCustomizeView() {
  const active = useStore((s) => s.state.bosses?.active ?? null);
  const toggleBossTask = useStore((s) => s.toggleBossTask);
  const addCustomBossTask = useStore((s) => s.addCustomBossTask);
  const removeCustomBossTask = useStore((s) => s.removeCustomBossTask);
  const spawnBoss = useStore((s) => s.spawnBoss);
  const router = useRouter();

  const [customName, setCustomName] = useState("");
  const [customDamage, setCustomDamage] = useState<number>(8);
  const [customXP, setCustomXP] = useState<number>(8);

  if (!active) {
    return (
      <div className="space-y-3">
        <div className="h2">No boss to customize</div>
        <div className="panel text-sm muted">
          You haven&apos;t selected a boss yet. Pick one to start.
        </div>
        <Link href="/boss/select" className="block-btn alt w-full">
          🎯 Pick a Boss
        </Link>
      </div>
    );
  }

  if (active.status !== "spawning") {
    return (
      <div className="space-y-3">
        <div className="h2">Already spawned</div>
        <div className="panel text-sm muted">
          This boss is already active — head to the fight screen to
          deal damage. Tasks are locked once a boss is spawned.
        </div>
        <Link href="/boss" className="block-btn alt w-full">
          ⚔️ Go to Fight
        </Link>
      </div>
    );
  }

  const def = BOSSES_BY_ID[active.bossId];
  if (!def) return null;

  const sortedTasks = Object.values(active.tasks).sort((a, b) =>
    a.taskId.localeCompare(b.taskId)
  );
  const builtIn = sortedTasks.filter((t) => !t.taskId.startsWith("custom:"));
  const customs = sortedTasks.filter((t) => t.taskId.startsWith("custom:"));
  const activeCount = sortedTasks.filter((t) => t.active).length;

  // Helper to get the display name from the static def.
  const getTaskName = (taskId: string): string => {
    const customMatch = active.customTasks.find((c) => c.id === taskId);
    if (customMatch) return customMatch.name;
    if (def.isCapstone) {
      const sourceId = taskId.split(":")[0];
      const sourceDef = BOSSES_BY_ID[sourceId];
      return (
        sourceDef?.tasks.find((t) => t.id === taskId)?.name ?? taskId
      );
    }
    return def.tasks.find((t) => t.id === taskId)?.name ?? taskId;
  };

  // Capstone grouping for built-in tasks.
  const groupedBuiltIn: { sourceBossId: string; tasks: typeof builtIn }[] = [];
  if (def.isCapstone) {
    const map: Record<string, typeof builtIn> = {};
    for (const t of builtIn) {
      const src = t.taskId.split(":")[0];
      (map[src] ??= []).push(t);
    }
    for (const sourceBossId of Object.keys(map)) {
      groupedBuiltIn.push({ sourceBossId, tasks: map[sourceBossId] });
    }
  }

  const handleAddCustom = () => {
    if (!customName.trim() || customDamage <= 0) return;
    addCustomBossTask({
      name: customName.trim(),
      damage: customDamage,
      xp: customXP,
    });
    setCustomName("");
    setCustomDamage(8);
    setCustomXP(8);
  };

  const handleSpawn = () => {
    if (activeCount === 0) {
      alert("Pick at least one task before spawning the boss.");
      return;
    }
    spawnBoss();
    router.push("/boss");
  };

  return (
    <div className="space-y-3">
      {/* Hero summary */}
      <section className="panel space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{def.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-pixel text-[11px] text-yellow-300">
              {def.name.toUpperCase()}
            </div>
            <div className="text-xs muted italic">
              &ldquo;{def.flavor}&rdquo;
            </div>
          </div>
        </div>
        <div className="text-sm">
          {activeCount} task{activeCount === 1 ? "" : "s"} · {" "}
          <span className="font-pixel text-[10px] text-diamond">
            {active.totalHP} HP
          </span>
        </div>
        <div className="text-xs muted">
          Toggle tasks off to skip them this week. Add custom tasks
          for one-offs that don&apos;t fit the template.
        </div>
      </section>

      {/* Built-in tasks */}
      {def.isCapstone ? (
        groupedBuiltIn.map((group) => {
          const sourceDef = BOSSES_BY_ID[group.sourceBossId];
          return (
            <section key={group.sourceBossId} className="panel space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{sourceDef?.icon ?? "❓"}</span>
                <div className="font-pixel text-[10px] text-yellow-300">
                  {(sourceDef?.name ?? group.sourceBossId).toUpperCase()}
                </div>
              </div>
              {group.tasks.map((task) => (
                <TaskToggle
                  key={task.taskId}
                  name={getTaskName(task.taskId)}
                  damage={task.damage}
                  active={task.active}
                  onToggle={() => toggleBossTask(task.taskId)}
                />
              ))}
            </section>
          );
        })
      ) : (
        <section className="panel space-y-2">
          <div className="h3">TASKS</div>
          {builtIn.map((task) => (
            <TaskToggle
              key={task.taskId}
              name={getTaskName(task.taskId)}
              damage={task.damage}
              active={task.active}
              onToggle={() => toggleBossTask(task.taskId)}
            />
          ))}
        </section>
      )}

      {/* Custom tasks list + add form */}
      <section className="panel space-y-2">
        <div className="h3">+ CUSTOM TASKS</div>
        {customs.length > 0 && (
          <div className="space-y-1">
            {customs.map((task) => (
              <div
                key={task.taskId}
                className="flex items-center justify-between gap-2 panel-tight panel"
              >
                <div className="text-sm flex-1 min-w-0">
                  {getTaskName(task.taskId)}
                </div>
                <span className="font-pixel text-[8px] text-redstone">
                  -{task.damage}
                </span>
                <button
                  type="button"
                  className="block-btn ghost"
                  onClick={() => removeCustomBossTask(task.taskId)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <input
            className="input"
            placeholder="e.g. Clean the toaster oven"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs muted">
              Damage
              <input
                type="number"
                className="input mt-1"
                value={customDamage}
                min={1}
                onChange={(e) => setCustomDamage(parseInt(e.target.value) || 0)}
              />
            </label>
            <label className="text-xs muted">
              XP
              <input
                type="number"
                className="input mt-1"
                value={customXP}
                min={0}
                onChange={(e) => setCustomXP(parseInt(e.target.value) || 0)}
              />
            </label>
          </div>
          <button
            type="button"
            className="block-btn"
            onClick={handleAddCustom}
            disabled={!customName.trim() || customDamage <= 0}
          >
            ➕ Add Custom Task
          </button>
        </div>
      </section>

      {/* Spawn */}
      <button
        type="button"
        className="block-btn gold w-full"
        onClick={handleSpawn}
        disabled={activeCount === 0}
      >
        ⚔️ Spawn the Boss ({active.totalHP} HP)
      </button>

      <Link href="/" className="block-btn ghost w-full">
        ← Save & Exit
      </Link>
    </div>
  );
}

function TaskToggle({
  name,
  damage,
  active,
  onToggle,
}: {
  name: string;
  damage: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="panel-tight panel w-full text-left flex items-center justify-between gap-2"
      style={{ opacity: active ? 1 : 0.45 }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">{active ? "☑" : "☐"}</span>
        <span className="text-sm">{name}</span>
      </div>
      <span
        className="font-pixel text-[8px]"
        style={{ color: active ? "#FF5555" : "#6a6a80" }}
      >
        -{damage}
      </span>
    </button>
  );
}
