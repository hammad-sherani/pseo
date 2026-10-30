import type { Engine } from "./types";

interface Unit {
  key: string;
  name: string;
  symbol: string;
  toBase: (x: number) => number;
  fromBase: (x: number) => number;
}

const linear = (key: string, name: string, symbol: string, factor: number): Unit => ({
  key, name, symbol, toBase: (x) => x * factor, fromBase: (x) => x / factor,
});

export const UNIT_CATEGORIES: Record<string, Unit[]> = {
  mass: [
    linear("kg", "kilograms", "kg", 1),
    linear("g", "grams", "g", 0.001),
    linear("lb", "pounds", "lb", 0.45359237),
    linear("oz", "ounces", "oz", 0.028349523125),
    linear("st", "stone", "st", 6.35029318),
  ],
  length: [
    linear("m", "meters", "m", 1),
    linear("cm", "centimeters", "cm", 0.01),
    linear("km", "kilometers", "km", 1000),
    linear("in", "inches", "in", 0.0254),
    linear("ft", "feet", "ft", 0.3048),
    linear("mi", "miles", "mi", 1609.344),
  ],
  temperature: [
    { key: "c", name: "Celsius", symbol: "°C", toBase: (x) => x, fromBase: (x) => x },
    { key: "f", name: "Fahrenheit", symbol: "°F", toBase: (x) => ((x - 32) * 5) / 9, fromBase: (x) => (x * 9) / 5 + 32 },
    { key: "k", name: "Kelvin", symbol: "K", toBase: (x) => x - 273.15, fromBase: (x) => x + 273.15 },
  ],
  volume: [
    linear("l", "liters", "L", 1),
    linear("ml", "milliliters", "mL", 0.001),
    linear("gal", "US gallons", "gal", 3.785411784),
    linear("cup", "US cups", "cup", 0.2365882365),
  ],
};

export interface UnitParams {
  category: keyof typeof UNIT_CATEGORIES;
  from: string;
  to: string;
  defaultValue: number;
  chartValues: number[];
}

export function getUnit(category: string, key: string): Unit {
  const unit = UNIT_CATEGORIES[category]?.find((u) => u.key === key);
  if (!unit) throw new Error(`Unknown unit ${category}/${key}`);
  return unit;
}

export function convert(category: string, from: string, to: string, value: number): number {
  return getUnit(category, to).fromBase(getUnit(category, from).toBase(value));
}

const fmt = (x: number) => Number(x.toPrecision(6)).toString();

export const unitsEngine: Engine<UnitParams> = {
  key: "units",
  inputs: (p) => {
    const options = UNIT_CATEGORIES[p.category].map((u) => ({ value: u.key, label: `${u.name} (${u.symbol})` }));
    return [
      { key: "value", type: "number", label: "Value", step: 0.01 },
      { key: "from", type: "select", label: "From", options },
      { key: "to", type: "select", label: "To", options },
    ];
  },
  outputs: () => [
    { key: "result", kind: "number", label: "Result", format: "number" },
    { key: "summary", kind: "text", label: "Answer" },
    { key: "chart", kind: "table", label: "Conversion chart" },
  ],
  defaults: (p) => ({ value: p.defaultValue, from: p.from, to: p.to }),
  run(input, p) {
    const from = getUnit(p.category, String(input.from));
    const to = getUnit(p.category, String(input.to));
    const value = Number(input.value);
    const result = convert(p.category, from.key, to.key, value);
    return {
      result: Number(result.toPrecision(8)),
      summary: `${fmt(value)} ${from.symbol} = ${fmt(result)} ${to.symbol}`,
      chart: {
        columns: [`${from.name} (${from.symbol})`, `${to.name} (${to.symbol})`],
        rows: p.chartValues.map((v) => [v, fmt(convert(p.category, from.key, to.key, v))]),
      },
    };
  },
  formula: (p) => {
    const from = getUnit(p.category, p.from);
    const to = getUnit(p.category, p.to);
    if (p.category === "temperature") {
      if (from.key === "c" && to.key === "f") return "°F = °C × 9/5 + 32";
      if (from.key === "f" && to.key === "c") return "°C = (°F − 32) × 5/9";
      return `Convert ${from.name} to Celsius, then Celsius to ${to.name}.`;
    }
    return `${to.symbol} = ${from.symbol} × ${fmt(convert(p.category, from.key, to.key, 1))}`;
  },
};
