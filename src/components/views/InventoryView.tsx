"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useIsParent } from "@/lib/auth-client";
import { CHEST_TIER_META, CHEST_TIER_ORDER } from "@/lib/data/winter-chest-pool";
import type { ChestTier, InventoryItem } from "@/lib/types";

/**
 * Winter's inventory — the bankable chest reward grid.
 *
 * Each reward drawn from a chest lands here and stays until redeemed.
 * Rewards are grouped by tier so the visual rarity is obvious at a
 * glance. Redeemed rewards stay visible but dimmed (history).
 *
 * Per spec Q7 = b, tier icons are reused across all rewards in a
 * given tier — no custom per-reward art. The category shows up as a
 * small subtitle under the reward text.
 *
 * Wildcard slips ("Extra pull from tier of choice") can't be
 * redeemed directly — tapping one opens a tier picker that calls
 * resolveWildcardSlip with the chosen tier.
 */

export default function InventoryView() {
  const user = useStore((s) => s.state.users.winter);
  const redeemInventoryItem = useStore((s) => s.redeemInventoryItem);
  const resolveWildcardSlip = useStore((s) => s.resolveWildcardSlip);
  const isParent = useIsParent();
  const parentGrantWinterChest = useStore((s) => s.parentGrantWinterChest);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wildcardTarget, setWildcardTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "redeemed">(
    "available"
  );

  const inventory = user.inventory ?? [];
  const filtered = inventory.filter((item) => {
    if (filter === "all") return true;
    if (filter === "available") return !item.redeemed;
    return item.redeemed;
  });

  // Group by tier for display.
  const byTier: Record<ChestTier, InventoryItem[]> = {
    stone: [],
    iron: [],
    gold: [],
    diamond: [],
    netherite: [],
  };
  for (const item of filtered) byTier[item.tier].push(item);

  const totalAvailable = inventory.filter((i) => !i.redeemed).length;
  const totalRedeemed = inventory.filter((i) => i.redeemed).length;

  return (
    <div className="space-y-3">
      <div className="h2">INVENTORY</div>

      <section className="panel space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-pixel text-[10px] text-yellow-300">
              {totalAvailable} READY
            </div>
            <div className="text-xs muted">
              {totalRedeemed} redeemed · {inventory.length} total
            </div>
          </div>
          <div className="text-4xl">🎒</div>
        </div>

        <div className="flex gap-1">
          {(["available", "all", "redeemed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`block-btn ${filter === f ? "" : "ghost"} flex-1`}
              onClick={() => setFilter(f)}
            >
              {f === "available" ? "Ready" : f === "all" ? "All" : "Used"}
            </button>
          ))}
        </div>
      </section>

      {inventory.length === 0 && (
        <div className="panel muted text-sm text-center">
          Your inventory is empty. Complete skills to earn treasure chests!
        </div>
      )}

      {CHEST_TIER_ORDER.map((tier) => {
        const items = byTier[tier];
        if (items.length === 0) return null;
        const meta = CHEST_TIER_META[tier];
        return (
          <section key={tier} className="panel space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{meta.icon}</span>
                <div className="font-pixel text-[10px]" style={{ color: meta.color }}>
                  {meta.displayName.toUpperCase()}
                </div>
              </div>
              <div className="text-xs muted">{items.length}</div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map((item) => (
                <InventorySlot
                  key={item.id}
                  item={item}
                  onTap={() => {
                    if (item.redeemed) return;
                    if (item.wildcardKind === "tier_choice") {
                      setWildcardTarget(item.id);
                    } else {
                      setSelectedId(item.id);
                    }
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}

      {isParent && (
        <section className="panel space-y-2">
          <div className="h3">🎁 PARENT: GRANT BONUS CHEST</div>
          <div className="text-xs muted">
            Drop a tier-specific bonus chest into Winter&apos;s inventory for
            exceptional effort.
          </div>
          <div className="grid grid-cols-5 gap-1">
            {CHEST_TIER_ORDER.map((tier) => {
              const meta = CHEST_TIER_META[tier];
              return (
                <button
                  key={tier}
                  type="button"
                  className="pixel-border p-1 text-center"
                  style={{ background: meta.color }}
                  onClick={() => parentGrantWinterChest(tier, "bonus_grant")}
                  title={`Grant a ${meta.displayName} chest`}
                >
                  <div className="text-xl leading-none">{meta.icon}</div>
                  <div className="font-pixel text-[7px] text-black mt-0.5">
                    {meta.displayName.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Redeem confirmation */}
      {selectedId && (
        <RedeemModal
          itemId={selectedId}
          onClose={() => setSelectedId(null)}
          onConfirm={() => {
            redeemInventoryItem(selectedId);
            setSelectedId(null);
          }}
        />
      )}

      {/* Wildcard tier picker */}
      {wildcardTarget && (
        <WildcardPickerModal
          itemId={wildcardTarget}
          onClose={() => setWildcardTarget(null)}
          onConfirm={(tier) => {
            resolveWildcardSlip(wildcardTarget, tier);
            setWildcardTarget(null);
          }}
        />
      )}
    </div>
  );
}

// ==================================================================
// Inventory slot (a single reward cell)
// ==================================================================

function InventorySlot({
  item,
  onTap,
}: {
  item: InventoryItem;
  onTap: () => void;
}) {
  const meta = CHEST_TIER_META[item.tier];
  const dim = item.redeemed;
  const wildcard = item.wildcardKind === "tier_choice" && !item.redeemed;
  return (
    <button
      type="button"
      className="pixel-border p-2 text-left"
      style={{
        background: dim ? "#1a1a2e" : "#2a2a3e",
        borderColor: dim ? "#4a4a6a" : meta.color,
        opacity: dim ? 0.45 : 1,
        minHeight: 110,
      }}
      onClick={onTap}
      disabled={dim}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-2xl"
          style={{ filter: dim ? "grayscale(1)" : undefined }}
        >
          {wildcard ? "🎲" : meta.icon}
        </div>
        {dim && <div className="text-[8px] muted">USED</div>}
      </div>
      <div
        className="text-[11px] leading-tight mt-1"
        style={{ color: dim ? "#6a6a80" : "#f5f5f5" }}
      >
        {item.reward}
      </div>
      <div className="text-[8px] muted mt-1">{item.category}</div>
    </button>
  );
}

// ==================================================================
// Modals
// ==================================================================

function RedeemModal({
  itemId,
  onClose,
  onConfirm,
}: {
  itemId: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const item = useStore((s) =>
    s.state.users.winter.inventory?.find((i) => i.id === itemId)
  );
  if (!item) return null;
  const meta = CHEST_TIER_META[item.tier];
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal space-y-3">
        <div className="text-center">
          <div className="text-5xl">{meta.icon}</div>
          <div
            className="font-pixel text-[10px] mt-2"
            style={{ color: meta.color }}
          >
            {meta.displayName.toUpperCase()} REWARD
          </div>
        </div>
        <div className="panel panel-tight text-center">
          <div className="text-sm">{item.reward}</div>
          <div className="text-xs muted">{item.category}</div>
        </div>
        <div className="text-sm muted text-center">
          Use this reward now?
        </div>
        <div className="flex gap-2">
          <button type="button" className="block-btn ghost flex-1" onClick={onClose}>
            Not yet
          </button>
          <button type="button" className="block-btn gold flex-1" onClick={onConfirm}>
            Use it!
          </button>
        </div>
      </div>
    </div>
  );
}

function WildcardPickerModal({
  itemId,
  onClose,
  onConfirm,
}: {
  itemId: string;
  onClose: () => void;
  onConfirm: (tier: ChestTier) => void;
}) {
  const item = useStore((s) =>
    s.state.users.winter.inventory?.find((i) => i.id === itemId)
  );
  if (!item) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal space-y-3">
        <div className="text-center">
          <div className="text-5xl">🎲</div>
          <div className="font-pixel text-[10px] mt-2 text-yellow-300">
            WILDCARD PULL
          </div>
        </div>
        <div className="text-sm muted text-center">
          Pick a tier. You&apos;ll get a random reward from that tier.
        </div>
        <div className="grid grid-cols-1 gap-2">
          {CHEST_TIER_ORDER.map((tier) => {
            const meta = CHEST_TIER_META[tier];
            return (
              <button
                key={tier}
                type="button"
                className="pixel-border p-2 flex items-center gap-2"
                style={{ background: meta.color }}
                onClick={() => onConfirm(tier)}
              >
                <span className="text-2xl">{meta.icon}</span>
                <span className="font-pixel text-[10px] text-black">
                  {meta.displayName.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" className="block-btn ghost w-full" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
