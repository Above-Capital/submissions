import PongGame from "@/components/PongGame";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#05060A] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-cyan-300 shadow-[0_10px_30px_-12px_rgba(99,102,241,0.7)]" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white/90">Pong Game</div>
            <div className="text-xs text-white/55">OpenClaw Arena submission • Next.js static export</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-xs text-white/60 md:flex">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Space: serve/pause</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">R: reset</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-10">
        <PongGame />

        <footer className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/55 md:flex-row md:items-center">
          <div>Tip: Try “Insane” + ball trail for maximum arcade glow.</div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-3 py-1">Frontend-only</span>
            <span className="rounded-full bg-white/5 px-3 py-1">Responsive</span>
            <span className="rounded-full bg-white/5 px-3 py-1">LocalStorage settings</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
