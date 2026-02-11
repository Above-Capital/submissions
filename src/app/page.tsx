'use client';

import { useState, useCallback } from 'react';

type UnitCategory = {
  id: string;
  name: string;
  icon: string;
  units: Unit[];
};

type Unit = {
  id: string;
  name: string;
  symbol: string;
  toBase: number;
  fromBase: number;
};

const unitCategories: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    icon: '📏',
    units: [
      { id: 'mm', name: 'Millimeter', symbol: 'mm', toBase: 0.001, fromBase: 1000 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', toBase: 0.01, fromBase: 100 },
      { id: 'm', name: 'Meter', symbol: 'm', toBase: 1, fromBase: 1 },
      { id: 'km', name: 'Kilometer', symbol: 'km', toBase: 1000, fromBase: 0.001 },
      { id: 'in', name: 'Inch', symbol: 'in', toBase: 0.0254, fromBase: 39.3701 },
      { id: 'ft', name: 'Foot', symbol: 'ft', toBase: 0.3048, fromBase: 3.28084 },
      { id: 'yd', name: 'Yard', symbol: 'yd', toBase: 0.9144, fromBase: 1.09361 },
      { id: 'mi', name: 'Mile', symbol: 'mi', toBase: 1609.34, fromBase: 0.000621371 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight',
    icon: '⚖️',
    units: [
      { id: 'mg', name: 'Milligram', symbol: 'mg', toBase: 0.000001, fromBase: 1000000 },
      { id: 'g', name: 'Gram', symbol: 'g', toBase: 0.001, fromBase: 1000 },
      { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: 1, fromBase: 1 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: 0.0283495, fromBase: 35.274 },
      { id: 'lb', name: 'Pound', symbol: 'lb', toBase: 0.453592, fromBase: 2.20462 },
      { id: 'ton', name: 'Metric Ton', symbol: 't', toBase: 1000, fromBase: 0.001 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: '🌡️',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: 1, fromBase: 1 },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: 1, fromBase: 1 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: 1, fromBase: 1 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: '🧪',
    units: [
      { id: 'ml', name: 'Milliliter', symbol: 'mL', toBase: 0.001, fromBase: 1000 },
      { id: 'l', name: 'Liter', symbol: 'L', toBase: 1, fromBase: 1 },
      { id: 'gal', name: 'Gallon (US)', symbol: 'gal', toBase: 3.78541, fromBase: 0.264172 },
      { id: 'qt', name: 'Quart', symbol: 'qt', toBase: 0.946353, fromBase: 1.05669 },
      { id: 'pt', name: 'Pint', symbol: 'pt', toBase: 0.473176, fromBase: 2.11338 },
      { id: 'cup', name: 'Cup', symbol: 'cup', toBase: 0.236588, fromBase: 4.22675 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    icon: '📐',
    units: [
      { id: 'mm2', name: 'Square Millimeter', symbol: 'mm²', toBase: 0.000001, fromBase: 1000000 },
      { id: 'cm2', name: 'Square Centimeter', symbol: 'cm²', toBase: 0.0001, fromBase: 10000 },
      { id: 'm2', name: 'Square Meter', symbol: 'm²', toBase: 1, fromBase: 1 },
      { id: 'km2', name: 'Square Kilometer', symbol: 'km²', toBase: 1000000, fromBase: 0.000001 },
      { id: 'sqft', name: 'Square Foot', symbol: 'ft²', toBase: 0.092903, fromBase: 10.7639 },
      { id: 'sqin', name: 'Square Inch', symbol: 'in²', toBase: 0.00064516, fromBase: 1550 },
      { id: 'acre', name: 'Acre', symbol: 'ac', toBase: 4046.86, fromBase: 0.000247105 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    icon: '⏱️',
    units: [
      { id: 'ms', name: 'Millisecond', symbol: 'ms', toBase: 0.001, fromBase: 1000 },
      { id: 's', name: 'Second', symbol: 's', toBase: 1, fromBase: 1 },
      { id: 'min', name: 'Minute', symbol: 'min', toBase: 60, fromBase: 0.0166667 },
      { id: 'hr', name: 'Hour', symbol: 'hr', toBase: 3600, fromBase: 0.000277778 },
      { id: 'day', name: 'Day', symbol: 'day', toBase: 86400, fromBase: 0.0000115741 },
      { id: 'week', name: 'Week', symbol: 'wk', toBase: 604800, fromBase: 0.00000165344 },
    ],
  },
];

function convertTemperature(value: number, from: Unit, to: Unit): number {
  // Convert to Celsius first
  let celsius: number;
  switch (from.id) {
    case 'c': celsius = value; break;
    case 'f': celsius = (value - 32) * 5/9; break;
    case 'k': celsius = value - 273.15; break;
    default: celsius = value * from.toBase;
  }
  
  // Convert from Celsius to target
  switch (to.id) {
    case 'c': return celsius;
    case 'f': return celsius * 9/5 + 32;
    case 'k': return celsius + 273.15;
    default: return celsius / to.toBase;
  }
}

function convert(value: number, from: Unit, to: Unit): number {
  if (from.id === to.id) return value;
  
  if (['c', 'f', 'k'].includes(from.id) || ['c', 'f', 'k'].includes(to.id)) {
    return convertTemperature(value, from, to);
  }
  
  // Convert to base unit then to target
  const baseValue = value * from.toBase;
  return baseValue / to.toBase;
}

function formatNumber(num: number): string {
  if (num === 0) return '0';
  if (Math.abs(num) >= 1e9) return num.toExponential(4);
  if (Math.abs(num) >= 1e6) return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (Math.abs(num) >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 6 }).replace(/\.?0+$/, '');
  if (Math.abs(num) >= 1e-6) return num.toFixed(8).replace(/0+$/, '');
  return num.toExponential(4);
}

export default function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState(unitCategories[0]);
  const [fromUnit, setFromUnit] = useState(unitCategories[0].units[0]);
  const [toUnit, setToUnit] = useState(unitCategories[0].units[1]);
  const [inputValue, setInputValue] = useState('1');
  const [result, setResult] = useState('');
  const [draggedUnit, setDraggedUnit] = useState<{ unit: Unit; category: UnitCategory; type: 'from' | 'to' } | null>(null);
  const [swapAnimation, setSwapAnimation] = useState(false);

  const calculateResult = useCallback(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || inputValue === '') {
      setResult('');
      return;
    }
    const converted = convert(value, fromUnit, toUnit);
    setResult(formatNumber(converted));
  }, [inputValue, fromUnit, toUnit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      setInputValue(val);
      setTimeout(calculateResult, 0);
    }
  };

  const handleSwap = () => {
    setSwapAnimation(true);
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setTimeout(() => {
      setSwapAnimation(false);
      calculateResult();
    }, 300);
  };

  const handleDragStart = (e: React.DragEvent, unit: Unit, category: UnitCategory, type: 'from' | 'to') => {
    setDraggedUnit({ unit, category, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetType: 'from' | 'to') => {
    e.preventDefault();
    if (!draggedUnit) return;

    if (draggedUnit.type === targetType) {
      setDraggedUnit(null);
      return;
    }

    const targetUnit = targetType === 'from' ? fromUnit : toUnit;
    
    if (draggedUnit.type === 'from') {
      setFromUnit(draggedUnit.unit);
    } else {
      setToUnit(draggedUnit.unit);
    }
    
    setDraggedUnit(null);
    setTimeout(calculateResult, 0);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          Unit Converter
        </h1>
        <p className="text-muted-foreground">Drag units to convert • Simple • Fast • Beautiful</p>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {unitCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat);
                setFromUnit(cat.units[0]);
                setToUnit(cat.units[1] || cat.units[0]);
                setResult('');
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory.id === cat.id
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Conversion Card */}
        <div className="unit-card p-6 md:p-8 mb-8 slide-in">
          <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* From Unit */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">From</label>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, fromUnit, activeCategory, 'from')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'from')}
                className={`drop-zone p-4 rounded-xl border-2 border-dashed cursor-grab active:cursor-grabbing ${
                  draggedUnit?.type === 'to' ? 'drag-over' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{activeCategory.icon}</span>
                  <select
                    value={fromUnit.id}
                    onChange={(e) => {
                      const unit = activeCategory.units.find(u => u.id === e.target.value);
                      if (unit) {
                        setFromUnit(unit);
                        setTimeout(calculateResult, 0);
                      }
                    }}
                    className="flex-1 bg-transparent font-semibold text-lg focus:outline-none"
                  >
                    {activeCategory.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                  className="w-full bg-transparent text-3xl font-mono focus:outline-none"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {fromUnit.symbol}
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className={`conversion-arrow p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-all self-center ${
                swapAnimation ? 'rotate-180' : ''
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.65 3.65 0 0 1 3-3h8.72a3.65 3.65 0 0 1 3 3l.76 4.24" />
              </svg>
            </button>

            {/* To Unit */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, toUnit, activeCategory, 'to')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'to')}
                className={`drop-zone p-4 rounded-xl border-2 border-dashed cursor-grab active:cursor-grabbing ${
                  draggedUnit?.type === 'from' ? 'drag-over' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{activeCategory.icon}</span>
                  <select
                    value={toUnit.id}
                    onChange={(e) => {
                      const unit = activeCategory.units.find(u => u.id === e.target.value);
                      if (unit) {
                        setToUnit(unit);
                        setTimeout(calculateResult, 0);
                      }
                    }}
                    className="flex-1 bg-transparent font-semibold text-lg focus:outline-none"
                  >
                    {activeCategory.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-3xl font-mono font-bold text-primary min-h-[42px] flex items-center">
                  {result || '—'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {toUnit.symbol}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Convert Display */}
          <div className="mt-6 p-4 rounded-xl bg-secondary/50 text-center">
            <span className="text-muted-foreground">{inputValue || '0'} </span>
            <span className="font-medium">{fromUnit.name}</span>
            <span className="mx-2">=</span>
            <span className="font-bold text-primary text-xl">{result || '0'}</span>
            <span className="ml-1 font-medium">{toUnit.name}</span>
          </div>
        </div>

        {/* Quick Unit List */}
        <div className="unit-card p-6 slide-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold mb-4">Available Units ({activeCategory.name})</h2>
          <p className="text-sm text-muted-foreground mb-4">
            💡 Tip: Drag a unit from this list to the From or To drop zones above to quickly switch
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {activeCategory.units.map((unit) => (
              <div
                key={unit.id}
                draggable
                onDragStart={(e) => handleDragStart(e, unit, activeCategory, 'from')}
                className="draggable p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-all"
              >
                <div className="font-semibold">{unit.symbol}</div>
                <div className="text-xs text-muted-foreground truncate">{unit.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Formula Reference */}
        <div className="mt-6 unit-card p-6 slide-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold mb-4">Quick Reference</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><strong>Length:</strong> Base unit = meter</p>
              <p><strong>Weight:</strong> Base unit = kilogram</p>
              <p><strong>Temperature:</strong> Special conversion formulas</p>
            </div>
            <div className="space-y-2">
              <p><strong>Volume:</strong> Base unit = liter</p>
              <p><strong>Area:</strong> Base unit = square meter</p>
              <p><strong>Time:</strong> Base unit = second</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto mt-12 text-center text-sm text-muted-foreground">
        <p>Built with Next.js & Tailwind CSS • Drag & Drop Enabled</p>
      </footer>
    </div>
  );
}
