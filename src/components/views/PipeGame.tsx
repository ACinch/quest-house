"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Dir = "N" | "E" | "S" | "W";
type PipeType =
  | "H"
  | "V"
  | "NE"
  | "NW"
  | "SE"
  | "SW"
  | "TNES"
  | "TNEW"
  | "TNSW"
  | "TESW"
  | "X";

const ALL_PIPES: PipeType[] = [
  "H",
  "V",
  "NE",
  "NW",
  "SE",
  "SW",
  "TNES",
  "TNEW",
  "TNSW",
  "TESW",
  "X",
];

const PIPE_CONNECTIONS: Record<PipeType, Dir[]> = {
  H: ["W", "E"],
  V: ["N", "S"],
  NE: ["N", "E"],
  NW: ["N", "W"],
  SE: ["S", "E"],
  SW: ["S", "W"],
  TNES: ["N", "E", "S"],
  TNEW: ["N", "E", "W"],
  TNSW: ["N", "S", "W"],
  TESW: ["E", "S", "W"],
  X: ["N", "E", "S", "W"],
};

const OPPOSITE: Record<Dir, Dir> = { N: "S", S: "N", E: "W", W: "E" };
const DELTA: Record<Dir, [number, number]> = {
  N: [0, -1],
  S: [0, 1],
  E: [1, 0],
  W: [-1, 0],
};

const PIPE_LABEL: Record<PipeType, string> = {
  H: "Horizontal",
  V: "Vertical",
  NE: "North↔East",
  NW: "North↔West",
  SE: "South↔East",
  SW: "South↔West",
  TNES: "T (N·E·S)",
  TNEW: "T (N·E·W)",
  TNSW: "T (N·S·W)",
  TESW: "T (E·S·W)",
  X: "Cross",
};

type Cell =
  | { kind: "empty" }
  | { kind: "start"; dir: Dir }
  | { kind: "end"; dir: Dir }
  | { kind: "pipe"; type: PipeType };

interface EndPoint {
  x: number;
  y: number;
  dir: Dir;
}

interface Level {
  cols: number;
  rows: number;
  start: EndPoint;
  ends: EndPoint[];
  inventory: Record<PipeType, number>;
  // optimal length, for scoring/info
  pathLen: number;
}

function dirSetKey(dirs: Iterable<Dir>): string {
  return (["N", "E", "S", "W"] as Dir[])
    .filter((d) => {
      for (const x of dirs) if (x === d) return true;
      return false;
    })
    .join("");
}

const CONNS_TO_TYPE: Record<string, PipeType> = (() => {
  const map: Record<string, PipeType> = {};
  for (const t of ALL_PIPES) {
    map[dirSetKey(PIPE_CONNECTIONS[t])] = t;
  }
  return map;
})();

function pipeForConnections(dirs: Set<Dir>): PipeType | null {
  return CONNS_TO_TYPE[dirSetKey(dirs)] ?? null;
}

type Difficulty = "easy" | "medium" | "hard" | "expert";

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "expert"];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

interface DifficultyConfig {
  cols: number;
  rows: number;
  baseLen: number;
  lenPerLevel: number;
  decoys: number;
  // Number of branch endpoints in addition to the trunk's. 0 = single end.
  branches: number;
  // Length of each side branch
  branchLen: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { cols: 5, rows: 6,  baseLen: 4,  lenPerLevel: 0.5, decoys: 1, branches: 0, branchLen: 0 },
  medium: { cols: 6, rows: 8,  baseLen: 7,  lenPerLevel: 1,   decoys: 2, branches: 0, branchLen: 0 },
  hard:   { cols: 7, rows: 9,  baseLen: 9,  lenPerLevel: 1,   decoys: 3, branches: 1, branchLen: 3 },
  expert: { cols: 8, rows: 10, baseLen: 12, lenPerLevel: 1.5, decoys: 5, branches: 2, branchLen: 4 },
};

