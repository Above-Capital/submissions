"use client";

import React, { useEffect, useRef } from "react";
import type { GameState } from "@/lib/game";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function PongCanvas({
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
    g.addColorStop(0, "#05080f");
    g.addColorStop(1, "#061826");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    // center net
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#67e8f9";
    for (let y = 24; y < state.h - 24; y += 22) {
      ctx.fillRect(state.w / 2 - 2, y, 4, 12);
    }
    ctx.restore();

    // glow paddles
    const leftX = 34;
    const rightX = state.w - 34;
    const paddleW = state.paddleW;
    const paddleH = state.paddleH;

    ctx.save();
    ctx.shadowBlur = 22;
    ctx.shadowColor = "rgba(34,211,238,0.85)";
    ctx.fillStyle = "rgba(34,211,238,0.95)";

    roundRect(
      ctx,
      leftX - paddleW / 2,
      state.left.y - paddleH / 2,
      paddleW,
      paddleH,
      10
    );
    ctx.fill();

    roundRect(
      ctx,
      rightX - paddleW / 2,
      state.right.y - paddleH / 2,
      paddleW,
      paddleH,
      10
    );
    ctx.fill();
    ctx.restore();

    // ball
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(251,191,36,0.95)";
    ctx.fillStyle = "rgba(251,191,36,0.95)";
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // overlay
    if (!state.started) {
      overlay(ctx, state.w, state.h, "NEON PONG", "Press Start / Enter. W/S (left), ↑/↓ (right)" );
    } else if (state.paused) {
      overlay(ctx, state.w, state.h, "PAUSED", "Press P to resume" );
    }
  }, [state]);

  return (
    <canvas
      ref={ref}
      className={
        "rounded-3xl border border-zinc-800 shadow-[0_0_60px_rgba(34,211,238,0.12)] " +
        (className ?? "")
      }
    />
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
  ctx.font = "700 34px ui-sans-serif";
  ctx.fillText(title, w / 2, h / 2 - 16);

  ctx.fillStyle = "rgba(103,232,249,0.85)";
  ctx.font = "500 14px ui-sans-serif";
  ctx.fillText(subtitle, w / 2, h / 2 + 18);
  ctx.restore();
}
