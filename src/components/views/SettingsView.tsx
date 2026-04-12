"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { UserId } from "@/lib/types";

export default function SettingsView() {
  const config = useStore((s) => s.state.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const exportState = useStore((s) => s.exportState);
  const importState = useStore((s) => s.importState);
  const resetState = useStore((s) => s.resetState);
  const setWeekendResetLevel = useStore((s) => s.setWeekendResetLevel);
  const logWeekendReset = useStore((s) => s.logWeekendReset);
  const weekendReset = useStore((s) => s.state.weekendReset);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quest-house-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    try {
      const parsed = JSON.parse(text);
      importState(parsed);
      alert("Imported!");
    } catch {
      alert("Could not parse that file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="h2">SETTINGS</div>

      <section className="panel space-y-2">
        <div className="h3">QUICK NAV</div>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/weekly" className="block-btn ghost">📊 Weekly</Link>
          <Link href="/rotation" className="block-btn ghost">🧸 Toys</Link>
          <Link href="/quests" className="block-btn ghost">📋 Custom Quests</Link>
          <Link href="/chest-pool" className="block-btn ghost">🎁 Chest Pool</Link>
        </div>
      </section>

      <section className="panel space-y-2">
        <div className="h3">CONFIG</div>
        <Field
          label="Weekly XP Cap (Winter)"
          value={config.weeklyXPCap}
          onChange={(v) => updateConfig({ weeklyXPCap: v })}
        />
        <Field
          label="XP → $ Rate"
          value={config.xpToDollarRate}
          step={0.01}
          onChange={(v) => updateConfig({ xpToDollarRate: v })}
        />
        <Field
          label="Adult Milestone Threshold"
          value={config.adultMilestoneThreshold}
          onChange={(v) => updateConfig({ adultMilestoneThreshold: v })}
        />
        <Field
          label="Chest Drop Chance (0–1)"
          value={config.chestDropChance}
          step={0.05}
          onChange={(v) => updateConfig({ chestDropChance: v })}
        />
        <Field
          label="Mastery Threshold"
          value={config.masteryThreshold}
          onChange={(v) => updateConfig({ masteryThreshold: v })}
        />
        <Field
          label="Toy Rotation (weeks)"
          value={config.rotationIntervalWeeks}
          onChange={(v) => updateConfig({ rotationIntervalWeeks: v })}
        />
      </section>

      <section className="panel space-y-2">
        <div className="h3">WEEKEND RESET</div>
        <div className="text-sm">
          Current level:{" "}
          <span className="font-pixel text-[10px] text-yellow-300">
            LVL {config.weekendResetLevel}
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((l) => (
            <button
              key={l}
              type="button"
              className={`block-btn ${config.weekendResetLevel === l ? "" : "ghost"} flex-1`}
              onClick={() => setWeekendResetLevel(l as 1 | 2 | 3)}
            >
              LVL {l}
            </button>
          ))}
        </div>
        <div className="text-xs muted">
          {config.weekendResetLevel === 1 && "20–30 min micro-reset (1 sprint)"}
          {config.weekendResetLevel === 2 && "40–50 min reset (2 sprints + break)"}
          {config.weekendResetLevel === 3 && "60–90 min reset (3 sprints + breaks)"}
        </div>
        <button type="button" className="block-btn alt" onClick={() => logWeekendReset()}>
          ✅ Log a Reset Today
        </button>
        {weekendReset.lastResetDate && (
          <div className="text-xs muted">
            Last reset: {new Date(weekendReset.lastResetDate).toLocaleDateString()}
          </div>
        )}
      </section>

      <section className="panel space-y-2">
        <div className="h3">DATA</div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="block-btn dirt" onClick={handleExport}>
            ⬇️ Export
          </button>
          <label className="block-btn ghost cursor-pointer">
            ⬆️ Import
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
        <button
          type="button"
          className="block-btn danger w-full"
          onClick={() => {
            if (confirm("Reset everything to defaults? This wipes all progress.")) {
              resetState();
            }
          }}
        >
          ⚠️ Reset to Defaults
        </button>
      </section>

      <section className="panel space-y-2">
        <div className="h3">THEME</div>
        <div className="text-sm muted">
          Current theme: <span className="text-yellow-300">{config.currentTheme}</span>
        </div>
        <div className="text-xs muted">
          More themes coming soon. The skill tree is theme-agnostic — only flavor text and colors will change.
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type="number"
        className="input mt-1"
        value={value}
        step={step ?? 1}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}
