"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import ChestDropModal from "./ChestDropModal";
import UserSwitcher from "./UserSwitcher";
import LoginGate from "./LoginGate";
import SyncIndicator from "./SyncIndicator";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/skills", label: "Skills", icon: "🧱" },
  { href: "/log", label: "Log", icon: "📜" },
  { href: "/wishlist", label: "Wish", icon: "🎁" },
  { href: "/settings", label: "More", icon: "⚙️" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const rolloverWeekIfNeeded = useStore((s) => s.rolloverWeekIfNeeded);

  useEffect(() => {
    rolloverWeekIfNeeded();
  }, [rolloverWeekIfNeeded]);

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

      <main className="main-content flex-1 px-3 py-4 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => {
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
    </div>
    </LoginGate>
  );
}
