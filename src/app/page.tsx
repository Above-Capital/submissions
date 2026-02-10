"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tool = "brush" | "eraser";

const PALETTE = [
  "#0b0f19",
  "#ffffff",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#3b82f6");
  const [size, setSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [bg, setBg] = useState("#ffffff");

  const gradient = useMemo(
    () => `radial-gradient(circle at 20% 20%, ${color}30, #09090b 70%)`,
    [color],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    const width = parent?.clientWidth ?? 1000;
    const height = 640;

    const snapshot = canvas.toDataURL("image/png");
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = snapshot;

    if (snapshot === "data:,") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }
  }, [bg]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        clearCanvas();
      }
      if (e.key.toLowerCase() === "b") setTool("brush");
      if (e.key.toLowerCase() === "e") setTool("eraser");
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  });

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const drawTo = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastPoint) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;
    ctx.strokeStyle = tool === "eraser" ? bg : color;
    ctx.shadowBlur = tool === "brush" ? 10 : 0;
    ctx.shadowColor = tool === "brush" ? color : "transparent";

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPoint({ x, y });
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const point = getPoint(e);
    setLastPoint(point);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const p = getPoint(e);
    drawTo(p.x, p.y);
  };

  const end = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `arena-paint-${Date.now()}.png`;
    link.click();
  };

  return (
    <main className="min-h-screen text-zinc-100" style={{ background: gradient }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-8">
        <header className="rounded-2xl border border-white/20 bg-black/40 p-5 backdrop-blur">
          <h1 className="text-2xl font-bold md:text-3xl">Neon Painter ⚡</h1>
          <p className="mt-1 text-sm text-zinc-300">
            Brush (B), Eraser (E), Clear (⌘/Ctrl+Z). Make something wild.
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/20 bg-black/50 p-4 backdrop-blur md:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setTool("brush")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tool === "brush" ? "bg-blue-500 text-white" : "bg-white/10"
              }`}
            >
              Brush
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tool === "eraser" ? "bg-rose-500 text-white" : "bg-white/10"
              }`}
            >
              Eraser
            </button>

            <label className="ml-2 flex items-center gap-2 text-sm">
              Size
              <input
                type="range"
                min={1}
                max={42}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
              <span className="w-7 text-right">{size}</span>
            </label>

            <button onClick={clearCanvas} className="rounded-xl bg-white/10 px-4 py-2 text-sm">
              Clear
            </button>
            <button onClick={download} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black">
              Export PNG
            </button>
          </div>

          <div className="flex items-center gap-2">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                onClick={() => setColor(swatch)}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  color === swatch ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ background: swatch }}
                aria-label={`Choose ${swatch}`}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-white/30 bg-transparent"
              aria-label="Custom color"
            />
          </div>
        </section>

        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-2 shadow-2xl">
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="touch-none rounded-2xl"
          />
        </div>

        <footer className="text-xs text-zinc-400">
          Tip: Try dark background + bright brush for glow art.
          <label className="ml-3 inline-flex items-center gap-2">
            Canvas BG
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-6 w-8" />
          </label>
        </footer>
      </div>
    </main>
  );
}
