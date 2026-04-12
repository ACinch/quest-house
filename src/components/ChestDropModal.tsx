"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";

const TRIGGER_LABELS: Record<string, string> = {
  random_drop: "Random drop!",
  boss_level: "Boss Level reward!",
  weekly_cap: "Weekly cap reached!",
  mastery: "Skill mastered!",
  rank_up: "Rank up!",
  manual: "Bonus chest!",
};

export default function ChestDropModal() {
  const pendingChest = useStore((s) => s.pendingChest);
  const resolvePendingChest = useStore((s) => s.resolvePendingChest);
  const dismissPendingChest = useStore((s) => s.dismissPendingChest);
  const pools = useStore((s) => s.state.chestRewardPools);
  const [picked, setPicked] = useState<string>("");
  const [custom, setCustom] = useState<string>("");

  useEffect(() => {
    setPicked("");
    setCustom("");
  }, [pendingChest?.id]);

  const slips = useMemo(() => {
    if (!pendingChest) return [];
    return pools[pendingChest.userId] ?? [];
  }, [pendingChest, pools]);

  if (!pendingChest) return null;

  const drawRandom = () => {
    if (slips.length === 0) return;
    const slip = slips[Math.floor(Math.random() * slips.length)];
    setPicked(slip.text);
  };

  const handleConfirm = () => {
    const reward = (picked || custom || "Mystery reward").trim();
    resolvePendingChest(reward);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="text-center mb-3">
          <div className="text-6xl chest-bounce">🎁</div>
          <div className="h2 mt-2">A TREASURE CHEST APPEARED!</div>
          <div className="muted mt-1 text-sm">
            {TRIGGER_LABELS[pendingChest.trigger] ?? "Loot drop!"}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <button type="button" className="block-btn gold w-full" onClick={drawRandom}>
            🎲 Pull a Slip
          </button>
          {picked && (
            <div className="panel-tight panel text-center text-yellow-200 font-pixel text-[10px]">
              {picked}
            </div>
          )}
          <div className="text-center muted text-sm">— or write it in —</div>
          <input
            className="input"
            placeholder="What was on the slip?"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" className="block-btn ghost flex-1" onClick={dismissPendingChest}>
            Skip
          </button>
          <button type="button" className="block-btn flex-1" onClick={handleConfirm}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
