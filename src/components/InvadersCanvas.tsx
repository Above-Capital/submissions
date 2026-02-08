"use client";

import React, { useEffect, useRef } from "react";
import type { GameState } from "@/lib/game";

export function InvadersCanvas({
  state,
  className,
}: {
  state: GameState;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(state.w * dpr);
    canvas.height = Math.floor(state.h * dpr);
    canvas.style.width = `${state.w}px`;
    canvas.style.height = `${state.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    const g = ctx.createLinearGradient(0, 0, state.w, state.h);
    g.addColorStop(0, "#03060a");
    g.addColorStop(1, "#071826");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    // stars
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#67e8f9";
    for (let i = 0; i < 80; i++) {
      const x = (i * 97) % state.w;
      const y = (i * 53) % state.h;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();

    // glow scanlines
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < state.h; y += 4) ctx.fillRect(0, y, state.w, 1);
    ctx.restore();

    // player
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(34,211,238,0.8)";
    ctx.fillStyle = "rgba(34,211,238,0.95)";
    drawShip(ctx, state.player.x, state.player.y);
    ctx.restore();

    // invaders
    for (const inv of state.invaders) {
      if (!inv.alive) continue;
      const color = inv.type === 2 ? "rgba(251,191,36,0.95)" : inv.type === 1 ? "rgba(167,139,250,0.95)" : "rgba(34,211,238,0.9)";
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      drawInvader(ctx, inv.pos.x, inv.pos.y, inv.type);
      ctx.restore();
    }

    // UFO
    if (state.ufo.active) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(251,113,133,0.95)";
      ctx.fillStyle = "rgba(251,113,133,0.95)";
      ctx.beginPath();
      ctx.roundRect(state.ufo.x - 26, state.ufo.y - 10, 52, 20, 10);
      ctx.fill();
      ctx.restore();
    }

    // bullets
    for (const b of state.bullets) {
      ctx.save();
      const color = b.from === "player" ? "rgba(34,211,238,0.95)" : "rgba(251,191,36,0.95)";
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // particles
    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.pos.x, p.pos.y, p.size, p.size);
      ctx.restore();
    }

    // HUD overlay
    if (!state.started && !state.over) {
      overlay(ctx, state.w, state.h, "NEON INVADERS", "Enter/Start to play · ← → move · Space shoot");
    }
    if (state.paused) {
      overlay(ctx, state.w, state.h, "PAUSED", "Press P to resume");
    }
    if (state.over) {
      overlay(ctx, state.w, state.h, "GAME OVER", "Press R to restart");
    }
  }, [state]);

  return (
    <canvas
      ref={ref}
      className={
        "rounded-3xl border border-zinc-800 shadow-[0_0_70px_rgba(34,211,238,0.12)] " +
        (className ?? "")
      }
    />
  );
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x - 18, y + 10);
  ctx.lineTo(x + 18, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 6, y - 2, 12, 14);
}

function drawInvader(ctx: CanvasRenderingContext2D, x: number, y: number, type: number) {
  const s = type === 2 ? 16 : type === 1 ? 18 : 20;
  ctx.beginPath();
  ctx.roundRect(x - s, y - s * 0.6, s * 2, s * 1.2, 8);
  ctx.fill();
  // eyes
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(x - s * 0.5, y - 3, 5, 5);
  ctx.fillRect(x + s * 0.2, y - 3, 5, 5);
  ctx.restore();
}

function overlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string,
  subtitle: string
) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "700 34px ui-sans-serif";
  ctx.fillText(title, w / 2, h / 2 - 16);

  ctx.fillStyle = "rgba(103,232,249,0.85)";
  ctx.font = "500 14px ui-sans-serif";
  ctx.fillText(subtitle, w / 2, h / 2 + 18);
  ctx.restore();
}
