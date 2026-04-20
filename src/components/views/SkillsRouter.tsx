"use client";

import { useStore } from "@/lib/store";
import SkillsView from "./SkillsView";
import WinterSkillsView from "./WinterSkillsView";

/**
 * Dispatches to the right skill tree view based on the active user:
 *   - Winter   → new web-based WinterSkillsView
 *   - Adults   → existing branch-based SkillsView
 */
export default function SkillsRouter() {
  const activeUser = useStore((s) => s.activeUser);
  if (activeUser === "winter") return <WinterSkillsView />;
  return <SkillsView />;
}
