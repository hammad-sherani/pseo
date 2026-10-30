import type { NumberFormat } from "@/engines/types";

export function formatNumber(value: number, format: NumberFormat = "number", unit?: string): string {
  switch (format) {
    case "currency":
      return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
    case "percent":
      return `${value.toFixed(2)}%`;
    case "integer":
      return Math.round(value).toLocaleString("en-US");
    case "minutes": {
      if (value < 1) return `${Math.max(1, Math.round(value * 60))} sec`;
      const m = Math.floor(value);
      const s = Math.round((value - m) * 60);
      return s ? `${m} min ${s} sec` : `${m} min`;
    }
    default:
      return `${Number(value.toPrecision(8)).toLocaleString("en-US", { maximumFractionDigits: 6 })}${unit ? ` ${unit}` : ""}`;
  }
}
