"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import ChestDropModal from "./ChestDropModal";
import BossDefeatCelebration from "./BossDefeatCelebration";
import UserSwitcher from "./UserSwitcher";
import LoginGate from "./LoginGate";
import SyncIndicator from "./SyncIndicator";

interface TabDef {
  href: string;
  label: string;
  icon: string;
}

const BASE_TABS: TabDef[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/skills", label: "Skills", icon: "🧱" },
  { href: "/log", label: "Log", icon: "📜" },
];

const WINTER_TAB: TabDef = { href: "/inventory", label: "Loot", icon: "🎒" };
const WISHLIST_TAB: TabDef = { href: "/wishlist", label: "Wish", icon: "🎁" };
const SETTINGS_TAB: TabDef = { href: "/settings", label: "More", icon: "⚙️" };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const rolloverWeekIfNeeded = useStore((s) => s.rolloverWeekIfNeeded);
  const activeUser = useStore((s) => s.activeUser);
  const { data: sessionUser } = useSession();
  const users = useStore((s) => s.state.users);

  const viewingOtherUser =
    sessionUser && sessionUser.role === "parent" && activeUser !== sessionUser.id;

  useEffect(() => {
    rolloverWeekIfNeeded();
  }, [rolloverWeekIfNeeded]);

  // The fourth tab slot changes based on the active user:
  //   - Winter  → Inventory (🎒 Loot)
  //   - Adults  → Wishlist
  const tabs = useMemo<TabDef[]>(() => {
    const fourth = activeUser === "winter" ? WINTER_TAB : WISHLIST_TAB;
    return [...BASE_TABS, fourth, SETTINGS_TAB];
  }, [activeUser]);

  return (
    <LoginGate>
    <div className="min-h-screen flex flex-col">
      <header className="grass-strip px-3 py-2">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-pixel text-[10px] text-white drop-shadow">
                QUEST HOUSE
              </div>
              <SyncIndicator />
            </div>
            <div className="font-pixel text-[8px] text-yellow-100">
              Neurospicy Household Reset
            </div>
          </div>
          <UserSwitcher />
        </div>
      </header>

      {viewingOtherUser && (
        <div
          className="px-3 py-1.5 text-center"
          style={{ background: "#3a2a10", borderBottom: "2px solid #FFD700" }}
        >
          <div className="font-pixel text-[9px] text-yellow-300 max-w-2xl mx-auto">
            {users[sessionUser.id].displayName.toUpperCase()} viewing {users[activeUser].displayName.toUpperCase()}&apos;s account
          </div>
        </div>
      )}

      <main className="main-content flex-1 px-3 py-4 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <nav className="tabbar">
        {tabs.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={active ? "active" : ""}>
              <span className="icon">{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>

      <ChestDropModal />
      <BossDefeatCelebration />
    </div>
    </LoginGate>
  );
}
