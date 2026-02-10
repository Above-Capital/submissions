"use client";

import { classNames } from "../lib/utils";

function codeGroup(code: number) {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([80, 81, 82].includes(code)) return "showers";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloudy";
}

function Sun({ night }: { night?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <defs>
        <radialGradient id="g" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={night ? "#a78bfa" : "#fde047"} />
          <stop offset="100%" stopColor={night ? "#7c3aed" : "#fb7185"} />
        </radialGradient>
      </defs>
      <g className="origin-center animate-spin-slow">
        {[...Array(8)].map((_, i) => (
          <rect
            key={i}
            x="31"
            y="3"
            width="2"
            height="10"
            rx="1"
            fill={night ? "rgba(167,139,250,0.7)" : "rgba(253,224,71,0.8)"}
            transform={`rotate(${i * 45} 32 32)`}
          />
        ))}
      </g>
      <circle cx="32" cy="32" r="14" fill="url(#g)" className="animate-pulse-soft" />
    </svg>
  );
}

function Cloud({ tone = "light" }: { tone?: "light" | "dark" }) {
  const fill = tone === "dark" ? "rgba(148,163,184,0.9)" : "rgba(255,255,255,0.9)";
  const stroke = tone === "dark" ? "rgba(30,41,59,0.35)" : "rgba(15,23,42,0.12)";
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <g className="translate-y-[1px] animate-float">
        <path
          d="M19 45c-6 0-10-4-10-9 0-4 2-7 6-8 1-8 8-14 16-14 7 0 13 4 15 11 5 1 9 5 9 11 0 6-5 9-11 9H19z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

function Rain({ heavy }: { heavy?: boolean }) {
  const drops = heavy ? 8 : 5;
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <g className="animate-float">
        <path
          d="M18 36c-5 0-9-3-9-8 0-3 2-6 5-7 1-7 8-12 15-12 7 0 12 4 14 10 5 1 8 5 8 10 0 5-4 7-9 7H18z"
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(15,23,42,0.12)"
          strokeWidth="2"
        />
      </g>
      <g>
        {[...Array(drops)].map((_, i) => (
          <path
            key={i}
            d="M0 0c2 3 2 6 0 9-2-3-2-6 0-9z"
            fill="rgba(59,130,246,0.85)"
            className={`animate-drop${(i % 4) + 1}`}
            transform={`translate(${18 + i * 5} ${36 + (i % 2) * 3})`}
          />
        ))}
      </g>
    </svg>
  );
}

function Snow() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <g className="animate-float">
        <path
          d="M18 36c-5 0-9-3-9-8 0-3 2-6 5-7 1-7 8-12 15-12 7 0 12 4 14 10 5 1 8 5 8 10 0 5-4 7-9 7H18z"
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(15,23,42,0.12)"
          strokeWidth="2"
        />
      </g>
      <g>
        {[...Array(8)].map((_, i) => (
          <circle
            key={i}
            cx={18 + i * 5}
            cy={42 + (i % 2) * 5}
            r={1.6}
            fill="rgba(255,255,255,0.95)"
            className={`animate-flake${(i % 4) + 1}`}
          />
        ))}
      </g>
    </svg>
  );
}

function Storm() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <g className="animate-float">
        <path
          d="M16 36c-5 0-9-3-9-8 0-3 2-6 5-7 1-7 8-12 15-12 7 0 12 4 14 10 5 1 9 5 9 10 0 6-5 7-10 7H16z"
          fill="rgba(203,213,225,0.95)"
          stroke="rgba(15,23,42,0.18)"
          strokeWidth="2"
        />
      </g>
      <path
        d="M30 38l-6 12h7l-3 12 12-18h-7l4-6z"
        fill="rgba(250,204,21,0.95)"
        className="animate-zap"
      />
      <g>
        {[...Array(4)].map((_, i) => (
          <path
            key={i}
            d="M0 0c2 3 2 6 0 9-2-3-2-6 0-9z"
            fill="rgba(59,130,246,0.75)"
            className={`animate-drop${(i % 4) + 1}`}
            transform={`translate(${20 + i * 7} ${40 + (i % 2) * 3})`}
          />
        ))}
      </g>
    </svg>
  );
}

export default function AnimatedWeatherIcon({
  code,
  isDay,
  className,
}: {
  code: number;
  isDay: boolean;
  className?: string;
}) {
  const g = codeGroup(code);
  return (
    <div className={classNames("relative", className)}>
      {g === "clear" ? <Sun night={!isDay} /> : null}
      {g === "partly" ? (
        <div className="relative">
          <div className="absolute -left-2 -top-2 h-14 w-14 opacity-90">
            <Sun night={!isDay} />
          </div>
          <div className="relative h-16 w-16">
            <Cloud tone={!isDay ? "dark" : "light"} />
          </div>
        </div>
      ) : null}
      {g === "cloudy" || g === "fog" ? <Cloud tone={!isDay ? "dark" : "light"} /> : null}
      {g === "drizzle" || g === "showers" ? <Rain /> : null}
      {g === "rain" ? <Rain heavy /> : null}
      {g === "snow" ? <Snow /> : null}
      {g === "storm" ? <Storm /> : null}
    </div>
  );
}
