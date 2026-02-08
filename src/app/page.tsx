"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Enemy = { id: number; x: number; y: number; alive: boolean };
type Bullet = { id: number; x: number; y: number; vy: number; enemy?: boolean };

type GameState = "ready" | "playing" | "won" | "lost";

const BOARD_W = 420;
const BOARD_H = 620;
const PLAYER_W = 48;
const PLAYER_H = 16;
const ENEMY_W = 30;
const ENEMY_H = 20;

const PLAYER_SPEED = 6;
const BULLET_SPEED = -9;
const ENEMY_BULLET_SPEED = 5;

const ENEMY_COLS = 8;
const ENEMY_ROWS = 5;
const ENEMY_GAP_X = 14;
const ENEMY_GAP_Y = 14;

function createEnemies(): Enemy[] {
  const startX = 26;
  const startY = 70;
  const enemies: Enemy[] = [];
  let id = 1;

  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        id: id++,
        x: startX + col * (ENEMY_W + ENEMY_GAP_X),
        y: startY + row * (ENEMY_H + ENEMY_GAP_Y),
        alive: true,
      });
    }
  }
  return enemies;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [playerX, setPlayerX] = useState(BOARD_W / 2 - PLAYER_W / 2);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [enemies, setEnemies] = useState<Enemy[]>(createEnemies());
  const [enemyDirection, setEnemyDirection] = useState<1 | -1>(1);
  const [enemyStep, setEnemyStep] = useState(1.2);
  const [bullets, setBullets] = useState<Bullet[]>([]);

  const leftPressed = useRef(false);
  const rightPressed = useRef(false);
  const canShoot = useRef(true);
  const bulletId = useRef(1);
  const frame = useRef<number | null>(null);

  const aliveEnemies = useMemo(() => enemies.filter((e) => e.alive), [enemies]);

  const reset = useCallback((keepLevel = false) => {
    setGameState("ready");
    setPlayerX(BOARD_W / 2 - PLAYER_W / 2);
    setLives(3);
    setScore(0);
    setLevel(keepLevel ? level : 1);
    setEnemies(createEnemies());
    setEnemyDirection(1);
    setEnemyStep(1.2 + (keepLevel ? (level - 1) * 0.35 : 0));
    setBullets([]);
    canShoot.current = true;
  }, [level]);

  const spawnEnemyShot = useCallback((currentEnemies: Enemy[]) => {
    const columns = new Map<number, Enemy[]>();
    currentEnemies
      .filter((e) => e.alive)
      .forEach((e) => {
        const col = Math.round(e.x / (ENEMY_W + ENEMY_GAP_X));
        if (!columns.has(col)) columns.set(col, []);
        columns.get(col)?.push(e);
      });

    const bottomRowEnemies = Array.from(columns.values())
      .map((list) => list.sort((a, b) => b.y - a.y)[0])
      .filter(Boolean);

    if (!bottomRowEnemies.length) return;

    const shooter = bottomRowEnemies[Math.floor(Math.random() * bottomRowEnemies.length)];

    setBullets((prev) => [
      ...prev,
      {
        id: bulletId.current++,
        x: shooter.x + ENEMY_W / 2 - 2,
        y: shooter.y + ENEMY_H,
        vy: ENEMY_BULLET_SPEED + Math.random() * 1.5,
        enemy: true,
      },
    ]);
  }, []);

  const shoot = useCallback(() => {
    if (gameState !== "playing" || !canShoot.current) return;

    setBullets((prev) => {
      const activePlayerBullets = prev.filter((b) => !b.enemy);
      if (activePlayerBullets.length >= 2) return prev;

      return [
        ...prev,
        {
          id: bulletId.current++,
          x: playerX + PLAYER_W / 2 - 2,
          y: BOARD_H - 48,
          vy: BULLET_SPEED,
        },
      ];
    });

    canShoot.current = false;
    window.setTimeout(() => {
      canShoot.current = true;
    }, 130);
  }, [gameState, playerX]);

  const startGame = useCallback(() => {
    setGameState("playing");
    setBullets([]);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") leftPressed.current = true;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rightPressed.current = true;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (gameState === "ready") startGame();
        else if (gameState === "playing") shoot();
        else reset();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") leftPressed.current = false;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rightPressed.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameState, reset, shoot, startGame]);

  useEffect(() => {
    if (gameState !== "playing") return;

    let enemyShootClock = 0;

    const tick = () => {
      setPlayerX((prev) => {
        let next = prev;
        if (leftPressed.current) next -= PLAYER_SPEED;
        if (rightPressed.current) next += PLAYER_SPEED;
        return Math.max(8, Math.min(BOARD_W - PLAYER_W - 8, next));
      });

      setEnemies((prevEnemies) => {
        const living = prevEnemies.filter((e) => e.alive);
        if (!living.length) return prevEnemies;

        const leftEdge = Math.min(...living.map((e) => e.x));
        const rightEdge = Math.max(...living.map((e) => e.x + ENEMY_W));

        let nextDirection = enemyDirection;
        let dropDown = false;

        if (rightEdge >= BOARD_W - 8 && enemyDirection === 1) {
          nextDirection = -1;
          dropDown = true;
        }
        if (leftEdge <= 8 && enemyDirection === -1) {
          nextDirection = 1;
          dropDown = true;
        }

        if (nextDirection !== enemyDirection) setEnemyDirection(nextDirection);

        const moved = prevEnemies.map((enemy) => {
          if (!enemy.alive) return enemy;
          return {
            ...enemy,
            x: enemy.x + enemyStep * nextDirection,
            y: enemy.y + (dropDown ? 14 : 0),
          };
        });

        const lowestEnemy = Math.max(...moved.filter((e) => e.alive).map((e) => e.y + ENEMY_H));
        if (lowestEnemy >= BOARD_H - 54) {
          setGameState("lost");
        }

        enemyShootClock += 1;
        if (enemyShootClock >= 45) {
          spawnEnemyShot(moved);
          enemyShootClock = 0;
        }

        return moved;
      });

      setBullets((prevBullets) => {
        const movedBullets = prevBullets
          .map((b) => ({ ...b, y: b.y + b.vy }))
          .filter((b) => b.y > -20 && b.y < BOARD_H + 20);

        const nextEnemies = [...enemies];
        let scoreDelta = 0;
        let playerHit = false;

        const filtered = movedBullets.filter((bullet) => {
          if (bullet.enemy) {
            const hitPlayer =
              bullet.x + 4 >= playerX &&
              bullet.x <= playerX + PLAYER_W &&
              bullet.y + 8 >= BOARD_H - 36 &&
              bullet.y <= BOARD_H - 36 + PLAYER_H;
            if (hitPlayer) {
              playerHit = true;
              return false;
            }
            return true;
          }

          let collided = false;
          for (const enemy of nextEnemies) {
            if (!enemy.alive) continue;
            const hit =
              bullet.x + 4 >= enemy.x &&
              bullet.x <= enemy.x + ENEMY_W &&
              bullet.y + 8 >= enemy.y &&
              bullet.y <= enemy.y + ENEMY_H;
            if (hit) {
              enemy.alive = false;
              collided = true;
              scoreDelta += 100;
              break;
            }
          }
          return !collided;
        });

        if (scoreDelta > 0) {
          setEnemies(nextEnemies);
          setScore((prev) => prev + scoreDelta);
          const stillAlive = nextEnemies.some((e) => e.alive);
          if (!stillAlive) {
            setGameState("won");
          }
        }

        if (playerHit) {
          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setGameState("lost");
              return 0;
            }
            return next;
          });
        }

        return filtered;
      });

      frame.current = window.requestAnimationFrame(tick);
    };

    frame.current = window.requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enemies, enemyDirection, enemyStep, gameState, playerX, spawnEnemyShot]);

  useEffect(() => {
    if (gameState === "won") {
      const id = window.setTimeout(() => {
        setLevel((prev) => prev + 1);
        setEnemyStep((prev) => prev + 0.3);
        setEnemies(createEnemies());
        setBullets([]);
        setGameState("playing");
      }, 900);
      return () => window.clearTimeout(id);
    }
  }, [gameState]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-slate-100 p-4 sm:p-8">
      <main className="mx-auto max-w-4xl">
        <header className="mb-4 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4 shadow-lg shadow-indigo-950/50">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">Space Invaders: Neon Front</h1>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-black/30 p-2">Score: <span className="font-semibold">{score}</span></div>
            <div className="rounded-lg bg-black/30 p-2">Lives: <span className="font-semibold">{lives}</span></div>
            <div className="rounded-lg bg-black/30 p-2">Level: <span className="font-semibold">{level}</span></div>
            <div className="rounded-lg bg-black/30 p-2">Enemies: <span className="font-semibold">{aliveEnemies.length}</span></div>
          </div>
        </header>

        <section className="mx-auto relative rounded-2xl border border-cyan-400/30 bg-black/55 backdrop-blur overflow-hidden" style={{ maxWidth: BOARD_W + 2 }}>
          <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
            {enemies.filter((e) => e.alive).map((enemy) => (
              <div
                key={enemy.id}
                className="absolute rounded-md bg-gradient-to-b from-fuchsia-300 to-fuchsia-600 shadow-[0_0_16px_rgba(217,70,239,0.7)]"
                style={{ left: enemy.x, top: enemy.y, width: ENEMY_W, height: ENEMY_H }}
              />
            ))}

            {bullets.map((bullet) => (
              <div
                key={bullet.id}
                className={`absolute w-1 rounded-full ${bullet.enemy ? "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)] h-3" : "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)] h-4"}`}
                style={{ left: bullet.x, top: bullet.y }}
              />
            ))}

            <div
              className="absolute rounded-md bg-gradient-to-r from-cyan-400 to-indigo-300 shadow-[0_0_18px_rgba(56,189,248,0.9)]"
              style={{ left: playerX, top: BOARD_H - 36, width: PLAYER_W, height: PLAYER_H }}
            />

            {gameState !== "playing" && (
              <div className="absolute inset-0 grid place-items-center bg-black/65 p-6 text-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {gameState === "ready" && "Ready to Defend Earth?"}
                    {gameState === "lost" && "Mission Failed"}
                    {gameState === "won" && "Wave Cleared"}
                  </h2>
                  <p className="text-slate-300 mb-4">
                    {gameState === "ready" && "Move with A/D or Arrow Keys. Shoot with Space."}
                    {gameState === "lost" && "Press Enter or the button below to restart."}
                    {gameState === "won" && "Preparing next wave..."}
                  </p>
                  <button
                    onClick={() => {
                      if (gameState === "ready") startGame();
                      else reset();
                    }}
                    className="rounded-xl bg-cyan-400 text-slate-950 font-semibold px-5 py-2 hover:bg-cyan-300 transition"
                  >
                    {gameState === "ready" ? "Start Battle" : "Restart"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm text-slate-300">
          <span className="rounded-full bg-white/10 px-3 py-1">←/→ or A/D to move</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Space to shoot</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Enter to start/restart</span>
        </div>
      </main>
    </div>
  );
}
