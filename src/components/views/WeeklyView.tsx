"use client";

import { useStore } from "@/lib/store";

export default function WeeklyView() {
  const activeUser = useStore((s) => s.activeUser);
  const user = useStore((s) => s.state.users[s.activeUser]);
  const config = useStore((s) => s.state.config);
  const cycle = useStore((s) => s.state.adultRewardCycle);

  const isAdult = activeUser !== "winter";
  const weekStart = user.weekStartDate;

  // Compute current-week stats from log
  const startMs = new Date(weekStart).getTime();
  const weekTasks = user.taskLog.filter((t) => new Date(t.completedAt).getTime() >= startMs);
  const xpThisWeek = weekTasks.reduce((sum, t) => sum + t.xpEarned, 0);
  const chestsThisWeek = user.chestLog.filter((c) => new Date(c.date).getTime() >= startMs).length;

  return (
    <div className="space-y-3">
      <div className="h2">{user.displayName.toUpperCase()} — WEEKLY</div>
      <div className="muted text-sm">Week of {weekStart}</div>

      <div className="panel space-y-2">
        <div className="flex justify-between">
          <span>XP this week (regular)</span>
          <span className="font-pixel text-[10px] text-yellow-300">{xpThisWeek}</span>
        </div>
        {!isAdult && (
          <div className="flex justify-between">
            <span>Dollars (regular)</span>
            <span className="font-pixel text-[10px] text-yellow-300">
              ${(Math.min(xpThisWeek, config.weeklyXPCap) * config.xpToDollarRate).toFixed(2)}
              {xpThisWeek > config.weeklyXPCap && (
                <span className="muted"> (cap)</span>
              )}
            </span>
          </div>
        )}

        {/* Boss bonus XP — always tracked, never cap-gated for Winter */}
        <div className="flex justify-between">
          <span>⚔️ Boss bonus XP</span>
          <span className="font-pixel text-[10px] text-diamond">
            {user.weeklyBonusXP}
          </span>
        </div>
        {!isAdult && user.weeklyBonusXP > 0 && (
          <div className="flex justify-between">
            <span>Dollars (bonus)</span>
            <span className="font-pixel text-[10px] text-diamond">
              +${(user.weeklyBonusXP * config.xpToDollarRate).toFixed(2)}
            </span>
          </div>
        )}

        {!isAdult && (
          <div className="flex justify-between border-t border-[#4a4a6a] pt-1 mt-1">
            <span className="font-pixel text-[9px]">TOTAL $</span>
            <span className="font-pixel text-[10px] text-yellow-300">
              ${(
                Math.min(xpThisWeek, config.weeklyXPCap) * config.xpToDollarRate +
                user.weeklyBonusXP * config.xpToDollarRate
              ).toFixed(2)}
            </span>
          </div>
        )}

        {isAdult && (
          <div className="flex justify-between">
            <span>Milestone progress</span>
            <span className="font-pixel text-[10px] text-yellow-300">
              {user.currentMilestoneXP} / {config.adultMilestoneThreshold}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tasks completed</span>
          <span className="font-pixel text-[10px] text-yellow-300">{weekTasks.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Chests looted</span>
          <span className="font-pixel text-[10px] text-yellow-300">{chestsThisWeek}</span>
        </div>
        <div className="flex justify-between">
          <span>Lifetime XP</span>
          <span className="font-pixel text-[10px] text-yellow-300">{user.lifetimeXP}</span>
        </div>
        <div className="flex justify-between">
          <span>Current rank</span>
          <span className="font-pixel text-[10px] text-diamond">{user.rank}</span>
        </div>
        {isAdult && (
          <div className="flex justify-between">
            <span>Next reward type</span>
            <span className="font-pixel text-[10px] text-diamond">
              {cycle.currentPosition === "house" ? "🏠 HOUSE" : "🎁 PERSONAL"}
            </span>
          </div>
        )}
      </div>

      {user.weeklySummaries.length > 0 && (
        <div>
          <div className="h3 mb-2">PAST WEEKS</div>
          <div className="space-y-2">
            {user.weeklySummaries
              .slice()
              .reverse()
              .slice(0, 12)
              .map((w) => (
                <div key={w.weekStartDate} className="panel panel-tight">
                  <div className="text-sm">
                    {w.weekStartDate} → {w.weekEndDate}
                  </div>
                  <div className="text-xs muted">
                    XP: {w.xpEarned}
                    {w.bonusXPEarned > 0 && (
                      <span className="text-diamond"> +{w.bonusXPEarned} bonus</span>
                    )}
                    {" · "}
                    ${(w.dollarsEarned + w.bonusDollarsEarned).toFixed(2)}
                    {" · 🎁 "}
                    {w.chestsLooted}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
