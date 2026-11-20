"use client";

import { useEffect, useRef, useState } from "react";

const fragments = [
  { left: "8%", delay: "0ms", size: "6px" },
  { left: "17%", delay: "70ms", size: "4px" },
  { left: "26%", delay: "120ms", size: "7px" },
  { left: "34%", delay: "30ms", size: "5px" },
  { left: "43%", delay: "180ms", size: "4px" },
  { left: "52%", delay: "80ms", size: "6px" },
  { left: "62%", delay: "220ms", size: "5px" },
  { left: "72%", delay: "45ms", size: "7px" },
  { left: "81%", delay: "145ms", size: "4px" },
  { left: "91%", delay: "100ms", size: "6px" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "spark") return <svg {...common}><path d="m12 2 1.8 7.2L21 12l-7.2 2.8L12 22l-1.8-7.2L3 12l7.2-2.8L12 2Z" /><path d="m19 2 .7 2.3L22 5l-2.3.7L19 8l-.7-2.3L16 5l2.3-.7L19 2Z" /></svg>;
  if (name === "sound") return <svg {...common}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  if (name === "undo") return <svg {...common}><path d="M9 14 4 9l5-5" /><path d="M4 9h9a7 7 0 0 1 0 14h-1" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === "leaf") return <svg {...common}><path d="M20 4c-9 0-15 4-15 11a5 5 0 0 0 5 5c7 0 11-6 10-16Z" /><path d="M4 21c3-5 6-8 12-11" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
}

