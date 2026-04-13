import type { BossDef } from "@/lib/types";

/**
 * Bathroom Slime — 7 tasks, total HP 80.
 *
 * Mob: Slime (🟩)
 * Zone: bathroom_half (the downstairs half bath, NOT Winter's own
 * bathroom — per spec clarification).
 *
 * Links into the `bathroom_half` Winter domain (bh_*) since this is
 * the half bath specifically. Winter's own bathroom (sink zone /
 * behind-the-door) is a separate domain and doesn't get damaged by
 * this boss.
 */
export const BATHROOM_SLIME: BossDef = {
  id: "bathroom_slime",
  name: "The Bathroom Slime",
  mob: "Slime",
  icon: "🟩",
  flavor:
    "It's multiplying near the sink. Bouncing off the mirror. End it.",
  zone: "bathroom_half",
  tasks: [
    {
      id: "bathroom_slime:scrub_sink",
      name: "Scrub sink + counter (deep, not quick wipe)",
      damage: 15,
      xp: 15,
      linkedSkillId: "bh_wipe_sink",
    },
    {
      id: "bathroom_slime:mirror",
      name: "Clean mirror (streak-free)",
      damage: 10,
      xp: 10,
      linkedSkillId: "bh_clean_mirror",
    },
    {
      id: "bathroom_slime:toilet",
      name: "Scrub toilet — outside, seat, lid, bowl",
      damage: 20,
      xp: 20,
      linkedSkillId: "bh_toilet_bowl",
    },
    {
      id: "bathroom_slime:floor",
      name: "Sweep + mop floor",
      damage: 15,
      xp: 15,
      linkedSkillId: "bh_sweep",
    },
    {
      id: "bathroom_slime:restock",
      name: "Restock supplies (TP, soap, towel)",
      damage: 5,
      xp: 5,
      // Unlinked — restocking isn't a Winter skill.
    },
    {
      id: "bathroom_slime:switches",
      name: "Wipe down door handle + light switch",
      damage: 5,
      xp: 5,
      linkedSkillId: "s_wipe_switches",
    },
    {
      id: "bathroom_slime:trash_can",
      name: "Clean trash can (not just empty — wipe it)",
      damage: 10,
      xp: 10,
      linkedSkillId: "bh_trash",
    },
  ],
};
