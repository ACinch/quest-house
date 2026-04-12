import { Skill, SkillBranch, UserId } from "./types";

export const RANKS: { min: number; name: string }[] = [
  { min: 0, name: "Noob" },
  { min: 100, name: "Apprentice" },
  { min: 250, name: "Journeyman" },
  { min: 500, name: "Expert" },
  { min: 1000, name: "Diamond Rank" },
  { min: 2000, name: "Netherite Legend" },
];

export function rankFor(xp: number): string {
  let rank = RANKS[0].name;
  for (const r of RANKS) {
    if (xp >= r.min) rank = r.name;
  }
  return rank;
}

const ALL: UserId[] = ["winter", "mom", "maarten"];
const ADULTS: UserId[] = ["mom", "maarten"];
const WINTER_ONLY: UserId[] = ["winter"];

export const SKILL_BRANCHES: SkillBranch[] = [
  // ==== WINTER BRANCHES ====
  {
    id: "kitchen_arts",
    name: "Kitchen Arts",
    icon: "🍳",
    description: "Master the cookfire and crafting tables.",
    users: WINTER_ONLY,
    skills: [
      { id: "chest_sorter", branchId: "kitchen_arts", name: "Chest Sorter", flavor: "Sorting items into the right chests", description: "Put away clean dishes", xp: 5, order: 1 },
      { id: "potion_cleanup", branchId: "kitchen_arts", name: "Potion Cleanup", flavor: "Clearing the brewing station", description: "Wipe down counters after meals", xp: 8, order: 2 },
      { id: "furnace_loader", branchId: "kitchen_arts", name: "Furnace Loader", flavor: "Loading the furnace efficiently", description: "Load the dishwasher properly", xp: 10, order: 3 },
      { id: "crop_harvester", branchId: "kitchen_arts", name: "Crop Harvester", flavor: "Harvesting and replanting", description: "Clear/wipe dining table completely", xp: 8, order: 4 },
      { id: "master_chef", branchId: "kitchen_arts", name: "Master Chef", flavor: "Running the whole kitchen", description: "Full kitchen tidy (counters + dishes + table + sweep)", xp: 25, order: 5 },
    ],
  },
  {
    id: "waste_management",
    name: "Waste Management",
    icon: "🗑️",
    description: "Run the disposal network like a pro.",
    users: WINTER_ONLY,
    skills: [
      { id: "minecart_runner", branchId: "waste_management", name: "Minecart Runner", flavor: "Moving cargo between stations", description: "Take kitchen trash to big can outside", xp: 5, order: 1 },
      { id: "recycling_sorter", branchId: "waste_management", name: "Recycling Sorter", flavor: "Sorting materials at the sorting station", description: "Separate recycling correctly", xp: 8, order: 2 },
      { id: "trash_night_captain", branchId: "waste_management", name: "Trash Night Captain", flavor: "The weekly shipment goes out", description: "Take all bins to the street on trash night", xp: 12, order: 3 },
      { id: "waste_boss", branchId: "waste_management", name: "Waste Boss", flavor: "Managing the whole disposal network", description: "Handle all trash + recycling for the day", xp: 20, order: 4 },
    ],
  },
  {
    id: "laundry_mastery",
    name: "Laundry Mastery",
    icon: "👕",
    description: "Run the textile production chain.",
    users: WINTER_ONLY,
    skills: [
      { id: "armor_sorter", branchId: "laundry_mastery", name: "Armor Sorter", flavor: "Sorting armor by type", description: "Sort laundry by color/type", xp: 5, order: 1 },
      { id: "armor_display", branchId: "laundry_mastery", name: "Armor Display", flavor: "Placing armor on stands", description: "Hang clothes properly", xp: 5, order: 2 },
      { id: "inventory_stacker", branchId: "laundry_mastery", name: "Inventory Stacker", flavor: "Stacking items neatly", description: "Fold laundry", xp: 5, order: 3 },
      { id: "washing_machine_operator", branchId: "laundry_mastery", name: "Washing Machine Operator", flavor: "Running the ore washer", description: "Start a load of laundry (with help initially)", xp: 10, order: 4 },
      { id: "dryer_transfer", branchId: "laundry_mastery", name: "Dryer Transfer", flavor: "Moving smelted items to storage", description: "Move laundry from washer to dryer", xp: 8, order: 5 },
      { id: "laundry_lord", branchId: "laundry_mastery", name: "Laundry Lord", flavor: "Full textile production chain", description: "Complete laundry cycle start to finish", xp: 25, order: 6 },
    ],
  },
  {
    id: "surface_ops_winter",
    name: "Surface Ops",
    icon: "🧹",
    description: "Keep the base spotless.",
    users: WINTER_ONLY,
    skills: [
      { id: "floor_sweeper", branchId: "surface_ops_winter", name: "Floor Sweeper", flavor: "Clearing the mine floor", description: "Sweep one room (kitchen, bonus room, etc.)", xp: 8, order: 1 },
      { id: "table_wiper", branchId: "surface_ops_winter", name: "Table Wiper", flavor: "Polishing the enchantment table", description: "Wipe down all surfaces in a room", xp: 8, order: 2 },
      { id: "vacuum_operator", branchId: "surface_ops_winter", name: "Vacuum Operator", flavor: "Deploying the iron golem", description: "Vacuum one room", xp: 10, order: 3 },
      { id: "bathroom_apprentice", branchId: "surface_ops_winter", name: "Bathroom Apprentice", flavor: "Potion room maintenance", description: "Wipe down the half bath (sink, counter, mirror)", xp: 12, order: 4 },
      { id: "surface_commander", branchId: "surface_ops_winter", name: "Surface Commander", flavor: "Base maintenance chief", description: "Full surface clean of an assigned room", xp: 20, order: 5 },
    ],
  },
  {
    id: "boss_levels_winter",
    name: "Boss Levels",
    icon: "⚔️",
    description: "Big quests. Big XP. Guaranteed loot.",
    users: WINTER_ONLY,
    nonSequential: true,
    skills: [
      { id: "bonus_room_raid", branchId: "boss_levels_winter", name: "Bonus Room Raid", flavor: "Clearing a dungeon room", description: "Help sort the bonus room (1-hour sprint)", xp: 40, order: 1, nonSequential: true },
      { id: "donation_chest_sorter", branchId: "boss_levels_winter", name: "Donation Chest Sorter", flavor: "Separating dungeon loot", description: "Help re-sort the donation pile", xp: 30, order: 2, nonSequential: true },
      { id: "toy_rotation_master", branchId: "boss_levels_winter", name: "Toy Rotation Master", flavor: "Swapping ender chest contents", description: "Help execute a toy rotation swap", xp: 20, order: 3, nonSequential: true },
      { id: "craft_drawer_reset", branchId: "boss_levels_winter", name: "Craft Drawer Reset", flavor: "Re-organizing the crafting table", description: "Re-sort the 3-tier craft/school drawers", xp: 25, order: 4, nonSequential: true },
      { id: "deep_clean_champion", branchId: "boss_levels_winter", name: "Deep Clean Champion", flavor: "Defeating the Ender Dragon", description: "Participate in a full deep-clean session", xp: 50, order: 5, nonSequential: true },
    ],
  },

  // ==== MOM BRANCHES ====
  {
    id: "mom_kitchen_arts",
    name: "Kitchen Arts",
    icon: "🍳",
    description: "Command the kitchen.",
    users: ["mom"],
    skills: [
      { id: "counter_commander", branchId: "mom_kitchen_arts", name: "Counter Commander", flavor: "Commanding the counters", description: "Clear and wipe a counter zone", xp: 8, order: 1 },
      { id: "dish_master", branchId: "mom_kitchen_arts", name: "Dish Master", flavor: "Ruling the dish kingdom", description: "Run a full dish cycle", xp: 10, order: 2 },
      { id: "appliance_warden", branchId: "mom_kitchen_arts", name: "Appliance Warden", flavor: "Tending the magical machines", description: "Wipe stove, microwave, sink", xp: 12, order: 3 },
      { id: "kitchen_overlord", branchId: "mom_kitchen_arts", name: "Kitchen Overlord", flavor: "Total kitchen domination", description: "Full kitchen reset", xp: 25, order: 4 },
    ],
  },
  {
    id: "mom_surface_ops",
    name: "Surface Ops",
    icon: "🧹",
    description: "Floors and surfaces stay shiny.",
    users: ["mom"],
    skills: [
      { id: "table_wiper", branchId: "mom_surface_ops", name: "Table Wiper", flavor: "Polishing the enchantment table", description: "Wipe surfaces in a room", xp: 8, order: 1 },
      { id: "floor_sweeper", branchId: "mom_surface_ops", name: "Floor Sweeper", flavor: "Clearing the mine floor", description: "Sweep one room", xp: 8, order: 2 },
      { id: "vacuum_operator", branchId: "mom_surface_ops", name: "Vacuum Operator", flavor: "Deploying the iron golem", description: "Vacuum one room", xp: 10, order: 3 },
      { id: "surface_commander", branchId: "mom_surface_ops", name: "Surface Commander", flavor: "Base maintenance chief", description: "Full surface clean of a room", xp: 20, order: 4 },
    ],
  },
  {
    id: "mom_bathroom_ops",
    name: "Bathroom Ops",
    icon: "🚽",
    description: "The half-bath stays habitable.",
    users: ["mom"],
    skills: [
      { id: "sink_shiner", branchId: "mom_bathroom_ops", name: "Sink Shiner", flavor: "Polishing the basin", description: "Wipe sink, counter, mirror", xp: 8, order: 1 },
      { id: "toilet_tamer", branchId: "mom_bathroom_ops", name: "Toilet Tamer", flavor: "Subduing the porcelain beast", description: "Clean toilet inside and out", xp: 12, order: 2 },
      { id: "bathroom_boss", branchId: "mom_bathroom_ops", name: "Bathroom Boss", flavor: "Total command of the loo", description: "Full half-bath reset + restock", xp: 18, order: 3 },
    ],
  },
  {
    id: "mom_maintenance_planning",
    name: "Maintenance Planning",
    icon: "📐",
    description: "Build the systems that keep the house alive.",
    users: ["mom"],
    nonSequential: true,
    skills: [
      { id: "system_architect", branchId: "mom_maintenance_planning", name: "System Architect", flavor: "Designing the redstone contraption", description: "Design or update a household system", xp: 15, order: 1, nonSequential: true },
      { id: "sprint_planner", branchId: "mom_maintenance_planning", name: "Sprint Planner", flavor: "Plotting the next raid", description: "Plan the week's sprints", xp: 10, order: 2, nonSequential: true },
      { id: "rotation_reminder", branchId: "mom_maintenance_planning", name: "Rotation Reminder", flavor: "Ringing the village bell", description: "Trigger a toy rotation or reset", xp: 8, order: 3, nonSequential: true },
    ],
  },
  {
    id: "mom_boss_levels",
    name: "Boss Levels",
    icon: "⚔️",
    description: "Big projects, big XP.",
    users: ["mom"],
    nonSequential: true,
    skills: [
      { id: "bonus_room_raid", branchId: "mom_boss_levels", name: "Bonus Room Raid", flavor: "Clearing a dungeon room", description: "Lead a 1-hour bonus room sprint", xp: 40, order: 1, nonSequential: true },
      { id: "donation_chest_sorter", branchId: "mom_boss_levels", name: "Donation Chest Sorter", flavor: "Separating dungeon loot", description: "Re-sort the donation pile", xp: 30, order: 2, nonSequential: true },
      { id: "deep_clean_champion", branchId: "mom_boss_levels", name: "Deep Clean Champion", flavor: "Defeating the Ender Dragon", description: "Lead a full deep clean", xp: 50, order: 3, nonSequential: true },
    ],
  },

  // ==== MAARTEN BRANCHES ====
  {
    id: "maarten_kitchen_support",
    name: "Kitchen Support",
    icon: "🍴",
    description: "Dish duty and beyond.",
    users: ["maarten"],
    skills: [
      { id: "dish_duty", branchId: "maarten_kitchen_support", name: "Dish Duty", flavor: "Manning the furnace", description: "Run a dish cycle", xp: 10, order: 1 },
      { id: "dish_master", branchId: "maarten_kitchen_support", name: "Dish Master", flavor: "Furnace foreman", description: "Three dish cycles in one week", xp: 15, order: 2 },
    ],
  },
  {
    id: "maarten_waste_management",
    name: "Waste Management",
    icon: "🗑️",
    description: "Move the trash, save the kingdom.",
    users: ["maarten"],
    skills: [
      { id: "trash_night_captain", branchId: "maarten_waste_management", name: "Trash Night Captain", flavor: "The weekly shipment goes out", description: "Take all bins to the street on trash night", xp: 12, order: 1 },
      { id: "recycling_sorter", branchId: "maarten_waste_management", name: "Recycling Sorter", flavor: "Sorting materials at the sorting station", description: "Sort and prep recycling", xp: 8, order: 2 },
      { id: "waste_boss", branchId: "maarten_waste_management", name: "Waste Boss", flavor: "Managing the whole disposal network", description: "Handle all trash and recycling for the week", xp: 20, order: 3 },
    ],
  },
  {
    id: "maarten_weekend_warrior",
    name: "Weekend Warrior",
    icon: "🛡️",
    description: "Show up for the reset.",
    users: ["maarten"],
    skills: [
      { id: "reset_recruit", branchId: "maarten_weekend_warrior", name: "Reset Recruit", flavor: "Joining the raid party", description: "Show up to a Weekend Reset", xp: 20, order: 1 },
      { id: "sprint_veteran", branchId: "maarten_weekend_warrior", name: "Sprint Veteran", flavor: "Battle-tested", description: "Complete an extended Weekend Reset", xp: 25, order: 2 },
      { id: "reset_commander", branchId: "maarten_weekend_warrior", name: "Reset Commander", flavor: "Leading the raid", description: "Lead a Weekend Reset session", xp: 35, order: 3 },
    ],
  },
  {
    id: "maarten_heavy_lifting",
    name: "Heavy Lifting",
    icon: "💪",
    description: "Move stuff. Build stuff.",
    users: ["maarten"],
    nonSequential: true,
    skills: [
      { id: "furniture_mover", branchId: "maarten_heavy_lifting", name: "Furniture Mover", flavor: "Hauling oak planks", description: "Move furniture or heavy items", xp: 15, order: 1, nonSequential: true },
      { id: "shelf_installer", branchId: "maarten_heavy_lifting", name: "Shelf Installer", flavor: "Placing chests on the wall", description: "Install or assemble storage", xp: 25, order: 2, nonSequential: true },
      { id: "home_improvement_hero", branchId: "maarten_heavy_lifting", name: "Home Improvement Hero", flavor: "Master builder mode", description: "Tackle a real project", xp: 40, order: 3, nonSequential: true },
    ],
  },
  {
    id: "maarten_boss_levels",
    name: "Boss Levels",
    icon: "⚔️",
    description: "Big quests, big XP.",
    users: ["maarten"],
    nonSequential: true,
    skills: [
      { id: "bonus_room_raid", branchId: "maarten_boss_levels", name: "Bonus Room Raid", flavor: "Clearing a dungeon room", description: "Help with a 1-hour bonus room sprint", xp: 40, order: 1, nonSequential: true },
      { id: "deep_clean_champion", branchId: "maarten_boss_levels", name: "Deep Clean Champion", flavor: "Defeating the Ender Dragon", description: "Participate in a full deep clean", xp: 50, order: 2, nonSequential: true },
    ],
  },

  // ==== SHARED ADULT BRANCHES ====
  {
    id: "home_admin",
    name: "Home Admin (Quest Board)",
    icon: "📋",
    description: "Phone calls, emails, scheduling. The 'adulting' that haunts the to-do list.",
    users: ADULTS,
    nonSequential: true,
    skills: [
      { id: "power_wash_quest", branchId: "home_admin", name: "Power Wash Quest", flavor: "Hiring villagers to clean the castle walls", description: "Call and schedule exterior power washing", xp: 30, order: 1, nonSequential: true, type: "one-off" },
      { id: "lawn_garden_quest", branchId: "home_admin", name: "Lawn & Garden Quest", flavor: "Commissioning the farmer villagers", description: "Contact lawn people about flower beds", xp: 25, order: 2, nonSequential: true, type: "one-off" },
      { id: "vendor_research", branchId: "home_admin", name: "Vendor Research", flavor: "Scouting the trading post", description: "Research and get quotes for a service", xp: 15, order: 3, nonSequential: true, type: "one-off" },
      { id: "appointment_scheduler", branchId: "home_admin", name: "Appointment Scheduler", flavor: "Booking a villager trade", description: "Schedule a household appointment", xp: 15, order: 4, nonSequential: true, type: "one-off" },
      { id: "bill_wrangler", branchId: "home_admin", name: "Bill Wrangler", flavor: "Paying the village tax", description: "Review and pay a household bill", xp: 10, order: 5, nonSequential: true, type: "recurring" },
      { id: "insurance_warranty_check", branchId: "home_admin", name: "Insurance/Warranty Check", flavor: "Inspecting the castle defenses", description: "Review a policy or warranty", xp: 20, order: 6, nonSequential: true, type: "recurring" },
      { id: "subscription_audit", branchId: "home_admin", name: "Subscription Audit", flavor: "Clearing unused enchantments", description: "Review and cancel/keep a subscription", xp: 15, order: 7, nonSequential: true, type: "recurring" },
    ],
  },
  {
    id: "exterior_seasonal",
    name: "Exterior & Seasonal",
    icon: "🏠",
    description: "Outside maintenance and seasonal upkeep.",
    users: ADULTS,
    nonSequential: true,
    skills: [
      { id: "mailbox_mold_slayer", branchId: "exterior_seasonal", name: "Mailbox Mold Slayer", flavor: "Clearing the moss from the outpost", description: "Clean mold/mildew off the mailbox", xp: 15, order: 1, nonSequential: true, type: "recurring" },
      { id: "door_frame_defender", branchId: "exterior_seasonal", name: "Door Frame Defender", flavor: "Sealing the fortress entrance", description: "Clean mold off exterior door frames", xp: 15, order: 2, nonSequential: true, type: "recurring" },
      { id: "porch_patio_sweep", branchId: "exterior_seasonal", name: "Porch/Patio Sweep", flavor: "Clearing the castle courtyard", description: "Sweep or hose down porch/patio", xp: 12, order: 3, nonSequential: true, type: "recurring" },
      { id: "gutter_check", branchId: "exterior_seasonal", name: "Gutter Check", flavor: "Inspecting the aqueducts", description: "Check and clear gutters", xp: 20, order: 4, nonSequential: true, type: "recurring" },
      { id: "window_wiper", branchId: "exterior_seasonal", name: "Window Wiper", flavor: "Polishing the castle windows", description: "Clean exterior windows", xp: 15, order: 5, nonSequential: true, type: "recurring" },
      { id: "seasonal_swap", branchId: "exterior_seasonal", name: "Seasonal Swap", flavor: "Preparing for the next biome season", description: "Swap seasonal decor / winterize / summerize", xp: 25, order: 6, nonSequential: true, type: "seasonal", intervalDays: 90 },
      { id: "hvac_filter", branchId: "exterior_seasonal", name: "HVAC Filter", flavor: "Replacing the air purification runes", description: "Replace HVAC filters", xp: 15, order: 7, nonSequential: true, type: "seasonal", intervalDays: 90 },
      { id: "outdoor_trash_bins", branchId: "exterior_seasonal", name: "Outdoor Trash & Bins", flavor: "Decontaminating the waste barrels", description: "Clean/deodorize outdoor trash cans", xp: 15, order: 8, nonSequential: true, type: "recurring" },
    ],
  },
];

