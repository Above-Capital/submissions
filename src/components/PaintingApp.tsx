"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { classNames, clamp, downloadBlob, formatTime } from "../lib/utils";

type Tool = "brush" | "eraser" | "spray";

type StrokePoint = { x: number; y: number; p: number; t: number };

type Stroke = {
  tool: Tool;
  color: string;
  size: number;
  opacity: number;
  points: StrokePoint[];
};

type Paper = "snow" | "midnight" | "linen";

function paperStyle(p: Paper) {
  if (p === "midnight") {
    return {
      outer: "bg-zinc-950 text-zinc-50",
      canvas: "bg-zinc-900",
      grid: "bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:18px_18px]",
    };
  }
  if (p === "linen") {
    return {
      outer: "bg-[#faf7f1] text-zinc-900",
      canvas: "bg-[#fffaf0]",
      grid: "bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.06)_1px,transparent_0)] bg-[size:20px_20px]",
    };
  }
  return {
    outer: "bg-zinc-50 text-zinc-900",
    canvas: "bg-white",
    grid: "bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[size:18px_18px]",
  };
}

function toCssRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function PaintingApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [paper, setPaper] = useState<Paper>("snow");
  const [showGrid, setShowGrid] = useState(true);

  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#4f46e5");
  const [size, setSize] = useState(18);
  const [opacity, setOpacity] = useState(0.85);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [isDown, setIsDown] = useState(false);

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const style = paperStyle(paper);

  // Resize canvas to match wrapper
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(360, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawAll();
    }

    const ro = new ResizeObserver(() => resize());
    if (wrapRef.current) ro.observe(wrapRef.current);
    resize();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper, showGrid, strokes]);

  function ctx2d() {
    const c = canvasRef.current;
    if (!c) return null;
    return c.getContext("2d");
  }

  function clearCanvas() {
    const ctx = ctx2d();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
  }

  function redrawAll() {
    clearCanvas();
    const ctx = ctx2d();
    if (!ctx) return;
    for (const s of strokes) drawStroke(ctx, s);
  }

  function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
    if (s.points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (s.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.globalAlpha = 1;
      ctx.lineWidth = s.size;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = s.opacity;
      ctx.lineWidth = s.size;
      ctx.strokeStyle = s.tool === "spray" ? toCssRgba(s.color, 0.45) : s.color;
    }

    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      const p = s.points[i];
      ctx.lineTo(p.x, p.y);

      if (s.tool === "spray") {
        // sprinkle some dots around the path
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * (s.size * 0.9);
          ctx.fillStyle = toCssRgba(s.color, 0.18);
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, Math.max(1, s.size * 0.08), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function getPos(e: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(e.clientX - rect.left, 0, rect.width),
      y: clamp(e.clientY - rect.top, 0, rect.height),
    };
  }

  function beginStroke(e: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const pos = getPos(e);
    const now = Date.now();

    const s: Stroke = {
      tool,
      color,
      size,
      opacity,
      points: [{ x: pos.x, y: pos.y, p: e.pressure || 0.5, t: now }],
    };

    setStrokes((prev) => [...prev, s]);
    setRedo([]);
    setIsDown(true);
  }

  function moveStroke(e: PointerEvent) {
    if (!isDown) return;
    const ctx = ctx2d();
    if (!ctx) return;

    const pos = getPos(e);
    const now = Date.now();

    setStrokes((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      const next: Stroke = {
        ...last,
        points: [...last.points, { x: pos.x, y: pos.y, p: e.pressure || 0.5, t: now }],
      };
      const out = [...prev.slice(0, -1), next];

      // draw incrementally (cheap) by redrawing just last stroke
      // we still allow full redraw via ResizeObserver.
      clearCanvas();
      for (const s of out) drawStroke(ctx, s);

      return out;
    });
  }

  function endStroke(e: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDown(false);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const down = (e: PointerEvent) => beginStroke(e);
    const move = (e: PointerEvent) => moveStroke(e);
    const up = (e: PointerEvent) => endStroke(e);

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, color, size, opacity, isDown]);

  function doUndo() {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedo((r) => [last, ...r]);
      const out = prev.slice(0, -1);
      requestAnimationFrame(() => redrawAll());
      return out;
    });
  }

  function doRedo() {
    setRedo((r) => {
      if (!r.length) return r;
      const [head, ...rest] = r;
      setStrokes((s) => {
        const out = [...s, head];
        requestAnimationFrame(() => redrawAll());
        return out;
      });
      return rest;
    });
  }

  function clearAll() {
    if (!confirm("Clear the canvas?")) return;
    setStrokes([]);
    setRedo([]);
    requestAnimationFrame(() => redrawAll());
  }

  const stats = useMemo(() => {
    const points = strokes.reduce((acc, s) => acc + s.points.length, 0);
    return { strokes: strokes.length, points };
  }, [strokes]);

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(`painting-${Date.now()}.png`, blob);
      setLastSavedAt(Date.now());
    }, "image/png");
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportPng();
      }
      if (e.key.toLowerCase() === "g") setShowGrid((x) => !x);
      if (e.key === "1") setTool("brush");
      if (e.key === "2") setTool("spray");
      if (e.key === "3") setTool("eraser");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const toolBtn = (id: Tool, label: string, hint: string) => (
    <button
      onClick={() => setTool(id)}
      className={classNames(
        "rounded-xl border px-3 py-1.5 text-xs font-semibold",
        tool === id
          ? "border-indigo-500/35 bg-indigo-500/10"
          : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
      )}
      title={hint}
    >
      {label}
    </button>
  );

  return (
    <div className={classNames("min-h-dvh px-3 py-4 sm:px-6 sm:py-8", style.outer)}>
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">PaintPocket</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">A tiny painting app with texture, tools, and instant PNG export.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportPng}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              title="Export PNG (⌘/Ctrl+S)"
            >
              Export PNG
            </button>
            <button
              onClick={clearAll}
              className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 text-zinc-900 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-zinc-50">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Tools</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {toolBtn("brush", "Brush", "1")}
              {toolBtn("spray", "Spray", "2")}
              {toolBtn("eraser", "Eraser", "3")}
              <button
                onClick={doUndo}
                className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                title="Undo (⌘/Ctrl+Z)"
              >
                Undo
              </button>
              <button
                onClick={doRedo}
                className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                title="Redo (⌘/Ctrl+Shift+Z)"
              >
                Redo
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Color</div>
                  <input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded-lg border border-black/10 bg-transparent p-0"
                    aria-label="Color"
                  />
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-300">Size: {size}px</div>
                  <input
                    type="range"
                    min={2}
                    max={64}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="mt-2 w-full"
                  />
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-300">Opacity: {Math.round(opacity * 100)}%</div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={Math.round(opacity * 100)}
                    onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                    className="mt-2 w-full"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Paper</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["snow", "linen", "midnight"] as Paper[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaper(p)}
                      className={classNames(
                        "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                        paper === p
                          ? "border-emerald-500/35 bg-emerald-500/10"
                          : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowGrid((g) => !g)}
                    className={classNames(
                      "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                      showGrid
                        ? "border-indigo-500/35 bg-indigo-500/10"
                        : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                    )}
                    title="Toggle grid (G)"
                  >
                    Grid
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200">
                <div className="font-semibold">Shortcuts</div>
                <div className="mt-2 grid gap-1">
                  <div>1 brush • 2 spray • 3 eraser</div>
                  <div>⌘/Ctrl+Z undo • ⌘/Ctrl+Shift+Z redo</div>
                  <div>⌘/Ctrl+S export PNG • G toggle grid</div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                {stats.strokes} strokes • {stats.points} points
                {lastSavedAt ? <span> • last export {formatTime(lastSavedAt)}</span> : null}
              </div>
            </div>
          </aside>

          <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/10">
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="text-sm font-semibold tracking-tight">Canvas</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">Draw with pointer or touch. Export as PNG when ready.</div>
            </div>
            <div ref={wrapRef} className={classNames("relative h-[72dvh] p-4", showGrid ? style.grid : "")}> 
              <div className={classNames("h-full w-full overflow-hidden rounded-2xl border border-black/10 shadow-inner dark:border-white/10", style.canvas)}>
                <canvas ref={canvasRef} className="h-full w-full touch-none" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
