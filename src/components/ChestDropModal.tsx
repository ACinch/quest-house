"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { CHEST_TIER_META } from "@/lib/data/winter-chest-pool";

const TRIGGER_LABELS: Record<string, string> = {
  random_drop: "Random drop!",
  boss_level: "Boss Level reward!",
  weekly_cap: "Weekly cap reached!",
  mastery: "Skill mastered!",
  rank_up: "Rank up!",
  manual: "Bonus chest!",
};

/**
 * Chest drop modal — fires when `pendingChest` is set on the store.
 *
 * Two paths depending on the user:
 *
 * WINTER: the chest already has a tier and reward baked in (rolled
 * from the tiered pool in completeWinterSkill). We show the tier
 * banner, reveal the reward text, and a single "Cool!" button that
 * dismisses the modal. The reward is already in inventory so there's
 * nothing to save.
 *
 * ADULTS: the original flat-pool flow. Pull a random slip from the
 * adult's chest pool (physical-jar companion) or type in a custom
 * reward, then Save to log it to the chest history.
 */
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

  // Winter path: tier + reward pre-baked.
  if (pendingChest.userId === "winter" && pendingChest.tier) {
    const meta = CHEST_TIER_META[pendingChest.tier];
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal space-y-3">
          <div className="text-center">
            <div className="text-6xl chest-bounce">{meta.icon}</div>
            <div
              className="font-pixel text-[11px] mt-2"
              style={{ color: meta.color }}
            >
              {meta.displayName.toUpperCase()} CHEST
            </div>
            <div className="muted text-xs mt-1">
              {TRIGGER_LABELS[pendingChest.trigger] ?? "Loot drop!"}
            </div>
          </div>

          <div
            className="panel panel-tight text-center"
            style={{
              borderColor: meta.color,
              background: "#2a2a3e",
            }}
          >
            <div className="font-pixel text-[9px] text-yellow-200 mb-1">
              YOU GOT
            </div>
            <div className="text-sm">{pendingChest.reward}</div>
          </div>

          <div className="muted text-xs text-center">
            Added to your inventory.
          </div>

          <div className="flex gap-2">
            <Link
              href="/inventory"
              className="block-btn alt flex-1 text-center"
              onClick={() => dismissPendingChest()}
            >
              View Inventory
            </Link>
            <button
              type="button"
              className="block-btn gold flex-1"
              onClick={() => dismissPendingChest()}
            >
              Cool!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Adult path: flat-pool manual entry (unchanged).
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
