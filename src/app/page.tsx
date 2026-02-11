'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { emojis, emojiCategories, type Emoji } from '@/lib/emojis';

function searchEmojis(query: string): Emoji[] {
  if (!query.trim()) return [];
  const normalizedQuery = query.toLowerCase().trim();
  
  return emojis.filter(emoji => {
    if (emoji.name.toLowerCase().includes(normalizedQuery)) return true;
    if (emoji.keywords.some(kw => kw.toLowerCase().includes(normalizedQuery))) return true;
    return false;
  }).slice(0, 50);
}

export default function EmojiPicker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentEmojis');
    if (saved) {
      setRecentEmojis(JSON.parse(saved));
    }
  }, []);

  const addToRecent = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const updated = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 12);
      localStorage.setItem('recentEmojis', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleCopy = useCallback(async (emoji: string) => {
    await navigator.clipboard.writeText(emoji);
    setCopiedEmoji(emoji);
    addToRecent(emoji);
    setTimeout(() => setCopiedEmoji(null), 1500);
  }, [addToRecent]);

  const filteredEmojis = useMemo(() => {
    if (searchQuery) {
      return searchEmojis(searchQuery);
    }
    if (selectedCategory === 'all') {
      return emojis;
    }
    if (selectedCategory === 'recent') {
      return recentEmojis.map(char => emojis.find(e => e.char === char) || { char, name: char, keywords: [], category: 'recent', subcategory: 'recent' });
    }
    return emojis.filter(e => e.category === selectedCategory);
  }, [searchQuery, selectedCategory, recentEmojis]);

  const groupedEmojis = useMemo(() => {
    if (searchQuery || selectedCategory !== 'all') return { 'Results': filteredEmojis };
    
    const groups: Record<string, Emoji[]> = {};
    emojiCategories.forEach(cat => {
      groups[cat.name] = emojis.filter(e => e.category === cat.id);
    });
    return groups;
  }, [filteredEmojis, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          Emoji Search
        </h1>
        <p className="text-muted-foreground">Search and copy emojis instantly</p>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis... (try 'happy', 'cat', 'food')"
            className="search-input w-full p-4 text-lg bg-card border rounded-xl focus:outline-none"
            autoFocus
          />
        </div>

        {!searchQuery && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`category-tab px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === 'all' ? 'active' : 'bg-secondary'
              }`}
            >
              All
            </button>
            {recentEmojis.length > 0 && (
              <button
                onClick={() => setSelectedCategory('recent')}
                className={`category-tab px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === 'recent' ? 'active' : 'bg-secondary'
                }`}
              >
                🕐 Recent
              </button>
            )}
            {emojiCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-tab px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === cat.id ? 'active' : 'bg-secondary'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-6">
          {Object.entries(groupedEmojis).map(([categoryName, categoryEmojis]) => (
            <div key={categoryName} className="unit-card p-6">
              <h2 className="text-lg font-semibold mb-4">{categoryName}</h2>
              <div className="emoji-grid">
                {categoryEmojis.map(emoji => (
                  <button
                    key={emoji.char}
                    onClick={() => handleCopy(emoji.char)}
                    className="emoji-item relative group"
                    title={emoji.name}
                  >
                    <div className="text-3xl p-2 bg-secondary rounded-lg hover:bg-secondary/80">
                      {emoji.char}
                    </div>
                    {copiedEmoji === emoji.char && (
                      <div className="toast absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Copied!
                      </div>
                    )}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {emoji.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredEmojis.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No emojis found for "{searchQuery}"</p>
            <p className="text-sm mt-2">Try different keywords like 'happy', 'cat', 'food', etc.</p>
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto mt-12 text-center text-sm text-muted-foreground">
        <p>Click any emoji to copy to clipboard</p>
      </footer>
    </div>
  );
}
