"use client";

import BackButton from "@/components/BackButton";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function WishlistView() {
  const activeUser = useStore((s) => s.activeUser);
  const user = useStore((s) => s.state.users[s.activeUser]);
  const cycle = useStore((s) => s.state.adultRewardCycle);
  const config = useStore((s) => s.state.config);
  const addHouseWishlistItem = useStore((s) => s.addHouseWishlistItem);
  const removeHouseWishlistItem = useStore((s) => s.removeHouseWishlistItem);
  const addPersonalWishlistItem = useStore((s) => s.addPersonalWishlistItem);
  const removePersonalWishlistItem = useStore((s) => s.removePersonalWishlistItem);
  const redeemMilestone = useStore((s) => s.redeemMilestone);

  const isAdult = activeUser !== "winter";

  const [houseItem, setHouseItem] = useState("");
  const [personalItem, setPersonalItem] = useState("");

  if (!isAdult) {
    return (
      <div className="space-y-3">
        <div className="h2">WINTER'S REWARDS</div>
        <div className="panel space-y-2">
          <div className="text-sm">
            Winter earns{" "}
            <span className="font-pixel text-[10px] text-yellow-300">
              ${(config.weeklyXPCap * config.xpToDollarRate).toFixed(2)}
            </span>{" "}
            max each week, paid to the Greenlight card on Sunday.
          </div>
          <div className="muted text-sm">
            Plus treasure chest drops! Use the chest log to track them.
          </div>
        </div>
        <div className="panel space-y-2">
          <div className="h3">CHEST POOL</div>
          <div className="muted text-sm">
            Manage Winter's chest reward slips in Settings → Chest Pool.
          </div>
        </div>
      </div>
    );
  }

  const milestonesAvailable = user.milestonesEarned;
  const nextType = cycle.currentPosition;

  return (
    <div className="space-y-4">
      <div className="h2">REWARD WISHLIST</div>

      <section className="panel space-y-2">
        <div className="flex justify-between">
          <div className="h3">NEXT REWARD</div>
          <span className="font-pixel text-[10px] text-diamond">
            {nextType === "house" ? "🏠 HOUSE" : "🎁 PERSONAL"}
          </span>
        </div>
        <div className="text-sm">
          Milestones banked:{" "}
          <span className="font-pixel text-[10px] text-yellow-300">{milestonesAvailable}</span>
        </div>
        {milestonesAvailable > 0 && (
          <div className="text-xs muted">Pick something to redeem below 👇</div>
        )}
      </section>

      <section className="panel space-y-2">
        <div className="h3">🏠 HOUSE WISHLIST (SHARED)</div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. shoe shelf for entryway"
            value={houseItem}
            onChange={(e) => setHouseItem(e.target.value)}
          />
          <button
            type="button"
            className="block-btn"
            onClick={() => {
              if (houseItem.trim()) {
                addHouseWishlistItem(houseItem.trim());
                setHouseItem("");
              }
            }}
          >
            Add
          </button>
        </div>
        <ul className="space-y-1">
          {cycle.houseWishlist.length === 0 && (
            <li className="muted text-sm">No house items yet.</li>
          )}
          {cycle.houseWishlist.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 panel-tight panel">
              <div className={item.earned ? "line-through muted" : ""}>{item.name}</div>
              <div className="flex gap-1">
                {!item.earned && nextType === "house" && milestonesAvailable > 0 && (
                  <button
                    type="button"
                    className="block-btn gold"
                    onClick={() => redeemMilestone(activeUser, item.name)}
                  >
                    Redeem
                  </button>
                )}
                <button
                  type="button"
                  className="block-btn ghost"
                  onClick={() => removeHouseWishlistItem(item.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel space-y-2">
        <div className="h3">🎁 {user.displayName.toUpperCase()}'S PERSONAL WISHLIST</div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. fancy headphones"
            value={personalItem}
            onChange={(e) => setPersonalItem(e.target.value)}
          />
          <button
            type="button"
            className="block-btn"
            onClick={() => {
              if (personalItem.trim()) {
                addPersonalWishlistItem(activeUser, personalItem.trim());
                setPersonalItem("");
              }
            }}
          >
            Add
          </button>
        </div>
        <ul className="space-y-1">
          {user.rewardWishlist.length === 0 && (
            <li className="muted text-sm">No personal items yet.</li>
          )}
          {user.rewardWishlist.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 panel-tight panel">
              <div className={item.earned ? "line-through muted" : ""}>{item.name}</div>
              <div className="flex gap-1">
                {!item.earned && nextType === "personal" && milestonesAvailable > 0 && (
                  <button
                    type="button"
                    className="block-btn gold"
                    onClick={() => redeemMilestone(activeUser, item.name)}
                  >
                    Redeem
                  </button>
                )}
                <button
                  type="button"
                  className="block-btn ghost"
                  onClick={() => removePersonalWishlistItem(activeUser, item.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {cycle.rewardLog.length > 0 && (
        <section>
          <div className="h3 mb-2">REDEEMED REWARDS</div>
          <div className="space-y-1">
            {cycle.rewardLog
              .slice()
              .reverse()
              .map((r) => (
                <div key={r.id} className="panel panel-tight text-sm">
                  <span className="font-pixel text-[8px] text-yellow-300 mr-2">
                    {r.type === "house" ? "🏠" : "🎁"}
                  </span>
                  {r.item}{" "}
                  <span className="muted text-xs">— {new Date(r.date).toLocaleDateString()}</span>
                </div>
              ))}
          </div>
        </section>
      )}
      <BackButton />

    </div>
  );
}
