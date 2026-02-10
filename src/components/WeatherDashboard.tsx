"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedWeatherIcon from "./AnimatedWeatherIcon";
import WindDial from "./WindDial";
import { geocode, getWeather } from "../lib/openmeteo";
import { Location, WeatherBundle } from "../lib/types";
import { loadFavs, loadLast, saveFavs, saveLast } from "../lib/storage";
import { classNames, fmtKph, fmtMm, fmtTempC, formatDay, formatHour } from "../lib/utils";

function niceName(l: Location) {
  const bits = [l.name, l.admin1, l.country].filter(Boolean);
  return bits.join(", ");
}

export default function WeatherDashboard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [active, setActive] = useState<Location | null>(null);

  const [favs, setFavs] = useState<Location[]>([]);

  const [bundle, setBundle] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lastFetchRef = useRef<string>("");

  // init
  useEffect(() => {
    const f = loadFavs();
    setFavs(f);
    const last = loadLast();
    if (last) setActive(last);
  }, []);

  // persist favs
  useEffect(() => {
    saveFavs(favs);
  }, [favs]);

  // fetch weather when active changes
  useEffect(() => {
    if (!active) return;
    saveLast(active);

    const key = `${active.lat},${active.lon},${active.tz}`;
    if (lastFetchRef.current === key && bundle) return;

    let cancelled = false;
    setLoading(true);
    setErr(null);
    getWeather(active)
      .then((b) => {
        if (cancelled) return;
        setBundle(b);
        lastFetchRef.current = key;
      })
      .catch(() => {
        if (cancelled) return;
        setErr("Couldn’t fetch weather (Open-Meteo). Try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  async function doSearch() {
    setErr(null);
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const r = await geocode(q);
      setResults(r);
    } catch {
      setErr("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function toggleFav(loc: Location) {
    const exists = favs.some((f) => f.lat === loc.lat && f.lon === loc.lon && f.name === loc.name);
    setFavs((prev) => (exists ? prev.filter((f) => !(f.lat === loc.lat && f.lon === loc.lon && f.name === loc.name)) : [loc, ...prev].slice(0, 12)));
  }

  function isFav(loc: Location) {
    return favs.some((f) => f.lat === loc.lat && f.lon === loc.lon && f.name === loc.name);
  }

  const hourlyNext = useMemo(() => {
    if (!bundle) return [];
    return bundle.hourly.slice(0, 18);
  }, [bundle]);

  const maxTemp = useMemo(() => {
    const xs = hourlyNext.map((h) => h.tempC);
    return xs.length ? Math.max(...xs) : 1;
  }, [hourlyNext]);
  const minTemp = useMemo(() => {
    const xs = hourlyNext.map((h) => h.tempC);
    return xs.length ? Math.min(...xs) : 0;
  }, [hourlyNext]);

  const tempRange = Math.max(1, maxTemp - minTemp);

  return (
    <div className="min-h-dvh bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.16),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.24),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.20),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">AuroraWX</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Weather dashboard • animated icons • client-side Open‑Meteo</div>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-300">
            Tip: search a city, then ⭐ it. Favorites persist in localStorage.
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Find a place</div>
            <div className="mt-2 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void doSearch();
                }}
                placeholder="e.g., New York, Tokyo, Reykjavik"
                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
              />
              <button onClick={() => void doSearch()} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                Go
              </button>
            </div>

            {err ? <div className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-200">{err}</div> : null}

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Results</div>
              <div className="mt-2 space-y-2">
                {results.length ? (
                  results.map((r) => (
                    <div key={r.id} className="rounded-xl border border-black/10 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                      <button
                        onClick={() => setActive(r)}
                        className="block w-full text-left"
                      >
                        <div className="text-sm font-semibold">{niceName(r)}</div>
                        <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                          {r.lat.toFixed(2)}, {r.lon.toFixed(2)} • {r.tz}
                        </div>
                      </button>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => toggleFav(r)}
                          className={classNames(
                            "rounded-lg border px-2 py-1 text-[11px] font-semibold",
                            isFav(r)
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                              : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                          )}
                        >
                          {isFav(r) ? "★ Favorited" : "☆ Favorite"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    Search to see results.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Favorites</div>
              <div className="mt-2 space-y-2">
                {favs.length ? (
                  favs.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                      <button onClick={() => setActive(f)} className="min-w-0 flex-1 text-left">
                        <div className="line-clamp-1 text-sm font-semibold">{niceName(f)}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-300">{f.tz}</div>
                      </button>
                      <button
                        onClick={() => toggleFav(f)}
                        className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    No favorites yet.
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="text-sm font-semibold tracking-tight">{active ? niceName(active) : "Pick a location"}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                {active ? `Timezone: ${active.tz}` : "Use search or a favorite."}
              </div>
            </div>

            <div className="p-4">
              {!active ? (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                  Start by searching for a city.
                </div>
              ) : loading && !bundle ? (
                <div className="rounded-2xl border border-black/10 bg-white/60 p-6 text-sm dark:border-white/10 dark:bg-white/5">Loading…</div>
              ) : bundle ? (
                <>
                  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Now</div>
                          <div className="mt-1 text-4xl font-semibold tracking-tight">{fmtTempC(bundle.now.tempC)}</div>
                          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Feels like {fmtTempC(bundle.now.apparentC)}</div>
                        </div>
                        <AnimatedWeatherIcon code={bundle.now.code} isDay={bundle.now.isDay} className="h-20 w-20" />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-black/10 bg-white/60 p-2 dark:border-white/10 dark:bg-white/10">
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-300">Wind</div>
                          <div className="font-semibold">{fmtKph(bundle.now.windKph)}</div>
                        </div>
                        <div className="rounded-xl border border-black/10 bg-white/60 p-2 dark:border-white/10 dark:bg-white/10">
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-300">Precip</div>
                          <div className="font-semibold">{fmtMm(bundle.now.precipMm)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Wind direction</div>
                      <div className="mt-3 flex items-center gap-3">
                        <WindDial dirDeg={bundle.now.windDir} />
                        <div className="text-xs text-zinc-600 dark:text-zinc-300">
                          <div>
                            Dir: <span className="font-semibold">{Math.round(bundle.now.windDir)}°</span>
                          </div>
                          <div className="mt-1">Humidity: <span className="font-semibold">{bundle.now.humidity ?? "—"}%</span></div>
                          <div className="mt-1">Clouds: <span className="font-semibold">{bundle.now.cloudCover ?? "—"}%</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Next 18 hours</div>
                      <div className="mt-3 flex items-end gap-2 overflow-x-auto pb-1">
                        {hourlyNext.map((h) => {
                          const t = (h.tempC - minTemp) / tempRange;
                          const height = 18 + t * 46;
                          return (
                            <div key={h.time} className="flex w-10 flex-col items-center gap-2">
                              <div className="h-8 w-8">
                                <AnimatedWeatherIcon code={h.code} isDay={bundle.now.isDay} />
                              </div>
                              <div className="w-full rounded-xl bg-black/5 dark:bg-white/10" style={{ height: 72 }}>
                                <div
                                  className="mx-auto mt-auto w-3 rounded-xl bg-indigo-600/80"
                                  style={{ height, transform: "translateY(72px)", animation: "rise 650ms ease forwards" }}
                                />
                              </div>
                              <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">{formatHour(h.time, active.tz)}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-300">Bars show relative temperature trend.</div>
                    </div>
                  </section>

                  <section className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">7‑day outlook</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {bundle.daily.map((d) => (
                        <div key={d.date} className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold">{formatDay(d.date, active.tz)}</div>
                              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{fmtMm(d.precipMm)}</div>
                            </div>
                            <div className="h-12 w-12">
                              <AnimatedWeatherIcon code={d.code} isDay={true} />
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-sm font-semibold">
                            <span className="text-rose-600 dark:text-rose-200">{fmtTempC(d.tMaxC)}</span>
                            <span className="text-indigo-600 dark:text-indigo-200">{fmtTempC(d.tMinC)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="rounded-2xl border border-black/10 bg-white/60 p-6 text-sm dark:border-white/10 dark:bg-white/5">
                  No data yet.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @keyframes rise { to { transform: translateY(calc(72px - var(--h, 0px))); } }
        @keyframes floaty { 0%,100%{ transform: translateY(0px);} 50%{ transform: translateY(-3px);} }
        .animate-float { animation: floaty 3.2s ease-in-out infinite; }
        @keyframes spinSlow { to { transform: rotate(360deg);} }
        .animate-spin-slow { animation: spinSlow 12s linear infinite; }
        @keyframes pulseSoft { 0%,100%{ transform: scale(1);} 50%{ transform: scale(1.04);} }
        .animate-pulse-soft { animation: pulseSoft 2.8s ease-in-out infinite; }
        @keyframes drop { 0%{ opacity: 0; transform: translateY(-2px);} 20%{opacity:1;} 100%{ opacity:0; transform: translateY(12px);} }
        .animate-drop1{ animation: drop 900ms linear infinite; }
        .animate-drop2{ animation: drop 900ms linear infinite 200ms; }
        .animate-drop3{ animation: drop 900ms linear infinite 420ms; }
        .animate-drop4{ animation: drop 900ms linear infinite 640ms; }
        @keyframes flake { 0%{ opacity: 0; transform: translateY(-2px);} 20%{opacity:1;} 100%{ opacity:0; transform: translateY(10px) translateX(2px);} }
        .animate-flake1{ animation: flake 1100ms linear infinite; }
        .animate-flake2{ animation: flake 1100ms linear infinite 250ms; }
        .animate-flake3{ animation: flake 1100ms linear infinite 520ms; }
        .animate-flake4{ animation: flake 1100ms linear infinite 760ms; }
        @keyframes zap { 0%,100%{ transform: translateY(0px) skewX(0deg);} 50%{ transform: translateY(1px) skewX(-6deg);} }
        .animate-zap { animation: zap 520ms ease-in-out infinite; filter: drop-shadow(0 8px 14px rgba(250,204,21,0.35)); }
      `}</style>
    </div>
  );
}
