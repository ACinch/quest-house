"use client";

import BackButton from "@/components/BackButton";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function LogView() {
  const user = useStore((s) => s.state.users[s.activeUser]);
  const [tab, setTab] = useState<"tasks" | "chests">("tasks");

  return (
    <div className="space-y-3">
      <div className="h2">{user.displayName.toUpperCase()}'S LOG</div>

      <div className="flex gap-2">
        <button
          type="button"
          className={`block-btn ${tab === "tasks" ? "" : "ghost"} flex-1`}
          onClick={() => setTab("tasks")}
        >
          📜 Tasks
        </button>
        <button
          type="button"
          className={`block-btn ${tab === "chests" ? "gold" : "ghost"} flex-1`}
          onClick={() => setTab("chests")}
        >
          🎁 Chests
        </button>
      </div>

      {tab === "tasks" ? (
        <div className="space-y-2">
          {user.taskLog.length === 0 ? (
            <div className="panel muted text-sm">No tasks logged yet.</div>
          ) : (
            user.taskLog.slice(0, 100).map((entry) => (
              <div key={entry.id} className="panel panel-tight">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{entry.taskName}</div>
                    <div className="text-xs muted">
                      {new Date(entry.completedAt).toLocaleString()}
                      {" · "}
                      {entry.confirmedBy === "self" ? "self" : `by ${entry.confirmedBy}`}
                    </div>
                  </div>
                  <div className="font-pixel text-[9px] text-yellow-300">
                    +{entry.xpEarned}
                    {entry.chestTriggered && " 🎁"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {user.chestLog.length === 0 ? (
            <div className="panel muted text-sm">No chests looted yet.</div>
          ) : (
            user.chestLog.slice(0, 100).map((entry) => (
              <div key={entry.id} className="panel panel-tight">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">🎁 {entry.reward || "(unclaimed)"}</div>
                    <div className="text-xs muted">
                      {new Date(entry.date).toLocaleString()} · {entry.trigger.replace("_", " ")}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <BackButton />

    </div>
  );
}
