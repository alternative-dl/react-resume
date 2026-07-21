import {FC, memo, useEffect, useRef} from 'react';

/**
 * Animated hero backdrop: Conway's Game of Life played on the same 44px grid
 * module the rest of the brutalist UI uses. Live cells are drawn as faint ink
 * fills over faint grid lines, so it reads as the existing grid — just alive.
 *
 * It sits behind the hero's opaque `bg-paper` card, so the headline stays fully
 * legible at all times regardless of the pattern. The sim pauses when the hero
 * scrolls out of view and is skipped entirely under `prefers-reduced-motion`
 * (a single static generation is drawn instead).
 */
const CELL = 44; // px — matches the brutalist grid module
const STEP_MS = 550; // one Conway tick
const SEED_DENSITY = 0.16; // fraction of cells alive on a (re)seed
const LINE = 'rgba(10,10,10,0.07)'; // grid lines (same as the old static grid)
const FILL = 'rgba(10,10,10,0.13)'; // live cells — subtle, non-distracting

const GameOfLifeBackground: FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cols = 0;
    let rows = 0;
    let grid = new Uint8Array(0);
    let next = new Uint8Array(0);
    let stale = 0;

    const seed = () => {
      for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < SEED_DENSITY ? 1 : 0;
      stale = 0;
    };

    const step = () => {
      let changed = false;
      let alive = 0;
      for (let y = 0; y < rows; y++) {
        const up = ((y - 1 + rows) % rows) * cols;
        const mid = y * cols;
        const dn = ((y + 1) % rows) * cols;
        for (let x = 0; x < cols; x++) {
          const l = (x - 1 + cols) % cols;
          const r = (x + 1) % cols;
          const n =
            grid[up + l] +
            grid[up + x] +
            grid[up + r] +
            grid[mid + l] +
            grid[mid + r] +
            grid[dn + l] +
            grid[dn + x] +
            grid[dn + r];
          const cur = grid[mid + x];
          const nv = n === 3 || (cur === 1 && n === 2) ? 1 : 0;
          next[mid + x] = nv;
          if (nv) alive++;
          if (nv !== cur) changed = true;
        }
      }
      [grid, next] = [next, grid];
      // Keep it lively: reseed once the board stalls into still-lifes or nearly dies out.
      stale = changed ? 0 : stale + 1;
      if (stale > 2 || alive < grid.length * 0.02) seed();
    };

    const draw = () => {
      const w = canvas.width / dpr();
      const h = canvas.height / dpr();
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = FILL;
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          if (grid[row + x]) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= cols; x++) {
        const px = Math.floor(x * CELL) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
      }
      for (let y = 0; y <= rows; y++) {
        const py = Math.floor(y * CELL) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
      }
      ctx.stroke();
    };

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const ratio = dpr();
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const nextCols = Math.ceil(w / CELL);
      const nextRows = Math.ceil(h / CELL);
      if (nextCols !== cols || nextRows !== rows) {
        cols = nextCols;
        rows = nextRows;
        grid = new Uint8Array(cols * rows);
        next = new Uint8Array(cols * rows);
        seed();
      }
      draw();
    };

    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      if (reduced || timer !== null) return;
      timer = setInterval(() => {
        step();
        draw();
      }, STEP_MS);
    };

    resize();
    window.addEventListener('resize', resize);

    // Pause the sim while the hero isn't on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      {threshold: 0},
    );
    io.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" ref={canvasRef} />;
});

GameOfLifeBackground.displayName = 'GameOfLifeBackground';
export default GameOfLifeBackground;
