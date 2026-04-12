"use client";

import { manualSync, useSyncStore } from "@/lib/sync";

const LABELS: Record<string, { text: string; color: string; icon: string }> = {
  idle: { text: "idle", color: "#b6b6c8", icon: "⚪" },
  loading: { text: "loading", color: "#87CEEB", icon: "⏳" },
  syncing: { text: "syncing", color: "#FFD700", icon: "↻" },
  synced: { text: "synced", color: "#5D8C3E", icon: "✓" },
  error: { text: "error", color: "#FF5555", icon: "⚠" },
  offline: { text: "offline", color: "#FF5555", icon: "✕" },
  unauthorized: { text: "logged out", color: "#FF5555", icon: "🔒" },
  "needs-config": { text: "no blob", color: "#b6b6c8", icon: "💾" },
};

export default function SyncIndicator() {
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const errorMessage = useSyncStore((s) => s.errorMessage);
  const meta = LABELS[status] ?? LABELS.idle;

  const title = errorMessage
    ? `${meta.text}: ${errorMessage}`
    : lastSyncedAt
    ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
    : meta.text;

  const canRetry = status === "offline" || status === "error" || status === "synced";

  return (
    <button
      type="button"
      className="pixel-border bg-[#0d0d18] inline-flex items-center gap-1 px-2 py-1 cursor-pointer"
      title={title}
      onClick={() => {
        if (canRetry) void manualSync();
      }}
      aria-label={`Sync status: ${meta.text}`}
    >
      <span style={{ color: meta.color }} className="font-pixel text-[8px]">
        {meta.icon}
      </span>
      <span style={{ color: meta.color }} className="font-pixel text-[7px] hidden sm:inline">
        {meta.text.toUpperCase()}
      </span>
    </button>
  );
}
