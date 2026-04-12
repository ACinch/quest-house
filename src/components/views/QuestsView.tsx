"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { SkillType } from "@/lib/types";

export default function QuestsView() {
  const customQuests = useStore((s) => s.state.config.customQuests);
  const addCustomQuest = useStore((s) => s.addCustomQuest);
  const removeCustomQuest = useStore((s) => s.removeCustomQuest);

  const [name, setName] = useState("");
  const [flavor, setFlavor] = useState("A new notice on the quest board");
  const [description, setDescription] = useState("");
  const [xp, setXp] = useState(15);
  const [type, setType] = useState<SkillType>("one-off");
  const [branchId, setBranchId] = useState<"home_admin" | "exterior_seasonal">("home_admin");

  const submit = () => {
    if (!name.trim() || !description.trim()) return;
    addCustomQuest({
      name: name.trim(),
      flavor: flavor.trim() || "A new notice on the quest board",
      description: description.trim(),
      xp,
      type,
      branchId,
    });
    setName("");
    setDescription("");
    setXp(15);
  };

  return (
    <div className="space-y-3">
      <div className="h2">CUSTOM QUESTS</div>
      <div className="muted text-sm">
        Add new "adulting" tasks to the quest board. They'll appear in both adults' skill trees.
      </div>

      <section className="panel space-y-2">
        <div className="h3">NEW QUEST</div>
        <label className="block text-sm">
          Name
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Schedule Dentist" />
        </label>
        <label className="block text-sm">
          Description
          <input className="input mt-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs doing?" />
        </label>
        <label className="block text-sm">
          Minecraft flavor
          <input className="input mt-1" value={flavor} onChange={(e) => setFlavor(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            XP
            <input type="number" className="input mt-1" value={xp} onChange={(e) => setXp(parseInt(e.target.value) || 0)} />
          </label>
          <label className="block text-sm">
            Type
            <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as SkillType)}>
              <option value="one-off">One-off</option>
              <option value="recurring">Recurring</option>
              <option value="seasonal">Seasonal</option>
            </select>
          </label>
        </div>
        <label className="block text-sm">
          Branch
          <select className="input mt-1" value={branchId} onChange={(e) => setBranchId(e.target.value as "home_admin" | "exterior_seasonal")}>
            <option value="home_admin">Home Admin (Quest Board)</option>
            <option value="exterior_seasonal">Exterior & Seasonal</option>
          </select>
        </label>
        <button type="button" className="block-btn" onClick={submit}>
          ➕ Add Quest
        </button>
      </section>

      <section className="space-y-2">
        <div className="h3">YOUR CUSTOM QUESTS</div>
        {customQuests.length === 0 ? (
          <div className="panel muted text-sm">No custom quests yet.</div>
        ) : (
          customQuests.map((q) => (
            <div key={q.id} className="panel panel-tight">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-pixel text-[10px] text-yellow-300">{q.name.toUpperCase()}</div>
                  <div className="text-sm">{q.description}</div>
                  <div className="text-xs muted italic">"{q.flavor}"</div>
                  <div className="text-xs muted">
                    {q.branchId === "home_admin" ? "📋 Home Admin" : "🏠 Exterior"} · {q.type} · +{q.xp} XP
                  </div>
                </div>
                <button
                  type="button"
                  className="block-btn danger"
                  onClick={() => removeCustomQuest(q.branchId, q.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
