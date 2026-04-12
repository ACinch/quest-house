"use client";

const RANK_ICONS: Record<string, string> = {
  Noob: "🟫",
  Apprentice: "🟩",
  Journeyman: "🪨",
  Expert: "🟨",
  "Diamond Rank": "💎",
  "Netherite Legend": "🖤",
};

export default function RankBadge({ rank }: { rank: string }) {
  return (
    <div className="pixel-border bg-[#2a2a3e] inline-flex items-center gap-2 px-2 py-1">
      <span className="text-base">{RANK_ICONS[rank] ?? "⬛"}</span>
      <span className="font-pixel text-[8px]">{rank.toUpperCase()}</span>
    </div>
  );
}
