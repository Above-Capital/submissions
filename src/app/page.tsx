'use client';

import { useState, useEffect, useCallback } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_PAIRS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🐧', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🦄',
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateCards(difficulty: Difficulty): Card[] {
  const pairCount = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;
  const selectedEmojis = EMOJI_PAIRS.slice(0, pairCount);
  const cards = [...selectedEmojis, ...selectedEmojis].map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
  return shuffleArray(cards);
}

export default function MemoryGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bestScores, setBestScores] = useState<Record<Difficulty, { moves: number; time: number }> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('memoryGameBestScores');
    if (saved) {
      setBestScores(JSON.parse(saved));
    }
  }, []);

  const startNewGame = useCallback(() => {
    setCards(generateCards(difficulty));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setIsPlaying(true);
    setGameWon(false);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [difficulty, startNewGame]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameWon) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameWon]);

  const handleCardClick = useCallback((cardId: number) => {
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        setCards(prev => prev.map(c => 
          c.id === firstId || c.id === secondId 
            ? { ...c, isMatched: true } 
            : c
        ));
        setFlippedCards([]);
        const newMatches = matches + 1;
        setMatches(newMatches);
        
        const totalPairs = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;
        if (newMatches + 1 === totalPairs) {
          setGameWon(true);
          setIsPlaying(false);
          
          const newBestScores: Record<Difficulty, { moves: number; time: number }> = { 
            ...(bestScores || { easy: { moves: 0, time: 0 }, medium: { moves: 0, time: 0 }, hard: { moves: 0, time: 0 } }) 
          };
          const currentBest = bestScores?.[difficulty];
          if (!currentBest || moves > 0 || timer < currentBest.time) {
            newBestScores[difficulty] = { moves: moves + 1, time: timer + 1 };
            setBestScores(newBestScores);
            localStorage.setItem('memoryGameBestScores', JSON.stringify(newBestScores));
          }
        }
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [cards, flippedCards, matches, difficulty, moves, timer, bestScores]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          Memory Match
        </h1>
        <p className="text-muted-foreground">Find all the matching pairs!</p>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Controls */}
        <div className="unit-card p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center items-center mb-6">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="px-4 py-2 bg-secondary rounded-lg font-medium"
              disabled={isPlaying}
            >
              <option value="easy">Easy (4×4)</option>
              <option value="medium">Medium (6×4)</option>
              <option value="hard">Hard (6×6)</option>
            </select>
            <button onClick={startNewGame} className="btn-primary">
              {isPlaying ? 'Restart' : 'Start Game'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Moves</div>
              <div className="stat-value">{moves}</div>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Time</div>
              <div className="stat-value">{formatTime(timer)}</div>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Matches</div>
              <div className="stat-value">{matches}</div>
            </div>
          </div>

          {/* Best Scores */}
          {bestScores && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2 text-center">Best Scores</div>
              <div className="flex justify-center gap-4 text-xs">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(level => {
                  const score = bestScores[level];
                  return (
                    <div key={level} className="text-center">
                      <div className="capitalize">{level.charAt(0)}</div>
                      {score ? `${score.moves}m / ${formatTime(score.time)}` : '—'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className={`game-board ${difficulty} mb-6`}>
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={!isPlaying || card.isFlipped || card.isMatched}
              className={`card-container aspect-square ${
                card.isMatched ? 'matched' : ''
              }`}
              style={{ perspective: '1000px' }}
            >
              <div
                className={`card w-full h-full cursor-pointer ${
                  card.isFlipped || card.isMatched ? 'flipped' : ''
                }`}
                style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s' }}
              >
                <div
                  className="card-back w-full h-full rounded-xl flex items-center justify-center text-3xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    position: 'absolute',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  }}
                >
                  ❓
                </div>
                <div
                  className={`card-front w-full h-full rounded-xl flex items-center justify-center text-4xl border-2 ${
                    card.isMatched ? 'bg-green-100 dark:bg-green-900' : 'bg-card'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    position: 'absolute',
                  }}
                >
                  {card.emoji}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Win Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 modal-overlay z-50">
            <div className="unit-card p-8 max-w-sm w-full text-center animate-pop">
              <div className="text-6xl mb-4 congrats-animation">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
              <p className="text-muted-foreground mb-4">
                You found all pairs in <strong>{moves}</strong> moves and <strong>{formatTime(timer)}</strong>!
              </p>
              <div className="text-sm text-muted-foreground mb-6">
                {bestScores?.[difficulty]?.moves === moves && timer === bestScores?.[difficulty]?.time ? (
                  <span className="text-primary font-semibold">🏆 New Best Score!</span>
                ) : (
                  <span>Best: {bestScores?.[difficulty]?.moves}m / {formatTime(bestScores?.[difficulty]?.time || 0)}</span>
                )}
              </div>
              <button onClick={startNewGame} className="btn-primary w-full">
                Play Again
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-2xl mx-auto mt-8 text-center text-sm text-muted-foreground">
        <p>Click cards to flip and find matching pairs</p>
      </footer>
    </div>
  );
}
