"use client";

import { useStore } from "@/lib/store";
import { UserId } from "@/lib/types";

const SKINS: Record<UserId, string> = {
  winter: "❄️",
  rebekah: "👩‍🌾",
  maarten: "🧔‍♂️",
};

const ORDER: UserId[] = ["winter", "rebekah", "maarten"];

export default function UserSwitcher() {
  const activeUser = useStore((s) => s.activeUser);
  const users = useStore((s) => s.state.users);
  const setActiveUser = useStore((s) => s.setActiveUser);

  return (
    <div className="flex gap-1">
      {ORDER.map((id) => {
        const isActive = activeUser === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveUser(id)}
            className={`pixel-border px-2 py-1 ${
              isActive ? "bg-yellow-500 text-obsidian" : "bg-[#2a2a3e] text-white"
            }`}
            aria-label={`Switch to ${users[id].displayName}`}
          >
            <div className="text-xl leading-none">{SKINS[id]}</div>
            <div className="font-pixel text-[7px] mt-0.5">
              {users[id].displayName.toUpperCase()}
            </div>
          </button>
        );
      })}
    </div>
  );
}
