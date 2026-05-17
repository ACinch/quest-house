"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Dir = "N" | "E" | "S" | "W";
type PipeType = "H" | "V" | "NE" | "NW" | "SE" | "SW";

const ALL_PIPES: PipeType[] = ["H", "V", "NE", "NW", "SE", "SW"];

const PIPE_CONNECTIONS: Record<PipeType, Dir[]> = {
  H: ["W", "E"],
  V: ["N", "S"],
  NE: ["N", "E"],
  NW: ["N", "W"],
  SE: ["S", "E"],
  SW: ["S", "W"],
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
};

type Cell =
  | { kind: "empty" }
  | { kind: "start"; dir: Dir }
  | { kind: "end"; dir: Dir }
  | { kind: "pipe"; type: PipeType };

interface Level {
  cols: number;
  rows: number;
  start: { x: number; y: number; dir: Dir };
  end: { x: number; y: number; dir: Dir };
  inventory: Record<PipeType, number>;
  // optimal length, for scoring/info
  pathLen: number;
}

function findPipeType(a: Dir, b: Dir): PipeType | null {
  for (const t of ALL_PIPES) {
    const c = PIPE_CONNECTIONS[t];
    if (c.includes(a) && c.includes(b)) return t;
  }
  return null;
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
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { cols: 5, rows: 6,  baseLen: 4,  lenPerLevel: 0.5, decoys: 1 },
  medium: { cols: 6, rows: 8,  baseLen: 7,  lenPerLevel: 1,   decoys: 2 },
  hard:   { cols: 7, rows: 9,  baseLen: 10, lenPerLevel: 1,   decoys: 3 },
  expert: { cols: 8, rows: 10, baseLen: 14, lenPerLevel: 1.5, decoys: 5 },
};

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

  // Try until we get a path long enough
  for (let attempt = 0; attempt < 400; attempt++) {
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

    // Random walk biased toward longer paths
    const visited = new Set<string>();
    const path: Array<{ x: number; y: number }> = [];
    const moves: Dir[] = []; // direction taken to LEAVE each cell

    let cx = startSpot.x;
    let cy = startSpot.y;
    path.push({ x: cx, y: cy });
    visited.add(`${cx},${cy}`);

    // First move must be in the start's pipe direction
    let nextForcedDir: Dir | null = startSpot.dir;

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

      // Bias toward turns to make the path more interesting
      let chosen: Dir;
      if (options.length > 1 && lastDir && Math.random() < 0.55) {
        const turns = options.filter((d) => d !== lastDir);
        chosen = turns.length > 0
          ? turns[Math.floor(Math.random() * turns.length)]
          : options[Math.floor(Math.random() * options.length)];
      } else {
        chosen = options[Math.floor(Math.random() * options.length)];
      }

      const [dx, dy] = DELTA[chosen];
      const nx = cx + dx;
      const ny = cy + dy;
      // Stop if next step would force end onto a non-edge before reaching target
      moves.push(chosen);
      cx = nx;
      cy = ny;
      visited.add(`${cx},${cy}`);
      path.push({ x: cx, y: cy });
    }

    if (path.length < Math.max(4, targetLen - 1)) continue;
    if (moves.length === 0) continue;

    // Compute the canonical pipe at each interior cell of the path
    const solutionPipes: PipeType[] = [];
    let solutionOk = true;
    for (let i = 1; i < path.length - 1; i++) {
      const inDir = OPPOSITE[moves[i - 1]]; // direction water enters from
      const outDir = moves[i]; // direction water leaves
      const t = findPipeType(inDir, outDir);
      if (!t) {
        solutionOk = false;
        break;
      }
      solutionPipes.push(t);
    }
    if (!solutionOk) continue;

    // Build inventory: exactly enough of each pipe to solve, plus decoys
    const inventory: Record<PipeType, number> = {
      H: 0,
      V: 0,
      NE: 0,
      NW: 0,
      SE: 0,
      SW: 0,
    };
    for (const t of solutionPipes) inventory[t]++;
    for (let i = 0; i < cfg.decoys; i++) {
      const t = ALL_PIPES[Math.floor(Math.random() * ALL_PIPES.length)];
      inventory[t]++;
    }

    const startCell = path[0];
    const endCell = path[path.length - 1];
    const startDir = moves[0];
    const endEnterDir = moves[moves.length - 1];

    const grid: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, (): Cell => ({ kind: "empty" })),
    );
    grid[startCell.y][startCell.x] = { kind: "start", dir: startDir };
    grid[endCell.y][endCell.x] = { kind: "end", dir: OPPOSITE[endEnterDir] };

    const level: Level = {
      cols,
      rows,
      start: { x: startCell.x, y: startCell.y, dir: startDir },
      end: {
        x: endCell.x,
        y: endCell.y,
        dir: OPPOSITE[endEnterDir],
      },
      inventory,
      pathLen: path.length,
    };

    // Solvability self-check: place the canonical pipes and verify the flow.
    // If the simulated solve fails, this attempt is rejected and we generate
    // another level — players never see an unsolvable board.
    const solvedGrid = grid.map((row) => row.slice());
    for (let i = 1; i < path.length - 1; i++) {
      solvedGrid[path[i].y][path[i].x] = {
        kind: "pipe",
        type: solutionPipes[i - 1],
      };
    }
    const verify = traceFlow(level, solvedGrid);
    if (!verify.complete) continue;

    return { level, grid };
  }

  // Fallback to a simple straight level if generation failed
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({ kind: "empty" })),
  );
  grid[0][0] = { kind: "start", dir: "E" };
  grid[0][cols - 1] = { kind: "end", dir: "W" };
  const inv: Record<PipeType, number> = {
    H: cols - 2,
    V: 0,
    NE: 0,
    NW: 0,
    SE: 0,
    SW: 0,
  };
  return {
    level: {
      cols,
      rows,
      start: { x: 0, y: 0, dir: "E" },
      end: { x: cols - 1, y: 0, dir: "W" },
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
  let cx = level.start.x;
  let cy = level.start.y;
  let dir: Dir = level.start.dir;
  filled.add(`${cx},${cy}`);

  // Safety counter
  for (let i = 0; i < level.cols * level.rows + 2; i++) {
    const [dx, dy] = DELTA[dir];
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx < 0 || ny < 0 || nx >= level.cols || ny >= level.rows) {
      return { filled, complete: false };
    }
    const next = grid[ny][nx];
    if (next.kind === "end") {
      if (level.end.dir === OPPOSITE[dir]) {
        filled.add(`${nx},${ny}`);
        return { filled, complete: true };
      }
      return { filled, complete: false };
    }
    if (next.kind !== "pipe") return { filled, complete: false };
    const conns = PIPE_CONNECTIONS[next.type];
    if (!conns.includes(OPPOSITE[dir])) return { filled, complete: false };
    filled.add(`${nx},${ny}`);
    const exitDir = conns.find((c) => c !== OPPOSITE[dir]);
    if (!exitDir) return { filled, complete: false };
    cx = nx;
    cy = ny;
    dir = exitDir;
  }
  return { filled, complete: false };
}

function pipePath(type: PipeType): string {
  const C = 50;
  switch (type) {
    case "H":
      return `M 0 ${C} L 100 ${C}`;
    case "V":
      return `M ${C} 0 L ${C} 100`;
    case "NE":
      return `M ${C} 0 Q ${C} ${C} 100 ${C}`;
    case "NW":
      return `M ${C} 0 Q ${C} ${C} 0 ${C}`;
    case "SE":
      return `M ${C} 100 Q ${C} ${C} 100 ${C}`;
    case "SW":
      return `M ${C} 100 Q ${C} ${C} 0 ${C}`;
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
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <path
        d={pipePath(type)}
        stroke={outer}
        strokeWidth={32}
        fill="none"
        strokeLinecap="butt"
      />
      <path
        d={pipePath(type)}
        stroke={inner}
        strokeWidth={18}
        fill="none"
        strokeLinecap="butt"
      />
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
    H: 0,
    V: 0,
    NE: 0,
    NW: 0,
    SE: 0,
    SW: 0,
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

  const drawerPipes = ALL_PIPES;

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