export function branchesForUser(userId: UserId): SkillBranch[] {
  return SKILL_BRANCHES.filter((b) => b.users.includes(userId));
}

export function findSkill(branchId: string, skillId: string) {
  const branch = SKILL_BRANCHES.find((b) => b.id === branchId);
  if (!branch) return null;
  const skill = branch.skills.find((s) => s.id === skillId);
  if (!skill) return null;
  return { branch, skill };
}

export function isBossBranch(branchId: string) {
  return branchId.includes("boss_levels");
}

/** Merge custom quests into the static branch definitions and return user-relevant branches. */
export function branchesForUserWithCustom(userId: UserId, customQuests: Skill[] = []): SkillBranch[] {
  return branchesForUser(userId).map((b) => {
    const extras = customQuests.filter((q) => q.branchId === b.id);
    if (extras.length === 0) return b;
    return { ...b, skills: [...b.skills, ...extras] };
  });
}

export function findSkillWithCustom(branchId: string, skillId: string, customQuests: Skill[] = []) {
  const direct = findSkill(branchId, skillId);
  if (direct) return direct;
  const branch = SKILL_BRANCHES.find((b) => b.id === branchId);
  if (!branch) return null;
  const skill = customQuests.find((q) => q.branchId === branchId && q.id === skillId);
  if (!skill) return null;
  return { branch, skill };
}
