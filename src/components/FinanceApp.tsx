"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { applyTheme, loadState, saveState } from "../lib/storage";
import { demoState } from "../lib/demo";
import { Budget, FinanceState, Transaction, TxnType } from "../lib/types";
import {
  classNames,
  clamp,
  downloadJson,
  formatMoney,
  formatMoney2,
  monthKey,
  parseCsv,
  parseNumber,
  uid,
} from "../lib/utils";

type View = "dashboard" | "transactions" | "budgets" | "import";

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

function monthLabel(k: string) {
  const [y, m] = k.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" }).format(d);
  } catch {
    return k;
  }
}

function groupBy<T, K extends string>(items: T[], keyFn: (t: T) => K) {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = keyFn(it);
    m.set(k, [...(m.get(k) ?? []), it]);
  }
  return m;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max <= 0 ? 0 : clamp((value / max) * 100, 0, 100);
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{label}</div>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{formatMoney2(value)}</div>
        </div>
        <div className="mt-1 h-2 rounded-full bg-black/5 dark:bg-white/10">
          <div className={classNames("h-2 rounded-full bg-gradient-to-r", color)} style={{ width: `${w}%` }} />
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 240;
  const h = 48;
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1e-6, max - min);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={d} fill="none" stroke="rgba(99,102,241,0.9)" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

