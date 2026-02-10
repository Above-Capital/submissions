"use client";

import { useMemo, useState } from "react";

type WeatherType = "sunny" | "cloudy" | "rain" | "storm" | "snow";

type CityForecast = {
  city: string;
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  uv: number;
  weather: WeatherType;
  hourly: { hour: string; temp: number; weather: WeatherType }[];
};

const data: CityForecast[] = [
  {
    city: "Miami",
    temp: 88,
    feels: 94,
    humidity: 72,
    wind: 12,
    uv: 9,
    weather: "sunny",
    hourly: [
      { hour: "Now", temp: 88, weather: "sunny" },
      { hour: "2 PM", temp: 91, weather: "sunny" },
      { hour: "4 PM", temp: 90, weather: "cloudy" },
      { hour: "6 PM", temp: 85, weather: "rain" },
      { hour: "8 PM", temp: 81, weather: "storm" },
    ],
  },
  {
    city: "Seattle",
    temp: 57,
    feels: 55,
    humidity: 86,
    wind: 7,
    uv: 2,
    weather: "rain",
    hourly: [
      { hour: "Now", temp: 57, weather: "rain" },
      { hour: "2 PM", temp: 58, weather: "rain" },
      { hour: "4 PM", temp: 59, weather: "cloudy" },
      { hour: "6 PM", temp: 56, weather: "rain" },
      { hour: "8 PM", temp: 54, weather: "cloudy" },
    ],
  },
  {
    city: "Denver",
    temp: 41,
    feels: 37,
    humidity: 54,
    wind: 18,
    uv: 5,
    weather: "snow",
    hourly: [
      { hour: "Now", temp: 41, weather: "snow" },
      { hour: "2 PM", temp: 39, weather: "snow" },
      { hour: "4 PM", temp: 36, weather: "cloudy" },
      { hour: "6 PM", temp: 33, weather: "snow" },
      { hour: "8 PM", temp: 31, weather: "snow" },
    ],
  },
];

function WeatherIcon({ type, large = false }: { type: WeatherType; large?: boolean }) {
  const size = large ? "h-28 w-28" : "h-12 w-12";

  if (type === "sunny") {
    return (
      <div className={`${size} relative`}>
        <div className="absolute inset-0 animate-spin-slow rounded-full border-4 border-yellow-300/50" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-b from-yellow-200 to-orange-400 shadow-[0_0_25px_#facc15]" />
      </div>
    );
  }

  if (type === "cloudy") {
    return (
      <div className={`${size} relative`}> 
        <div className="absolute left-2 top-5 h-5 w-5 rounded-full bg-slate-100/90" />
        <div className="absolute left-5 top-3 h-7 w-7 rounded-full bg-slate-100/95" />
        <div className="absolute left-9 top-5 h-5 w-5 rounded-full bg-slate-100/90" />
        <div className="absolute left-4 top-7 h-4 w-9 rounded-full bg-slate-100/95" />
      </div>
    );
  }

  if (type === "rain") {
    return (
      <div className={`${size} relative`}>
        <div className="absolute left-3 top-4 h-7 w-7 rounded-full bg-slate-100/95" />
        <div className="absolute left-8 top-6 h-6 w-6 rounded-full bg-slate-100/95" />
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute top-11 h-3 w-[2px] animate-rain rounded-full bg-cyan-300"
            style={{ left: `${18 + i * 11}px`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    );
  }

  if (type === "storm") {
    return (
      <div className={`${size} relative`}>
        <div className="absolute left-3 top-4 h-7 w-7 rounded-full bg-slate-100/95" />
        <div className="absolute left-8 top-6 h-6 w-6 rounded-full bg-slate-100/95" />
        <span className="absolute left-7 top-10 h-8 w-4 animate-pulse rounded-sm bg-gradient-to-b from-yellow-200 to-amber-400 [clip-path:polygon(50%_0%,100%_0,60%_55%,100%_55%,35%_100%,45%_62%,0_62%)]" />
      </div>
    );
  }

  return (
    <div className={`${size} relative`}>
      <div className="absolute left-3 top-4 h-7 w-7 rounded-full bg-slate-100/95" />
      <div className="absolute left-8 top-6 h-6 w-6 rounded-full bg-slate-100/95" />
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute top-11 h-2 w-2 animate-snow rounded-full bg-white"
          style={{ left: `${14 + i * 10}px`, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [cityIdx, setCityIdx] = useState(0);
  const info = data[cityIdx];

  const bg = useMemo(() => {
    switch (info.weather) {
      case "sunny":
        return "from-sky-400 via-cyan-500 to-blue-700";
      case "cloudy":
        return "from-slate-500 via-slate-700 to-slate-900";
      case "rain":
        return "from-indigo-600 via-slate-800 to-zinc-950";
      case "storm":
        return "from-violet-700 via-slate-900 to-black";
      case "snow":
        return "from-cyan-200 via-sky-400 to-indigo-700";
    }
  }, [info.weather]);

  return (
    <main className={`min-h-screen bg-gradient-to-br ${bg} p-4 text-white md:p-8`}>
      <style>{`
        @keyframes spin-slow { from {transform: rotate(0deg)} to {transform: rotate(360deg)} }
        @keyframes rain { 0% {transform: translateY(0); opacity: 0} 25%{opacity:1} 100% {transform: translateY(10px); opacity:0} }
        @keyframes snow { 0% {transform: translateY(0); opacity:0} 20%{opacity:1} 100% {transform: translateY(12px); opacity:0} }
        .animate-spin-slow { animation: spin-slow 7s linear infinite; }
        .animate-rain { animation: rain 1s ease-in infinite; }
        .animate-snow { animation: snow 1.2s ease-in infinite; }
      `}</style>

      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">AETHER WEATHER</p>
              <h1 className="text-3xl font-bold md:text-4xl">Animated Weather Dashboard</h1>
            </div>
            <div className="flex gap-2">
              {data.map((c, idx) => (
                <button
                  key={c.city}
                  onClick={() => setCityIdx(idx)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${idx === cityIdx ? "bg-white text-slate-900" : "bg-white/10 hover:bg-white/20"}`}
                >
                  {c.city}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <article className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
            <p className="text-sm text-white/80">Current conditions • {info.city}</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-7xl font-black leading-none">{info.temp}°</p>
                <p className="mt-2 text-white/80 capitalize">{info.weather}</p>
                <p className="text-sm text-white/70">Feels like {info.feels}°</p>
              </div>
              <WeatherIcon type={info.weather} large />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <Metric label="Humidity" value={`${info.humidity}%`} />
              <Metric label="Wind" value={`${info.wind} mph`} />
              <Metric label="UV" value={`${info.uv}`} />
            </div>
          </article>

          <article className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold">Next hours</h2>
            <div className="mt-4 space-y-3">
              {info.hourly.map((h) => (
                <div key={h.hour} className="flex items-center justify-between rounded-2xl bg-black/20 p-3">
                  <div>
                    <p className="text-sm text-white/70">{h.hour}</p>
                    <p className="text-xl font-bold">{h.temp}°</p>
                  </div>
                  <div className="scale-90">
                    <WeatherIcon type={h.weather} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-xs uppercase tracking-wider text-white/70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
