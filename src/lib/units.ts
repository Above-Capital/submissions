export type UnitKind = "linear" | "affine";

export type UnitDef = {
  id: string;
  label: string;
  symbol: string;
  category: string;
  kind: UnitKind;
  // Linear: valueBase = value * scale
  scale?: number;
  // Affine: valueBase = (value + offset) * scale
  offset?: number;
};

export type CategoryDef = {
  id: string;
  label: string;
  units: UnitDef[];
  baseUnitId: string;
};

function linear(id: string, label: string, symbol: string, category: string, scale: number): UnitDef {
  return { id, label, symbol, category, kind: "linear", scale };
}

function affine(id: string, label: string, symbol: string, category: string, scale: number, offset: number): UnitDef {
  return { id, label, symbol, category, kind: "affine", scale, offset };
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "length",
    label: "Length",
    baseUnitId: "m",
    units: [
      linear("m", "Meter", "m", "length", 1),
      linear("km", "Kilometer", "km", "length", 1000),
      linear("cm", "Centimeter", "cm", "length", 0.01),
      linear("mm", "Millimeter", "mm", "length", 0.001),
      linear("in", "Inch", "in", "length", 0.0254),
      linear("ft", "Foot", "ft", "length", 0.3048),
      linear("yd", "Yard", "yd", "length", 0.9144),
      linear("mi", "Mile", "mi", "length", 1609.344),
    ],
  },
  {
    id: "mass",
    label: "Mass",
    baseUnitId: "kg",
    units: [
      linear("kg", "Kilogram", "kg", "mass", 1),
      linear("g", "Gram", "g", "mass", 0.001),
      linear("mg", "Milligram", "mg", "mass", 0.000001),
      linear("lb", "Pound", "lb", "mass", 0.45359237),
      linear("oz", "Ounce", "oz", "mass", 0.028349523125),
    ],
  },
  {
    id: "temp",
    label: "Temperature",
    baseUnitId: "c",
    units: [
      // Base is Celsius
      affine("c", "Celsius", "°C", "temp", 1, 0),
      affine("f", "Fahrenheit", "°F", "temp", 5 / 9, -32),
      // Kelvin: C = K - 273.15
      affine("k", "Kelvin", "K", "temp", 1, -273.15),
    ],
  },
  {
    id: "speed",
    label: "Speed",
    baseUnitId: "mps",
    units: [
      linear("mps", "Meters/sec", "m/s", "speed", 1),
      linear("kph", "Kilometers/hour", "km/h", "speed", 1000 / 3600),
      linear("mph", "Miles/hour", "mph", "speed", 1609.344 / 3600),
      linear("knot", "Knot", "kn", "speed", 1852 / 3600),
    ],
  },
  {
    id: "volume",
    label: "Volume",
    baseUnitId: "l",
    units: [
      linear("l", "Liter", "L", "volume", 1),
      linear("ml", "Milliliter", "mL", "volume", 0.001),
      linear("m3", "Cubic meter", "m³", "volume", 1000),
      linear("gal", "Gallon (US)", "gal", "volume", 3.785411784),
      linear("qt", "Quart (US)", "qt", "volume", 0.946352946),
      linear("pt", "Pint (US)", "pt", "volume", 0.473176473),
      linear("cup", "Cup (US)", "cup", "volume", 0.2365882365),
    ],
  },
];

export const UNITS: UnitDef[] = CATEGORIES.flatMap((c) => c.units);

export function getCategory(categoryId: string) {
  return CATEGORIES.find((c) => c.id === categoryId) ?? null;
}

export function getUnit(unitId: string) {
  return UNITS.find((u) => u.id === unitId) ?? null;
}

export function convert(value: number, fromId: string, toId: string) {
  const from = getUnit(fromId);
  const to = getUnit(toId);
  if (!from || !to) return NaN;
  if (from.category !== to.category) return NaN;

  const vBase = from.kind === "linear"
    ? value * (from.scale ?? 1)
    : (value + (from.offset ?? 0)) * (from.scale ?? 1);

  const vOut = to.kind === "linear"
    ? vBase / (to.scale ?? 1)
    : vBase / (to.scale ?? 1) - (to.offset ?? 0);

  return vOut;
}
