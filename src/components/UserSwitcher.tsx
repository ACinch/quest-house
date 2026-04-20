"use client";

import { useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { UserId } from "@/lib/types";

const SKINS: Record<UserId, string> = {
  winter: "❄️",
  rebekah: "👩‍🌾",
  maarten: "🧔‍♂️",
};

/**
 * Switches the "viewing user" for the dashboard and other per-user
 * views. Constrained by the signed-in user's role per spec Q6 = A
 * (hard lock):
 *
 *   - Winter (child)  → can only view Winter's dashboard
 *   - Rebekah (parent) → can view Rebekah + Winter (not Maarten)
 *   - Maarten (parent) → can view Maarten + Winter (not Rebekah)
 *
 * If the persisted activeUser doesn't match a visible slot (e.g. a
 * device switches accounts and the store still points at the other
 * parent), we auto-correct to the session user on mount.
 */
export default function UserSwitcher() {
  const activeUser = useStore((s) => s.activeUser);
  const users = useStore((s) => s.state.users);
  const setActiveUser = useStore((s) => s.setActiveUser);
  const { data: sessionUser } = useSession();

  // Slots visible to the current signed-in user.
  const visible = useMemo<UserId[]>(() => {
    if (!sessionUser) return [];
    if (sessionUser.role === "child") return ["winter"];
    // Parent: self + Winter (always in the order [winter, self]).
    if (sessionUser.id === "winter") return ["winter"];
    return ["winter", sessionUser.id];
  }, [sessionUser]);

  // Auto-correct activeUser if it points somewhere the session can't see.
  useEffect(() => {
    if (visible.length === 0) return;
    if (!visible.includes(activeUser)) {
      setActiveUser(sessionUser?.id ?? "winter");
    }
  }, [visible, activeUser, sessionUser, setActiveUser]);

  if (visible.length <= 1) {
    // Single-slot — no point rendering buttons. Just show the user badge.
    const id = visible[0] ?? sessionUser?.id ?? "winter";
    return (
      <div className="pixel-border bg-[#2a2a3e] px-2 py-1">
        <div className="text-xl leading-none">{SKINS[id]}</div>
        <div className="font-pixel text-[7px] mt-0.5 text-center">
          {users[id].displayName.toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {visible.map((id) => {
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