export default function Home() {
  const [released, setReleased] = useState(false);
  const [holding, setHolding] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [releaseCount, setReleaseCount] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedCount = Number(window.localStorage.getItem("last-row-count") || "0");
    const savedReleased = window.localStorage.getItem("last-row-released") === "true";
    const frame = window.requestAnimationFrame(() => {
      setReleaseCount(savedCount);
      setReleased(savedReleased);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const chime = () => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.09, now + index * 0.12 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 1.1);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + index * 0.12);
        oscillator.stop(now + index * 0.12 + 1.15);
      });
      window.setTimeout(() => void ctx.close(), 1800);
    } catch {
      // Audio is an optional flourish; the interaction still completes without it.
    }
  };

  const completeRelease = () => {
    setHolding(false);
    setReleased(true);
    setShowNote(true);
    const nextCount = releaseCount + 1;
    setReleaseCount(nextCount);
    window.localStorage.setItem("last-row-count", String(nextCount));
    window.localStorage.setItem("last-row-released", "true");
    chime();
  };

  const beginHold = () => {
    if (released || holding) return;
    setHolding(true);
    timer.current = setTimeout(completeRelease, 1450);
  };

  const endHold = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  const restore = () => {
    if (timer.current) clearTimeout(timer.current);
    setReleased(false);
    setHolding(false);
    setShowNote(false);
    window.localStorage.setItem("last-row-released", "false");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      beginHold();
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") endHold();
  };

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="The Last Row home">
          <span className="brand-mark"><span /></span>
          <span className="brand-name">stillroom<span>.</span></span>
        </a>
        <div className="topbar-center"><span className="live-dot" /> A QUIET PLACE FOR CLEANUP</div>
        <button className="sound-toggle" onClick={() => setSoundOn((value) => !value)} aria-pressed={soundOn}>
          <Icon name="sound" size={16} /><span>{soundOn ? "Sound on" : "Sound off"}</span>
        </button>
      </nav>

      <section className="intro" id="home">
        <div className="intro-kicker"><span className="kicker-line" /> DIGITAL HOUSEKEEPING · No. 01 <span className="kicker-line" /></div>
        <h1>Make room for <em>what&apos;s next.</em></h1>
        <p className="intro-copy">Some things have served their purpose. Give one little leftover<br className="desktop-break" /> the kindest goodbye it never knew it needed.</p>
      </section>

      <section className={`workbench ${released ? "is-released" : ""}`} aria-label="Cleanup workbench">
        <div className="workbench-topline">
          <div className="workbench-label"><span className="tiny-stamp">01</span><span>THE CLEANUP TABLE</span></div>
          <div className="date-label">SESSION 01 <span>·</span> {releaseCount > 0 ? `${releaseCount} RELEASE${releaseCount === 1 ? "" : "S"} MADE` : "ONE THING, GENTLY"}</div>
        </div>

        <div className="workbench-grid">
          <div className="data-side">
            <div className="table-heading">
              <div><span className="overline">A FRAGMENT LEFT BEHIND</span><h2>One last row.</h2></div>
              <div className="rows-count"><strong>{released ? "00" : "01"}</strong><span>ROW<br />REMAINING</span></div>
            </div>

            <div className={`data-table ${released ? "row-gone" : ""}`}>
              <div className="table-header"><span>NAME</span><span>TYPE</span><span>LAST SEEN</span><span>STATE</span></div>
              {!released ? (
                <div className="data-row">
                  <div className="row-name"><span className="row-orbit"><span /></span><span><strong>test_row_001</strong><small>Created for a moment that passed</small></span></div>
                  <span className="row-type">placeholder</span>
                  <span className="row-date">Mar 22, 2023</span>
                  <span className="row-state"><i /> waiting</span>
                </div>
              ) : (
                <div className="empty-row"><span className="empty-mark"><Icon name="check" size={18} /></span><span>The space is yours now.</span><span className="empty-rule" /></div>
              )}
            </div>

            <div className="table-foot"><span><span className="foot-dot" /> LOCAL PREVIEW · NO DATA LEAVES THIS PAGE</span><span>1 record <span className="foot-separator">/</span> 0 dependencies</span></div>

            <div className="record-note">
              <div className="note-icon"><Icon name="leaf" size={17} /></div>
              <div><strong>Just a test.</strong><p>A small placeholder from a past experiment. It&apos;s safe to let go.</p></div>
              <span className="note-id">ID · 0001</span>
            </div>
          </div>

          <aside className="ritual-side">
            <div className="ritual-head"><span className="overline">A MOMENT OF INTENTION</span><span className="ritual-number">01 / 01</span></div>
            {!released ? (
              <>
                <div className={`breath-orb ${holding ? "orb-active" : ""}`} aria-hidden="true"><span className="orb-core" /><span className="orb-ring ring-one" /><span className="orb-ring ring-two" /><span className="orb-glint" /></div>
                <h3>Ready when<br />you are.</h3>
                <p className="ritual-copy">Press and hold to release this row. Take your time — nothing here is in a hurry.</p>
                <button
                  className={`release-button ${holding ? "is-holding" : ""}`}
                  onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); beginHold(); }}
                  onPointerUp={endHold}
                  onPointerCancel={endHold}
                  onPointerLeave={endHold}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  onBlur={endHold}
                  aria-label="Press and hold to release the test row"
                  aria-pressed={holding}
                >
                  <span className="hold-fill" />
                  <span className="button-content"><span>{holding ? "LET IT GO…" : "PRESS & HOLD TO RELEASE"}</span><Icon name="arrow" size={17} /></span>
                </button>
                <div className="hold-hint"><span className="hold-dash" /> KEEP HOLDING FOR A BREATH <span className="hold-dash" /></div>
              </>
            ) : (
              <div className="release-complete" aria-live="polite">
                <div className="afterglow"><span className="afterglow-core"><Icon name="check" size={27} /></span>{fragments.map((fragment, index) => <i key={index} className="spark" style={{ left: fragment.left, animationDelay: fragment.delay, width: fragment.size, height: fragment.size }} />)}</div>
                <span className="overline complete-label">RELEASE RECORDED</span>
                <h3>And just like<br />that, <em>lighter.</em></h3>
                <p className="ritual-copy">One small thing, returned to the quiet. Notice the room it leaves behind.</p>
                <div className="release-receipt"><span>RELEASED</span><strong>test_row_001</strong><span className="receipt-check"><Icon name="check" size={14} /></span></div>
                <button className="restore-button" onClick={restore}><Icon name="undo" size={15} /> Bring it back <span>— if you need to</span></button>
              </div>
            )}
            <div className="ritual-footer"><span className="footer-spark"><Icon name="spark" size={14} /></span><span>EVERY ENDING MAKES A LITTLE SPACE.</span></div>
          </aside>
        </div>
      </section>

      <section className="afterword">
        <div className="afterword-rule" />
        <p>Not everything needs keeping.</p>
        <span>A gentle reminder from your cleanup table.</span>
        <div className="afterword-seal"><span className="seal-leaf"><Icon name="leaf" size={20} /></span><span>STILLROOM<br /><b>OBJECTS IN PEACE</b></span></div>
      </section>

      {showNote && <div className="sr-only" role="status">The test row was released. Your cleanup table feels lighter.</div>}
    </main>
  );
}
