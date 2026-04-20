"use client";

import BackButton from "@/components/BackButton";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { UserId } from "@/lib/types";

const ORDER: UserId[] = ["winter", "rebekah", "maarten"];

export default function ChestPoolView() {
  const pools = useStore((s) => s.state.chestRewardPools);
  const users = useStore((s) => s.state.users);
  const addChestSlip = useStore((s) => s.addChestSlip);
  const removeChestSlip = useStore((s) => s.removeChestSlip);
  const triggerChest = useStore((s) => s.triggerChest);

  const [selectedUser, setSelectedUser] = useState<UserId>("winter");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Custom");

  return (
    <div className="space-y-3">
      <div className="h2">CHEST REWARD POOL</div>
      <div className="muted text-sm">
        Edit the slips that get drawn when a chest drops.
      </div>

      <div className="flex gap-2">
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`block-btn ${selectedUser === id ? "" : "ghost"} flex-1`}
            onClick={() => setSelectedUser(id)}
          >
            {users[id].displayName}
          </button>
        ))}
      </div>

      <section className="panel space-y-2">
        <div className="h3">ADD A SLIP</div>
        <input
          className="input"
          placeholder="Reward text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          className="input"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button
          type="button"
          className="block-btn"
          onClick={() => {
            if (text.trim()) {
              addChestSlip(selectedUser, text.trim(), category.trim() || "Custom");
              setText("");
            }
          }}
        >
          ➕ Add
        </button>
      </section>

      <section className="space-y-2">
        <div className="h3">{users[selectedUser].displayName.toUpperCase()}'S SLIPS ({pools[selectedUser].length})</div>
        {pools[selectedUser].map((slip) => (
          <div key={slip.id} className="panel panel-tight">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <div className="text-sm">{slip.text}</div>
                <div className="text-xs muted">{slip.category}</div>
              </div>
              <button
                type="button"
                className="block-btn danger"
                onClick={() => removeChestSlip(selectedUser, slip.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel space-y-2">
        <div className="h3">MANUAL CHEST DROP</div>
        <div className="text-sm muted">
          Need to award a bonus chest? Drop one for {users[selectedUser].displayName}.
        </div>
        <button
          type="button"
          className="block-btn gold"
          onClick={() => triggerChest({ userId: selectedUser, trigger: "manual" })}
        >
          🎁 Drop a Chest
        </button>
      </section>
      <BackButton />

    </div>
  );
}