function randomWalk(
  cols: number,
  rows: number,
  startX: number,
  startY: number,
  firstDir: Dir | null,
  targetLen: number,
  blocked: Set<string>,
): { path: Array<{ x: number; y: number }>; moves: Dir[] } {
  const visited = new Set(blocked);
  const path: Array<{ x: number; y: number }> = [];
  const moves: Dir[] = [];
  let cx = startX;
  let cy = startY;
  path.push({ x: cx, y: cy });
  visited.add(`${cx},${cy}`);
  let nextForcedDir: Dir | null = firstDir;

  while (path.length < targetLen) {
    const lastDir = moves.length > 0 ? moves[moves.length - 1] : null;
    let options: Dir[];
    if (nextForcedDir) {
      options = [nextForcedDir];
      nextForcedDir = null;
    } else {
      options = (Object.keys(DELTA) as Dir[]).filter((d) => {
        if (lastDir && d === OPPOSITE[lastDir]) return false;
        const [dx, dy] = DELTA[d];
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return false;
        if (visited.has(`${nx},${ny}`)) return false;
        return true;
      });
    }
    if (options.length === 0) break;

    let chosen: Dir;
    if (options.length > 1 && lastDir && Math.random() < 0.55) {
      const turns = options.filter((d) => d !== lastDir);
      chosen =
        turns.length > 0
          ? turns[Math.floor(Math.random() * turns.length)]
          : options[Math.floor(Math.random() * options.length)];
    } else {
      chosen = options[Math.floor(Math.random() * options.length)];
    }

    const [dx, dy] = DELTA[chosen];
    cx += dx;
    cy += dy;
    moves.push(chosen);
    visited.add(`${cx},${cy}`);
    path.push({ x: cx, y: cy });
  }

  return { path, moves };
}

