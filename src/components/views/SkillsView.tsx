"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { branchesForUserWithCustom } from "@/lib/skills";
import { Skill, SkillBranch } from "@/lib/types";

export default function SkillsView() {
  const activeUser = useStore((s) => s.activeUser);
  const customQuests = useStore((s) => s.state.config.customQuests);
  const masteryThreshold = useStore((s) => s.state.config.masteryThreshold);
  const userSkills = useStore((s) => s.state.users[s.activeUser].skills);
  const completeTask = useStore((s) => s.completeTask);

  const branches = useMemo(
    () => branchesForUserWithCustom(activeUser, customQuests),
    [activeUser, customQuests]
  );

  const [openBranch, setOpenBranch] = useState<string | null>(branches[0]?.id ?? null);

  return (
    <div className="space-y-3">
      <div className="h2">SKILL TREE</div>
      <div className="muted text-sm">
        {branches.length} branches · master skills (×{masteryThreshold}) to unlock the next.
      </div>

      <div className="space-y-3">
        {branches.map((branch) => {
          const isOpen = openBranch === branch.id;
          const skillStates = userSkills[branch.id] || {};
          const masteredCount = Object.values(skillStates).filter((s) => s.mastered).length;
          return (
            <div key={branch.id} className="panel space-y-2">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 text-left"
                onClick={() => setOpenBranch(isOpen ? null : branch.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{branch.icon}</span>
                  <div>
                    <div className="font-pixel text-[11px] text-yellow-300">
                      {branch.name.toUpperCase()}
                    </div>
                    <div className="text-xs muted">{branch.description}</div>
                  </div>
                </div>
                <div className="text-sm muted">
                  {masteredCount}/{branch.skills.length}
                </div>
              </button>

              {isOpen && (
                <BranchSkills
                  branch={branch}
                  skillStates={skillStates}
                  masteryThreshold={masteryThreshold}
                  onComplete={(skillId) =>
                    completeTask({
                      userId: activeUser,
                      branchId: branch.id,
                      skillId,
                      confirmedBy: activeUser !== "winter" ? "self" : "mom",
                    })
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BranchSkills({
  branch,
  skillStates,
  masteryThreshold,
  onComplete,
}: {
  branch: SkillBranch;
  skillStates: Record<string, { unlocked: boolean; mastered: boolean; completions: number }>;
  masteryThreshold: number;
  onComplete: (skillId: string) => void;
}) {
  const sorted = [...branch.skills].sort((a, b) => a.order - b.order);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {sorted.map((skill) => {
        const state = skillStates[skill.id] || { unlocked: false, mastered: false, completions: 0 };
        const progress = Math.min(state.completions, masteryThreshold);
        const className = state.mastered
          ? "skill-node mastered"
          : state.unlocked
          ? "skill-node unlocked"
          : "skill-node locked";
        return (
          <button
            key={skill.id}
            type="button"
            className={className}
            disabled={!state.unlocked}
            onClick={() => state.unlocked && onComplete(skill.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[9px] text-yellow-200">
                  {state.mastered ? "★ " : ""}
                  {skill.name.toUpperCase()}
                </div>
                <div className="text-sm">{skill.description}</div>
                <div className="text-xs italic muted">"{skill.flavor}"</div>
                <ProgressDots progress={progress} max={masteryThreshold} />
              </div>
              <div className="text-right">
                <div className="font-pixel text-[8px] text-yellow-300">+{skill.xp}</div>
                {!state.unlocked && <div className="text-xl">🔒</div>}
                {skill.type && (
                  <div className="text-[10px] muted mt-1">{skill.type}</div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ProgressDots({ progress, max }: { progress: number; max: number }) {
  return (
    <div className="flex gap-0.5 mt-1 flex-wrap">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 ${i < progress ? "bg-yellow-300" : "bg-[#0d0d18]"} border border-black`}
        />
      ))}
    </div>
  );
}