export default function FinanceApp() {
  const seeded = useRef(false);
  const [state, setState] = useState<FinanceState>(() => demoState());
  const [view, setView] = useState<View>("dashboard");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TxnType | "all">("all");
  const [monthFilter, setMonthFilter] = useState<string | "all">("all");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const stored = loadState();
    if (stored) setState(stored);
  }, []);

  useEffect(() => {
    saveState(state);
    applyTheme(state.themeMode);
  }, [state]);

  const months = useMemo(() => {
    const set = new Set(state.transactions.map((t) => monthKey(t.date)));
    return Array.from(set).sort();
  }, [state.transactions]);

  const monthNow = months[months.length - 1] ?? "all";

  const txFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.transactions
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) => (monthFilter === "all" ? true : monthKey(t.date) === monthFilter))
      .filter((t) => (q ? (t.description + " " + t.category + " " + t.account).toLowerCase().includes(q) : true));
  }, [state.transactions, query, typeFilter, monthFilter]);

  const currentMonthTx = useMemo(() => {
    const mk = monthNow;
    return state.transactions.filter((t) => monthKey(t.date) === mk);
  }, [state.transactions, monthNow]);

  const income = sum(currentMonthTx.filter((t) => t.type === "income").map((t) => t.amount));
  const expenses = sum(currentMonthTx.filter((t) => t.type === "expense").map((t) => t.amount));
  const net = income - expenses;

  const byCategory = useMemo(() => {
    const exp = currentMonthTx.filter((t) => t.type === "expense" && t.category !== "Transfer");
    const m = new Map<string, number>();
    for (const t of exp) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
  }, [currentMonthTx]);

  const cashflowSeries = useMemo(() => {
    // monthly net series
    const grouped = groupBy(state.transactions, (t) => monthKey(t.date));
    const keys = Array.from(grouped.keys()).sort();
    const pts = keys.map((k) => {
      const tx = grouped.get(k) ?? [];
      const inc = sum(tx.filter((t) => t.type === "income").map((t) => t.amount));
      const exp = sum(tx.filter((t) => t.type === "expense").map((t) => t.amount));
      return inc - exp;
    });
    return { keys, pts };
  }, [state.transactions]);

  const budgetHealth = useMemo(() => {
    const mk = monthNow;
    const exp = state.transactions.filter((t) => t.type === "expense" && monthKey(t.date) === mk);
    const spent = new Map<string, number>();
    for (const t of exp) spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
    return state.budgets.map((b) => ({
      budget: b,
      spent: spent.get(b.category) ?? 0,
    }));
  }, [state.transactions, state.budgets, monthNow]);

  function setThemeMode(mode: FinanceState["themeMode"]) {
    setState((s) => ({ ...s, themeMode: mode }));
  }

  function resetDemo() {
    if (!confirm("Reset to demo data? This will replace your current local data.")) return;
    setState(demoState());
  }

  function exportJson() {
    downloadJson(`finance-export-${new Date().toISOString().slice(0, 10)}.json`, state);
  }

  async function importJson(file: File) {
    const raw = await file.text();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) throw new Error("bad");
      setState(parsed as FinanceState);
      setView("dashboard");
    } catch {
      alert("Import failed: not a valid export file.");
    }
  }

  async function importCsv(file: File) {
    const raw = await file.text();
    const rows = parseCsv(raw);
    if (!rows.length) return;

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);

    // expected columns: date, description, amount, type, category, account
    const iDate = idx("date");
    const iDesc = idx("description");
    const iAmt = idx("amount");
    const iType = idx("type");
    const iCat = idx("category");
    const iAcc = idx("account");

    if ([iDate, iDesc, iAmt].some((x) => x < 0)) {
      alert("CSV needs at least columns: date, description, amount (optional: type, category, account)");
      return;
    }

    const tx: Transaction[] = [];
    for (const r of rows.slice(1)) {
      const date = (r[iDate] ?? "").trim().slice(0, 10);
      const description = (r[iDesc] ?? "").trim();
      const amt = parseNumber(r[iAmt] ?? "");
      if (!date || !description || !Number.isFinite(amt)) continue;

      const typeRaw = (iType >= 0 ? (r[iType] ?? "") : "").trim().toLowerCase();
      const type: TxnType = typeRaw === "income" || typeRaw === "transfer" ? (typeRaw as TxnType) : amt >= 0 ? "expense" : "expense";
      const amount = Math.abs(amt);

      const category = (iCat >= 0 ? r[iCat] : "")?.trim() || (type === "income" ? "Income" : "Uncategorized");
      const account = (iAcc >= 0 ? r[iAcc] : "")?.trim() || "Checking";

      tx.push({ id: uid("tx"), date, description, amount, type, category, account });
    }

    if (!tx.length) {
      alert("No rows imported.");
      return;
    }

    setState((s) => {
      const merged = [...tx, ...s.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
      const categories = Array.from(new Set([...s.categories, ...merged.map((t) => t.category)])).sort();
      const accounts = Array.from(new Set([...s.accounts, ...merged.map((t) => t.account)])).sort();
      return { ...s, transactions: merged, categories, accounts };
    });

    setToast(`Imported ${tx.length} transactions from CSV`);
    window.setTimeout(() => setToast(null), 1500);
  }

  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-[radial-gradient(90%_70%_at_10%_0%,rgba(16,185,129,0.14),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(90%_70%_at_10%_0%,rgba(16,185,129,0.20),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(99,102,241,0.24),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">LedgerLens</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Personal finance tracker • local-first • CSV import • dashboards</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setView("dashboard")}
              className={classNames(
                "rounded-full border px-3 py-1 text-[11px] font-semibold",
                view === "dashboard" ? "border-indigo-500/35 bg-indigo-500/10" : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10"
              )}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView("transactions")}
              className={classNames(
                "rounded-full border px-3 py-1 text-[11px] font-semibold",
                view === "transactions" ? "border-indigo-500/35 bg-indigo-500/10" : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10"
              )}
            >
              Transactions
            </button>
            <button
              onClick={() => setView("budgets")}
              className={classNames(
                "rounded-full border px-3 py-1 text-[11px] font-semibold",
                view === "budgets" ? "border-indigo-500/35 bg-indigo-500/10" : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10"
              )}
            >
              Budgets
            </button>
            <button
              onClick={() => setView("import")}
              className={classNames(
                "rounded-full border px-3 py-1 text-[11px] font-semibold",
                view === "import" ? "border-indigo-500/35 bg-indigo-500/10" : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10"
              )}
            >
              Import/Export
            </button>

            <div className="hidden sm:block h-6 w-px bg-black/10 dark:bg-white/10" />
            <button
              onClick={exportJson}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Export
            </button>
            <button
              onClick={resetDemo}
              className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
            >
              Reset demo
            </button>
          </div>
        </header>

        {toast ? (
          <div className="mb-4 rounded-2xl border border-black/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">{toast}</div>
        ) : null}

        {view === "dashboard" ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[420px_1fr]">
            <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">This month</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-300">{monthNow === "all" ? "—" : monthLabel(monthNow)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setThemeMode("system")}
                    className={classNames("rounded-lg border px-2 py-1 text-[11px] font-semibold", state.themeMode === "system" ? "border-indigo-500/35 bg-indigo-500/10" : "border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/10")}
                  >
                    System
                  </button>
                  <button
                    onClick={() => setThemeMode("light")}
                    className={classNames("rounded-lg border px-2 py-1 text-[11px] font-semibold", state.themeMode === "light" ? "border-indigo-500/35 bg-indigo-500/10" : "border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/10")}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setThemeMode("dark")}
                    className={classNames("rounded-lg border px-2 py-1 text-[11px] font-semibold", state.themeMode === "dark" ? "border-indigo-500/35 bg-indigo-500/10" : "border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/10")}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Income</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-200">{formatMoney(income)}</div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Expenses</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-rose-700 dark:text-rose-200">{formatMoney(expenses)}</div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Net</div>
                  <div className={classNames("mt-2 text-3xl font-semibold tracking-tight", net >= 0 ? "text-indigo-700 dark:text-indigo-200" : "text-amber-800 dark:text-amber-200")}>
                    {formatMoney(net)}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Cashflow trend</div>
                  <div className="mt-3">
                    <Sparkline points={cashflowSeries.pts} />
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-300">Monthly net (income − expenses)</div>
                </div>
              </div>
            </aside>

            <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
              <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
                <div className="text-sm font-semibold tracking-tight">Spending breakdown</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300">Top categories (expenses only, excluding transfers)</div>
              </div>
              <div className="p-4">
                {byCategory.length ? (
                  <div className="space-y-3">
                    {byCategory.map(([cat, v], idx) => (
                      <Bar
                        key={cat}
                        label={cat}
                        value={v}
                        max={byCategory[0][1]}
                        color={idx % 2 === 0 ? "from-indigo-600 to-sky-400" : "from-rose-600 to-orange-400"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    No expenses yet.
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-sm font-semibold">Budgets (this month)</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {budgetHealth.map(({ budget, spent }) => {
                      const pct = budget.monthlyLimit ? clamp((spent / budget.monthlyLimit) * 100, 0, 200) : 0;
                      return (
                        <div key={budget.id} className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold">{budget.category}</div>
                            <div className="text-xs font-semibold">{formatMoney2(spent)} / {formatMoney2(budget.monthlyLimit)}</div>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-black/5 dark:bg-white/10">
                            <div
                              className={classNames(
                                "h-2 rounded-full",
                                pct < 80
                                  ? "bg-emerald-600"
                                  : pct < 100
                                  ? "bg-amber-500"
                                  : "bg-rose-600"
                              )}
                              style={{ width: `${clamp(pct, 0, 100)}%` }}
                            />
                          </div>
                          {pct >= 100 ? <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-200">Over budget</div> : <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-300">{Math.round(pct)}%</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </main>
          </div>
        ) : null}

        {view === "transactions" ? (
          <div className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight">Transactions</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300">Search, filter by month/type</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-56 rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs outline-none ring-indigo-500/20 focus:ring-4 dark:border-white/10 dark:bg-white/5"
                  />
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value as any)}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold dark:border-white/10 dark:bg-white/10"
                  >
                    <option value="all">All months</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {monthLabel(m)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold dark:border-white/10 dark:bg-white/10"
                  >
                    <option value="all">All types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="overflow-auto rounded-2xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white/80 text-left text-xs font-semibold text-zinc-600 backdrop-blur dark:bg-zinc-950/60 dark:text-zinc-300">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Account</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txFiltered.slice(0, 250).map((t) => (
                      <tr key={t.id} className="border-t border-black/5 dark:border-white/10">
                        <td className="px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t.date}</td>
                        <td className="px-3 py-2 font-semibold">{t.description}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">{t.category}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">{t.account}</td>
                        <td className={classNames("px-3 py-2 text-right font-semibold", t.type === "income" ? "text-emerald-700 dark:text-emerald-200" : t.type === "expense" ? "text-rose-700 dark:text-rose-200" : "text-indigo-700 dark:text-indigo-200")}>
                          {t.type === "expense" ? "−" : t.type === "income" ? "+" : ""}
                          {formatMoney2(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-300">Showing up to 250 rows.</div>
            </div>
          </div>
        ) : null}

        {view === "budgets" ? (
          <BudgetsView
            categories={state.categories}
            budgets={state.budgets}
            onChange={(budgets) => setState((s) => ({ ...s, budgets }))}
          />
        ) : null}

        {view === "import" ? (
          <div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="text-sm font-semibold">Import / Export</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">All data stays in your browser (localStorage). No servers.</div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Import CSV</div>
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                  Expected headers: <span className="font-mono">date, description, amount, type, category, account</span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Choose CSV…
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="text/csv,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importCsv(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Import JSON export</div>
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">Use a file exported from LedgerLens.</div>
                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "application/json";
                    input.onchange = () => {
                      const f = input.files?.[0];
                      if (f) void importJson(f);
                    };
                    input.click();
                  }}
                  className="mt-3 rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10"
                >
                  Choose JSON…
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4 text-xs dark:border-white/10 dark:bg-white/5">
              <div className="font-semibold">Pro tip</div>
              <div className="mt-1 text-zinc-600 dark:text-zinc-300">
                Want to try your own bank export? Map columns to the expected headers and import.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BudgetsView({
  categories,
  budgets,
  onChange,
}: {
  categories: string[];
  budgets: Budget[];
  onChange: (b: Budget[]) => void;
}) {
  const [cat, setCat] = useState(categories.find((c) => c !== "Transfer") ?? "Food");
  const [limit, setLimit] = useState("500");

  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
      <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
        <div className="text-sm font-semibold tracking-tight">Budgets</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-300">Set monthly category limits.</div>
      </div>
      <div className="p-4">
        <div className="grid gap-2 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10 sm:grid-cols-3">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-white/10"
          >
            {categories
              .filter((c) => c !== "Transfer")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
          <input
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Monthly limit"
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-white/10"
          />
          <button
            onClick={() => {
              const n = parseNumber(limit);
              if (!Number.isFinite(n) || n <= 0) return;
              const existing = budgets.find((b) => b.category === cat);
              if (existing) {
                onChange(budgets.map((b) => (b.category === cat ? { ...b, monthlyLimit: n } : b)));
              } else {
                onChange([{ id: uid("b"), category: cat, monthlyLimit: n }, ...budgets]);
              }
            }}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Save
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <div key={b.id} className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{b.category}</div>
                <button
                  onClick={() => onChange(budgets.filter((x) => x.id !== b.id))}
                  className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{formatMoney2(b.monthlyLimit)}</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">per month</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