function generateLevel(
  difficulty: Difficulty,
  levelNum: number,
): { level: Level; grid: Cell[][] } {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const cols = cfg.cols;
  const rows = cfg.rows;
  const targetLen = Math.min(
    Math.round(cfg.baseLen + (levelNum - 1) * cfg.lenPerLevel),
    cols * rows - 2,
  );

  for (let attempt = 0; attempt < 600; attempt++) {
    // Pick a random starting edge cell + the direction the pipe points INTO the grid
    const edges: Array<{ x: number; y: number; dir: Dir }> = [];
    for (let x = 0; x < cols; x++) {
      edges.push({ x, y: 0, dir: "S" });
      edges.push({ x, y: rows - 1, dir: "N" });
    }
    for (let y = 0; y < rows; y++) {
      edges.push({ x: 0, y, dir: "E" });
      edges.push({ x: cols - 1, y, dir: "W" });
    }
    const startSpot = edges[Math.floor(Math.random() * edges.length)];

    const trunk = randomWalk(
      cols,
      rows,
      startSpot.x,
      startSpot.y,
      startSpot.dir,
      targetLen,
      new Set<string>(),
    );
    if (trunk.path.length < Math.max(4, targetLen - 1)) continue;
    if (trunk.moves.length === 0) continue;

    // Accumulate per-cell connection sets across the trunk and any branches.
    const conns = new Map<string, Set<Dir>>();
    const occupied = new Set<string>();

    const addConn = (x: number, y: number, d: Dir) => {
      const k = `${x},${y}`;
      let set = conns.get(k);
      if (!set) {
        set = new Set<Dir>();
        conns.set(k, set);
      }
      set.add(d);
      occupied.add(k);
    };

    // Trunk: cell i has an "out" toward moves[i] and an "in" from OPPOSITE[moves[i-1]]
    for (let i = 0; i < trunk.path.length; i++) {
      const c = trunk.path[i];
      if (i > 0) addConn(c.x, c.y, OPPOSITE[trunk.moves[i - 1]]);
      if (i < trunk.moves.length) addConn(c.x, c.y, trunk.moves[i]);
    }

    // The trunk's terminal cell is one endpoint
    const trunkEnd = trunk.path[trunk.path.length - 1];
    const endpoints: EndPoint[] = [
      {
        x: trunkEnd.x,
        y: trunkEnd.y,
        dir: OPPOSITE[trunk.moves[trunk.moves.length - 1]],
      },
    ];
    const endpointKeySet = new Set<string>([
      `${trunkEnd.x},${trunkEnd.y}`,
    ]);

    // Grow side branches from interior trunk cells (which currently have 2
    // connections). Each branch becomes a new endpoint. We never grow from
    // an existing endpoint — otherwise we'd convert that leaf into a T.
    let branchAttempts = 0;
    let branchesAdded = 0;
    while (branchesAdded < cfg.branches && branchAttempts < 50) {
      branchAttempts++;

      // Candidate cells: any tree cell that still has at least one free side
      // pointing into an unoccupied neighbor.
      type Cand = { x: number; y: number; dir: Dir };
      const candidates: Cand[] = [];
      for (const [k, set] of conns) {
        if (set.size >= 3) continue; // already a T; skip to avoid making a giant X
        if (endpointKeySet.has(k)) continue;
        const [xs, ys] = k.split(",").map(Number);
        // Skip the start cell — keep start with a single connection
        if (xs === startSpot.x && ys === startSpot.y) continue;
        for (const d of Object.keys(DELTA) as Dir[]) {
          if (set.has(d)) continue;
          const [dx, dy] = DELTA[d];
          const nx = xs + dx;
          const ny = ys + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          if (occupied.has(`${nx},${ny}`)) continue;
          candidates.push({ x: xs, y: ys, dir: d });
        }
      }
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];

      // Walk away from the picked side. The new branch's first cell is the
      // neighbor through `pick.dir`. We treat that neighbor as the "start"
      // of a sub-walk whose first move is constrained by where it came from.
      const blocked = new Set<string>(occupied);
      // Allow the branch parent to keep its slot but not be revisited
      blocked.add(`${pick.x},${pick.y}`);
      const [bdx, bdy] = DELTA[pick.dir];
      const branchStart = { x: pick.x + bdx, y: pick.y + bdy };

      const branch = randomWalk(
        cols,
        rows,
        branchStart.x,
        branchStart.y,
        null,
        cfg.branchLen,
        blocked,
      );
      if (branch.path.length < 2) continue;

      // Connect parent → first branch cell
      addConn(pick.x, pick.y, pick.dir);
      addConn(branch.path[0].x, branch.path[0].y, OPPOSITE[pick.dir]);
      // Internal branch connections
      for (let i = 0; i < branch.moves.length; i++) {
        const c = branch.path[i];
        const n = branch.path[i + 1];
        addConn(c.x, c.y, branch.moves[i]);
        addConn(n.x, n.y, OPPOSITE[branch.moves[i]]);
      }

      const tail = branch.path[branch.path.length - 1];
      // The tail's single remaining connection is the one we just added when
      // we arrived. Endpoint dir is that single direction.
      const tailConns = conns.get(`${tail.x},${tail.y}`)!;
      const tailDir = [...tailConns][0];
      endpoints.push({ x: tail.x, y: tail.y, dir: tailDir });
      endpointKeySet.add(`${tail.x},${tail.y}`);
      branchesAdded++;
    }

    // Resolve each cell to a concrete pipe type.
    const startKey = `${startSpot.x},${startSpot.y}`;
    const endpointKeys = new Set(endpoints.map((e) => `${e.x},${e.y}`));

    const solutionGrid: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, (): Cell => ({ kind: "empty" })),
    );
    const inventory: Record<PipeType, number> = {
      H: 0, V: 0, NE: 0, NW: 0, SE: 0, SW: 0,
      TNES: 0, TNEW: 0, TNSW: 0, TESW: 0, X: 0,
    };

    let pipeOk = true;
    for (const [k, set] of conns) {
      if (k === startKey) continue;
      if (endpointKeys.has(k)) continue;
      const t = pipeForConnections(set);
      if (!t) {
        pipeOk = false;
        break;
      }
      const [xs, ys] = k.split(",").map(Number);
      solutionGrid[ys][xs] = { kind: "pipe", type: t };
      inventory[t]++;
    }
    if (!pipeOk) continue;

    for (let i = 0; i < cfg.decoys; i++) {
      const t = ALL_PIPES[Math.floor(Math.random() * ALL_PIPES.length)];
      // Restrict decoys to types appropriate for the difficulty
      if (cfg.branches === 0 && (t.startsWith("T") || t === "X")) {
        i--;
        continue;
      }
      inventory[t]++;
    }

    // Build the player's empty starting grid (start + ends only)
    const grid: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, (): Cell => ({ kind: "empty" })),
    );
    grid[startSpot.y][startSpot.x] = { kind: "start", dir: trunk.moves[0] };
    for (const e of endpoints) {
      grid[e.y][e.x] = { kind: "end", dir: e.dir };
    }
    // Also seed the solution grid with start/end markers for verification
    solutionGrid[startSpot.y][startSpot.x] = { kind: "start", dir: trunk.moves[0] };
    for (const e of endpoints) {
      solutionGrid[e.y][e.x] = { kind: "end", dir: e.dir };
    }

    const level: Level = {
      cols,
      rows,
      start: { x: startSpot.x, y: startSpot.y, dir: trunk.moves[0] },
      ends: endpoints,
      inventory,
      pathLen: conns.size,
    };

    // Solvability self-check: simulate the canonical solution and verify the
    // BFS flow reaches every endpoint. If not, throw this attempt out.
    const verify = traceFlow(level, solutionGrid);
    if (!verify.complete) continue;

    return { level, grid };
  }

  // Fallback: trivial single-row straight level (always solvable)
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({ kind: "empty" })),
  );
  grid[0][0] = { kind: "start", dir: "E" };
  grid[0][cols - 1] = { kind: "end", dir: "W" };
  const inv: Record<PipeType, number> = {
    H: Math.max(0, cols - 2),
    V: 0, NE: 0, NW: 0, SE: 0, SW: 0,
    TNES: 0, TNEW: 0, TNSW: 0, TESW: 0, X: 0,
  };
  return {
    level: {
      cols,
      rows,
      start: { x: 0, y: 0, dir: "E" },
      ends: [{ x: cols - 1, y: 0, dir: "W" }],
      inventory: inv,
      pathLen: cols,
    },
    grid,
  };
}

