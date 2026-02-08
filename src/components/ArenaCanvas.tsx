"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type { Food, GameState, Snake, Vec } from "@/lib/types";
import { dist } from "@/lib/utils";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cell: number
) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#0a2a34";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cell + 0.5, 0);
    ctx.lineTo(x * cell + 0.5, h * cell);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cell + 0.5);
    ctx.lineTo(w * cell, y * cell + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSafeZone(
  ctx: CanvasRenderingContext2D,
  center: Vec,
  radius: number,
  cell: number
) {
  ctx.save();
  const cx = (center.x + 0.5) * cell;
  const cy = (center.y + 0.5) * cell;
  const r = radius * cell;

  // glow ring
  ctx.strokeStyle = "rgba(34,211,238,0.55)";
  ctx.lineWidth = Math.max(2, cell * 0.08);
  ctx.shadowColor = "rgba(34,211,238,0.8)";
  ctx.shadowBlur = cell * 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // danger outside mask
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(244,63,94,0.08)";
  ctx.beginPath();
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  ctx.restore();
}

function drawFood(ctx: CanvasRenderingContext2D, f: Food, cell: number) {
  ctx.save();
  const x = (f.pos.x + 0.5) * cell;
  const y = (f.pos.y + 0.5) * cell;

  if (f.kind === "food") {
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.shadowColor = "rgba(34,211,238,0.9)";
  } else {
    const color =
      f.powerupType === "dash"
        ? "rgba(251,191,36,0.95)"
        : f.powerupType === "shield"
          ? "rgba(167,139,250,0.95)"
          : "rgba(52,211,153,0.95)";
    ctx.fillStyle = color;
    ctx.shadowColor = color;
  }
  ctx.shadowBlur = cell * 0.7;

  const r = cell * (f.kind === "food" ? 0.22 : 0.26);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // little icon
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.font = `${Math.max(10, cell * 0.45)}px ui-sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (f.kind === "powerup") {
    ctx.fillText(
      f.powerupType === "dash" ? "⚡" : f.powerupType === "shield" ? "🛡" : "🧲",
      x,
      y + 0.5
    );
  }

  ctx.restore();
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  sn: Snake,
  cell: number,
  isMe: boolean
) {
  if (!sn.alive) return;
  ctx.save();
  ctx.shadowBlur = cell * 0.9;
  ctx.shadowColor = sn.color;

  // segments
  for (let i = sn.segments.length - 1; i >= 0; i--) {
    const seg = sn.segments[i];
    const px = seg.x * cell;
    const py = seg.y * cell;
    const inset = Math.max(1, cell * 0.08);
    const r = Math.max(4, cell * 0.22);

    ctx.fillStyle = sn.color;
    ctx.globalAlpha = i === 0 ? 1 : 0.78;
    ctx.beginPath();
    roundRect(ctx, px + inset, py + inset, cell - inset * 2, cell - inset * 2, r);
    ctx.fill();
  }

  // eyes on head
  const head = sn.segments[0];
  const hx = head.x * cell;
  const hy = head.y * cell;
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath();
  ctx.arc(hx + cell * 0.35, hy + cell * 0.4, cell * 0.06, 0, Math.PI * 2);
  ctx.arc(hx + cell * 0.65, hy + cell * 0.4, cell * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // shield ring
  const now = Date.now();
  if (now < sn.shieldUntil) {
    ctx.strokeStyle = "rgba(167,139,250,0.9)";
    ctx.lineWidth = Math.max(2, cell * 0.08);
    ctx.shadowColor = "rgba(167,139,250,0.9)";
    ctx.shadowBlur = cell * 0.8;
    ctx.beginPath();
    ctx.arc((head.x + 0.5) * cell, (head.y + 0.5) * cell, cell * 0.48, 0, Math.PI * 2);
    ctx.stroke();
  }

  // name
  if (!isMe) {
    ctx.shadowBlur = 0;
    ctx.font = `${Math.max(10, cell * 0.34)}px ui-sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(sn.name, (head.x + 0.5) * cell, head.y * cell - 2);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
}

export function ArenaCanvas({
  state,
  className,
}: {
  state: GameState;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const cell = useMemo(() => {
    // scale cell size to fit nicely
    return 20;
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = state.arena.w * cell;
    const height = state.arena.h * cell;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#04070b");
    g.addColorStop(1, "#020c12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // subtle stars
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#7dd3fc";
    for (let i = 0; i < 50; i++) {
      const x = (i * 97) % width;
      const y = (i * 53) % height;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.restore();

    drawGrid(ctx, state.arena.w, state.arena.h, cell);
    drawSafeZone(ctx, state.arena.safeCenter, state.arena.safeRadius, cell);

    // foods
    for (const f of state.foods) drawFood(ctx, f, cell);

    // snakes
    for (const sn of state.snakes) {
      drawSnake(ctx, sn, cell, sn.id === state.me);
    }

    // minimap-ish safe indicator text
    ctx.save();
    ctx.font = `${Math.max(12, cell * 0.5)}px ui-sans-serif`;
    ctx.fillStyle = "rgba(125,211,252,0.85)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `Zone: ${Math.max(0, state.arena.safeRadius).toFixed(1)}`,
      10,
      10
    );
    ctx.restore();

    // overlay
    if (!state.started) {
      overlay(ctx, width, height, "NEON SERPENT", "Tap / Space to boost. Survive the shrinking zone.");
    } else if (state.paused) {
      overlay(ctx, width, height, "PAUSED", "Press P to resume.");
    } else if (state.over) {
      overlay(ctx, width, height, "ELIMINATED", state.lastMessage || "Try again.");
    }
  }, [state, cell, dpr]);

  return (
    <div className={className}>
      <canvas ref={ref} className="rounded-3xl border border-zinc-800 shadow-[0_0_40px_rgba(34,211,238,0.15)]" />
    </div>
  );
}

function overlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string,
  subtitle: string
) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `700 28px ui-sans-serif`;
  ctx.fillText(title, w / 2, h / 2 - 12);

  ctx.fillStyle = "rgba(125,211,252,0.85)";
  ctx.font = `500 14px ui-sans-serif`;
  ctx.fillText(subtitle, w / 2, h / 2 + 16);
  ctx.restore();
}
