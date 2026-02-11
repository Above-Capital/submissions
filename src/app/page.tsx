"use client";

import { useMemo, useState } from "react";

type Persona = "builder" | "analyst" | "creative" | "operator";

const SAMPLE = `# Alex Rivera

**Product Engineer** • New York, NY  
alex@example.com • linkedin.com/in/alexrivera

## Summary
I build delightful products at the intersection of engineering, design, and business strategy.

## Experience
### Senior Product Engineer — Nebula Labs (2021–Present)
- Led development of an AI workflow platform used by 120k monthly users.
- Improved onboarding conversion by 27% through UX and systems redesign.
- Partnered with design and GTM teams to ship weekly experiments.

### Software Engineer — Vertex Systems (2018–2021)
- Built internal tooling that reduced incident resolution time by 43%.
- Created observability dashboards and automated release checks.

## Skills
TypeScript, React, Next.js, Product Strategy, Design Systems, Analytics

## Education
B.S. Computer Science — University of Florida`;

function inferPersona(text: string): Persona {
  const t = text.toLowerCase();
  const score = {
    builder: (t.match(/build|engineer|ship|prototype|code|system/g) || []).length,
    analyst: (t.match(/data|analysis|metric|research|insight|model/g) || []).length,
    creative: (t.match(/design|brand|story|creative|visual|narrative/g) || []).length,
    operator: (t.match(/scale|process|operations|execute|delivery|program/g) || []).length,
  };
  return (Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] || "builder") as Persona;
}

function confidenceScore(text: string) {
  const hasSummary = /##\s+summary/i.test(text);
  const hasExp = /##\s+experience/i.test(text);
  const hasSkills = /##\s+skills/i.test(text);
  const bullets = (text.match(/^-\s+/gm) || []).length;
  const len = text.trim().length;

  let s = 45;
  if (hasSummary) s += 12;
  if (hasExp) s += 16;
  if (hasSkills) s += 8;
  if (bullets >= 4) s += 10;
  if (len >= 900) s += 9;
  return Math.min(100, s);
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-4xl font-black mb-2">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="mt-6 mb-2 text-xl font-bold uppercase tracking-wide text-white/90">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="mt-3 text-lg font-semibold">{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <li key={i} className="ml-5 list-disc text-white/90">{line.slice(2)}</li>;
    if (line.trim() === "") return <div key={i} className="h-2" />;

    const boldParts = line.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={idx}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={idx}>{part}</span>
      ),
    );

    return <p key={i} className="text-white/90 leading-relaxed">{boldParts}</p>;
  });
}

const themeMap: Record<Persona, { bg: string; accent: string; aura: string; label: string }> = {
  builder: {
    bg: "from-slate-900 via-blue-900 to-indigo-950",
    accent: "bg-cyan-300 text-slate-900",
    aura: "shadow-cyan-400/20",
    label: "Product Builder",
  },
  analyst: {
    bg: "from-zinc-900 via-emerald-900 to-teal-950",
    accent: "bg-emerald-300 text-zinc-900",
    aura: "shadow-emerald-400/20",
    label: "Insight Analyst",
  },
  creative: {
    bg: "from-fuchsia-900 via-violet-900 to-indigo-950",
    accent: "bg-pink-300 text-violet-900",
    aura: "shadow-pink-400/20",
    label: "Creative Storyteller",
  },
  operator: {
    bg: "from-amber-900 via-orange-900 to-zinc-950",
    accent: "bg-amber-300 text-zinc-900",
    aura: "shadow-amber-400/20",
    label: "Execution Operator",
  },
};

export default function Home() {
  const [md, setMd] = useState(SAMPLE);

  const persona = useMemo(() => inferPersona(md), [md]);
  const confidence = useMemo(() => confidenceScore(md), [md]);
  const theme = themeMap[persona];

  return (
    <main className={`min-h-screen bg-gradient-to-br ${theme.bg} p-4 text-white md:p-8`}>
      <div className="mx-auto max-w-7xl space-y-4">
        <header className={`rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl shadow-2xl ${theme.aura}`}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Narrative Resume Studio</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black md:text-4xl">Markdown Resume Builder</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${theme.accent}`}>{theme.label}</span>
          </div>
          <p className="mt-2 text-sm text-white/80">
            Your resume theme adapts in real-time to your voice, role, and emphasis.
          </p>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-white/80">
              <span>Confidence & pride score</span>
              <span>{confidence}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-white" style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/15 bg-black/20 p-4 backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Markdown Input</h2>
              <button onClick={() => setMd(SAMPLE)} className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
                Reset sample
              </button>
            </div>
            <textarea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              className="h-[66vh] w-full rounded-2xl border border-white/15 bg-zinc-950/60 p-4 font-mono text-sm leading-relaxed outline-none focus:border-cyan-300"
            />
          </article>

          <article className={`rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-2xl ${theme.aura}`}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-white/70">Live Narrative Preview</h2>
            <div className="h-[66vh] overflow-auto rounded-2xl border border-white/10 bg-black/25 p-5">
              {renderMarkdown(md)}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