function traceFlow(
  level: Level,
  grid: Cell[][],
): { filled: Set<string>; complete: boolean } {
  const filled = new Set<string>();
  const visitedWithEntry = new Set<string>();
  const endByKey = new Map<string, Dir>();
  for (const e of level.ends) endByKey.set(`${e.x},${e.y}`, e.dir);

  const endsReached = new Set<string>();
  const startKey = `${level.start.x},${level.start.y}`;
  filled.add(startKey);

  // Seed the queue with water leaving the start in its single direction
  const queue: Array<{ x: number; y: number; entry: Dir }> = [];
  const [sdx, sdy] = DELTA[level.start.dir];
  queue.push({
    x: level.start.x + sdx,
    y: level.start.y + sdy,
    entry: OPPOSITE[level.start.dir],
  });

  while (queue.length > 0) {
    const { x, y, entry } = queue.shift()!;
    if (x < 0 || y < 0 || x >= level.cols || y >= level.rows) continue;
    const cell = grid[y][x];
    const key = `${x},${y}`;

    if (cell.kind === "end") {
      if (endByKey.get(key) === entry) {
        endsReached.add(key);
        filled.add(key);
      }
      continue;
    }
    if (cell.kind === "empty" || cell.kind === "start") continue;

    const conns = PIPE_CONNECTIONS[cell.type];
    if (!conns.includes(entry)) continue;

    const visitKey = `${key}|${entry}`;
    if (visitedWithEntry.has(visitKey)) continue;
    visitedWithEntry.add(visitKey);
    filled.add(key);

    for (const exit of conns) {
      if (exit === entry) continue;
      const [dx, dy] = DELTA[exit];
      queue.push({ x: x + dx, y: y + dy, entry: OPPOSITE[exit] });
    }
  }

  const complete = level.ends.every((e) =>
    endsReached.has(`${e.x},${e.y}`),
  );
  return { filled, complete };
}

function pipePaths(type: PipeType): string[] {
  const C = 50;
  switch (type) {
    case "H":
      return [`M 0 ${C} L 100 ${C}`];
    case "V":
      return [`M ${C} 0 L ${C} 100`];
    case "NE":
      return [`M ${C} 0 Q ${C} ${C} 100 ${C}`];
    case "NW":
      return [`M ${C} 0 Q ${C} ${C} 0 ${C}`];
    case "SE":
      return [`M ${C} 100 Q ${C} ${C} 100 ${C}`];
    case "SW":
      return [`M ${C} 100 Q ${C} ${C} 0 ${C}`];
    default: {
      // T or X — draw a straight stub from the center to each connected edge
      const stubs: string[] = [];
      for (const d of PIPE_CONNECTIONS[type]) {
        switch (d) {
          case "N": stubs.push(`M ${C} ${C} L ${C} 0`); break;
          case "S": stubs.push(`M ${C} ${C} L ${C} 100`); break;
          case "E": stubs.push(`M ${C} ${C} L 100 ${C}`); break;
          case "W": stubs.push(`M ${C} ${C} L 0 ${C}`); break;
        }
      }
      return stubs;
    }
  }
}

