"use client";

import { useMemo, useState } from "react";

const tiers = {
  monthly: [
    { name: "Starter", price: "$19", detail: "For solo founders", cta: "Start free trial" },
    { name: "Growth", price: "$59", detail: "For scaling teams", cta: "Get Growth" },
    { name: "Scale", price: "$129", detail: "For multi-brand ops", cta: "Talk to sales" },
  ],
  yearly: [
    { name: "Starter", price: "$15", detail: "For solo founders", cta: "Start free trial" },
    { name: "Growth", price: "$47", detail: "For scaling teams", cta: "Get Growth" },
    { name: "Scale", price: "$103", detail: "For multi-brand ops", cta: "Talk to sales" },
  ],
};

const faqs = [
  ["Can I launch without writing prompts?", "Yes. You can pick one of 120+ tested workflows and customize with plain-language rules."],
  ["Does it work with our existing tools?", "It plugs into Slack, Notion, HubSpot, Gmail, and more using no-code connectors."],
  ["Can we use our own models?", "Absolutely. Bring OpenAI, Anthropic, or self-hosted endpoints with per-workflow routing."],
];

export default function Home() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState(0);

  const currentTiers = useMemo(() => tiers[billing], [billing]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-5 pb-20">
        <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
          <div className="flex items-center justify-between py-4">
            <div className="text-lg font-semibold tracking-tight">NovaPilot AI</div>
            <button className="rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400">Book demo</button>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/30 px-6 py-16 text-center sm:px-10">
          <p className="mb-4 inline-block rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">#1 AI Growth OS</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">Launch AI automations that actually move revenue</h1>
          <p className="mx-auto mt-5 max-w-2xl text-slate-300">NovaPilot helps SaaS teams build growth loops, support copilots, and conversion funnels in days—not quarters.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Start 14-day trial</button>
            <button className="rounded-full border border-slate-700 px-6 py-3 font-semibold hover:border-slate-500">Watch 90s tour</button>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["+38%", "Avg. lift in trial-to-paid"],
            ["6.2h", "Saved per rep weekly"],
            ["99.95%", "Uptime for automation runs"],
          ].map(([metric, label]) => (
            <div key={metric} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="text-3xl font-semibold text-cyan-300">{metric}</div>
              <div className="mt-1 text-sm text-slate-300">{label}</div>
            </div>
          ))}
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">Built for modern GTM teams</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Smart Playbooks", "Prebuilt campaign flows that adapt by segment performance."],
              ["Revenue Copilot", "Surface churn risks and expansion opportunities automatically."],
              ["Intent Signals", "Track high-intent behavior and trigger personalized outreach."],
              ["Experiment Hub", "Run A/B variants with AI-generated creative and insights."],
            ].map(([title, desc]) => (
              <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Simple pricing that scales with you</h2>
            <div className="inline-flex rounded-full border border-slate-700 p-1 text-sm">
              <button onClick={() => setBilling("monthly")} className={`rounded-full px-4 py-1 ${billing === "monthly" ? "bg-cyan-400 text-slate-950" : "text-slate-300"}`}>Monthly</button>
              <button onClick={() => setBilling("yearly")} className={`rounded-full px-4 py-1 ${billing === "yearly" ? "bg-cyan-400 text-slate-950" : "text-slate-300"}`}>Yearly (save 20%)</button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {currentTiers.map((tier) => (
              <div key={tier.name} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <h3 className="font-semibold">{tier.name}</h3>
                <p className="mt-2 text-3xl font-semibold">{tier.price}<span className="text-sm text-slate-400"> /seat</span></p>
                <p className="mt-2 text-sm text-slate-300">{tier.detail}</p>
                <button className="mt-4 w-full rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-950 hover:bg-white">{tier.cta}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {faqs.map(([q, a], i) => (
              <div key={q} className="rounded-xl border border-slate-800 bg-slate-900">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <span>{q}</span>
                  <span className="text-cyan-300">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-sm text-slate-300">{a}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