function PipeGlyph({
  type,
  filled = false,
  dim = false,
}: {
  type: PipeType;
  filled?: boolean;
  dim?: boolean;
}) {
  const outer = dim ? "#3a3a52" : "#6c6c84";
  const inner = filled ? "#4aedd9" : dim ? "#252538" : "#aaaac2";
  const paths = pipePaths(type);
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      {paths.map((d, i) => (
        <path
          key={`o${i}`}
          d={d}
          stroke={outer}
          strokeWidth={32}
          fill="none"
          strokeLinecap="butt"
        />
      ))}
      {paths.map((d, i) => (
        <path
          key={`i${i}`}
          d={d}
          stroke={inner}
          strokeWidth={18}
          fill="none"
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

function StubGlyph({ dir, kind }: { dir: Dir; kind: "start" | "end" }) {
  // Draw a stub from the cell center toward the edge `dir`
  const C = 50;
  let path: string;
  switch (dir) {
    case "N":
      path = `M ${C} ${C} L ${C} 0`;
      break;
    case "S":
      path = `M ${C} ${C} L ${C} 100`;
      break;
    case "E":
      path = `M ${C} ${C} L 100 ${C}`;
      break;
    case "W":
      path = `M ${C} ${C} L 0 ${C}`;
      break;
  }
  const tankFill = kind === "start" ? "#5d8c3e" : "#ff5555";
  const tankStroke = kind === "start" ? "#3e6228" : "#a03030";
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path
        d={path}
        stroke="#6c6c84"
        strokeWidth={32}
        fill="none"
        strokeLinecap="butt"
      />
      <path
        d={path}
        stroke="#4aedd9"
        strokeWidth={18}
        fill="none"
        strokeLinecap="butt"
      />
      <rect
        x={22}
        y={22}
        width={56}
        height={56}
        fill={tankFill}
        stroke={tankStroke}
        strokeWidth={6}
      />
      <text
        x={50}
        y={62}
        textAnchor="middle"
        fontSize={36}
        fontFamily="Press Start 2P, monospace"
        fill="#fff"
      >
        {kind === "start" ? "S" : "E"}
      </text>
    </svg>
  );
}

export default function PipeGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [levelNum, setLevelNum] = useState(1);
  const [level, setLevel] = useState<Level | null>(null);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [inv, setInv] = useState<Record<PipeType, number>>({
    H: 0, V: 0, NE: 0, NW: 0, SE: 0, SW: 0,
    TNES: 0, TNEW: 0, TNSW: 0, TESW: 0, X: 0,
  });
  const [selected, setSelected] = useState<PipeType | null>(null);
  const [won, setWon] = useState(false);

  const startLevel = useCallback((diff: Difficulty, n: number) => {
    const { level, grid } = generateLevel(diff, n);
    setLevel(level);
    setGrid(grid.map((row) => row.slice()));
    setInv({ ...level.inventory });
    setSelected(null);
    setWon(false);
  }, []);

  useEffect(() => {
    startLevel(difficulty, levelNum);
  }, [difficulty, levelNum, startLevel]);

  const changeDifficulty = (d: Difficulty) => {
    if (d === difficulty) return;
    setDifficulty(d);
    setLevelNum(1);
  };

  const flow = useMemo(() => {
    if (!level) return { filled: new Set<string>(), complete: false };
    return traceFlow(level, grid);
  }, [level, grid]);

  // Trigger win state when newly complete
  useEffect(() => {
    if (flow.complete && !won) {
      setWon(true);
      try {
        navigator.vibrate?.(30);
      } catch {}
    }
  }, [flow.complete, won]);

  const placePipe = (x: number, y: number) => {
    if (!level) return;
    const cell = grid[y][x];
    if (cell.kind === "start" || cell.kind === "end") return;

    // If cell has a pipe and no selected piece (or same type selected) -> remove
    if (cell.kind === "pipe") {
      const newGrid = grid.map((r) => r.slice());
      newGrid[y][x] = { kind: "empty" };
      setGrid(newGrid);
      setInv((prev) => ({ ...prev, [cell.type]: prev[cell.type] + 1 }));
      try {
        navigator.vibrate?.(10);
      } catch {}
      return;
    }

    // Empty cell: need a selected piece with stock
    if (!selected) return;
    if (inv[selected] <= 0) return;

    const newGrid = grid.map((r) => r.slice());
    newGrid[y][x] = { kind: "pipe", type: selected };
    setGrid(newGrid);
    setInv((prev) => ({ ...prev, [selected]: prev[selected] - 1 }));
    try {
      navigator.vibrate?.(10);
    } catch {}
  };

  const clearBoard = () => {
    if (!level) return;
    const restore: Record<PipeType, number> = { ...inv };
    const newGrid = grid.map((row) =>
      row.map((cell): Cell => {
        if (cell.kind === "pipe") {
          restore[cell.type] = (restore[cell.type] ?? 0) + 1;
          return { kind: "empty" };
        }
        return cell;
      }),
    );
    setGrid(newGrid);
    setInv(restore);
  };

  // Only show pipe types the current level actually serves up, so easy
  // levels stay tidy and branching levels surface the T/cross pieces.
  const drawerPipes = useMemo(
    () => (level ? ALL_PIPES.filter((p) => (level.inventory[p] ?? 0) > 0) : []),
    [level],
  );

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="pg-root">
      <header className="pg-header">
        <Link href="/" className="pg-back" aria-label="Back to home">
          ◀
        </Link>
        <div className="pg-title">
          <div className="font-pixel text-[11px] text-white">PIPE DREAM</div>
          <div className="text-sm opacity-80">Level {levelNum}</div>
        </div>
        <div className="pg-header-actions">
          <button className="block-btn ghost pg-mini" onClick={clearBoard}>
            Clear
          </button>
          <button
            className="block-btn alt pg-mini"
            onClick={() => setLevelNum((n) => n + 1)}
            title="Skip to a new level"
          >
            New
          </button>
        </div>
      </header>

      <div className="pg-diff-row" role="radiogroup" aria-label="Difficulty">
        {DIFFICULTY_ORDER.map((d) => (
          <button
            key={d}
            role="radio"
            aria-checked={difficulty === d}
            className={`pg-diff-pill ${difficulty === d ? "active" : ""}`}
            onClick={() => changeDifficulty(d)}
          >
            {DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>

      <div className="pg-board-wrap">
        <div
          className="pg-board"
          style={{
            gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
            gridTemplateRows: `repeat(${level.rows}, 1fr)`,
            aspectRatio: `${level.cols} / ${level.rows}`,
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => {
              const key = `${x},${y}`;
              const isFilled = flow.filled.has(key);
              const isSelectedTarget =
                cell.kind === "empty" && selected !== null && inv[selected] > 0;
              return (
                <button
                  key={key}
                  className={`pg-cell ${isFilled ? "filled" : ""} ${
                    cell.kind === "empty" ? "empty" : ""
                  } ${isSelectedTarget ? "target" : ""}`}
                  onClick={() => placePipe(x, y)}
                  aria-label={`Cell ${x},${y}`}
                >
                  {cell.kind === "pipe" && (
                    <PipeGlyph type={cell.type} filled={isFilled} />
                  )}
                  {(cell.kind === "start" || cell.kind === "end") && (
                    <StubGlyph dir={cell.dir} kind={cell.kind} />
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="pg-drawer">
        <div className="pg-drawer-label font-pixel">PIPES</div>
        <div className="pg-drawer-row">
          {drawerPipes.map((p) => {
            const count = inv[p] ?? 0;
            const isSel = selected === p;
            const disabled = count === 0;
            return (
              <button
                key={p}
                className={`pg-pipe-slot ${isSel ? "selected" : ""} ${
                  disabled ? "disabled" : ""
                }`}
                onClick={() => {
                  if (disabled) {
                    setSelected(null);
                    return;
                  }
                  setSelected(isSel ? null : p);
                }}
                title={PIPE_LABEL[p]}
                aria-label={`${PIPE_LABEL[p]} pipe, ${count} remaining`}
              >
                <div className="pg-pipe-glyph">
                  <PipeGlyph type={p} dim={disabled} />
                </div>
                <div className="pg-pipe-count font-pixel">×{count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {won && (
        <div className="pg-win-overlay" onClick={() => setLevelNum((n) => n + 1)}>
          <div className="pg-win-panel panel">
            <div className="font-pixel text-[16px] text-[var(--xpgold)]">
              CONNECTED!
            </div>
            <div className="text-sm opacity-90 mt-2">
              Level {levelNum} complete
            </div>
            <button
              className="block-btn gold mt-4"
              onClick={(e) => {
                e.stopPropagation();
                setLevelNum((n) => n + 1);
              }}
            >
              Next Level →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .pg-root {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          color: var(--text);
          padding: 0.5rem;
          gap: 0.5rem;
        }
        .pg-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.25rem 0;
        }
        .pg-back {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-2);
          border: 3px solid var(--border);
          color: var(--text);
          text-decoration: none;
          font-size: 16px;
          flex-shrink: 0;
        }
        .pg-title {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .pg-header-actions {
          display: flex;
          gap: 0.35rem;
        }
        :global(.pg-mini) {
          padding: 0.45rem 0.6rem !important;
          min-height: 38px !important;
          font-size: 9px !important;
        }
        .pg-diff-row {
          display: flex;
          gap: 0.35rem;
          padding: 0 0.25rem;
        }
        .pg-diff-pill {
          all: unset;
          flex: 1;
          text-align: center;
          padding: 0.4rem 0.25rem;
          background: var(--surface-2);
          border: 3px solid var(--border);
          color: var(--muted);
          font-family: "Press Start 2P", monospace;
          font-size: 9px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          min-height: 36px;
          box-sizing: border-box;
        }
        .pg-diff-pill.active {
          background: var(--ender);
          color: #fff;
          box-shadow:
            inset 0 -3px 0 0 rgba(0, 0, 0, 0.4),
            inset 0 3px 0 0 rgba(255, 255, 255, 0.18);
        }
        .pg-board-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }
        .pg-board {
          display: grid;
          width: min(100%, 92vmin);
          max-height: 65vh;
          gap: 0;
          background: #0d0d18;
          border: 4px solid var(--border);
          box-shadow:
            inset 0 -4px 0 0 rgba(0, 0, 0, 0.4),
            inset 0 4px 0 0 rgba(255, 255, 255, 0.08),
            4px 4px 0 0 rgba(0, 0, 0, 0.55);
        }
        .pg-cell {
          all: unset;
          aspect-ratio: 1 / 1;
          background: #1a1a2e;
          border: 1px solid #0d0d18;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          cursor: pointer;
          position: relative;
          transition: background 0.15s ease;
        }
        .pg-cell.empty {
          background: linear-gradient(
            135deg,
            #1a1a2e 25%,
            #20203a 25%,
            #20203a 50%,
            #1a1a2e 50%,
            #1a1a2e 75%,
            #20203a 75%
          );
          background-size: 12px 12px;
        }
        .pg-cell.target {
          background: #2a3a55;
          box-shadow: inset 0 0 0 2px var(--diamond);
        }
        .pg-cell.filled {
          background: #1a3a3a;
        }
        .pg-drawer {
          background: var(--surface);
          border: 3px solid var(--border);
          padding: 0.5rem 0.6rem 0.6rem;
          box-shadow:
            inset 0 -4px 0 0 rgba(0, 0, 0, 0.4),
            inset 0 4px 0 0 rgba(255, 255, 255, 0.08);
        }
        .pg-drawer-label {
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 0.4rem;
        }
        .pg-drawer-row {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
          -webkit-overflow-scrolling: touch;
        }
        .pg-empty-drawer {
          font-size: 13px;
          color: var(--muted);
          padding: 0.5rem 0.25rem;
        }
        .pg-pipe-slot {
          all: unset;
          flex: 0 0 auto;
          width: 64px;
          height: 76px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--surface-2);
          border: 3px solid var(--border);
          cursor: pointer;
          gap: 0.15rem;
          padding-top: 0.2rem;
          transition: transform 0.05s ease;
          position: relative;
        }
        .pg-pipe-slot.selected {
          background: #2a3a55;
          box-shadow: 0 0 0 3px var(--diamond);
        }
        .pg-pipe-slot.disabled {
          opacity: 0.45;
        }
        .pg-pipe-slot:active {
          transform: translateY(1px);
        }
        .pg-pipe-glyph {
          width: 44px;
          height: 44px;
        }
        .pg-pipe-count {
          font-size: 10px;
          color: var(--text);
        }
        .pg-win-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 20, 0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: pg-fade 0.25s ease;
        }
        .pg-win-panel {
          background: var(--surface);
          text-align: center;
          padding: 1.25rem 1.5rem;
          min-width: 240px;
        }
        @keyframes pg-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
