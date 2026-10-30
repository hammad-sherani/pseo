"use client";
import { useState, type ComponentType } from "react";
import type { BreakdownItem, OutputField, OutputValues, Table } from "@/engines/types";
import { formatNumber } from "@/lib/format";
import { CheckIcon, CopyIcon } from "@/components/icons";

export interface OutputBlockProps {
  fields: OutputField[];
  values: OutputValues;
  label?: string;
  collapsed?: boolean;
}

const show = (f: OutputField, v: OutputValues[string]) =>
  typeof v === "number" ? formatNumber(v, f.format, f.unit) : String(v ?? "");

const SEGMENT_COLORS = ["var(--accent)", "var(--accent-2)", "var(--ink-3)", "var(--accent-3)"];

const pct = (v: number, total: number) => Math.round((v / total) * 100);

function BigStat({ fields: [f], values, label }: OutputBlockProps) {
  return (
    <div className="big-stat">
      <span className="eyebrow">{label ?? f.label}</span>
      <output className="big-value">{show(f, values[f.key])}</output>
    </div>
  );
}

function StatGrid({ fields, values, label }: OutputBlockProps) {
  return (
    <section className="stat-grid" aria-label={label}>
      {fields.map((f) => (
        <div key={f.key} className="stat">
          <output>{show(f, values[f.key])}</output>
          <span>{f.label}</span>
        </div>
      ))}
    </section>
  );
}

function StatList({ fields, values, label }: OutputBlockProps) {
  return (
    <dl className="stat-list" aria-label={label}>
      {fields.map((f) => (
        <div key={f.key}>
          <dt>{f.label}</dt>
          <dd><output>{show(f, values[f.key])}</output></dd>
        </div>
      ))}
    </dl>
  );
}

function Sentence({ fields: [f], values }: OutputBlockProps) {
  return <output className="sentence">{show(f, values[f.key])}</output>;
}

function CopyBox({ fields: [f], values, label }: OutputBlockProps) {
  const [copied, setCopied] = useState(false);
  const text = show(f, values[f.key]);
  const copy = () =>
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  return (
    <div className="copy-box">
      <span className="eyebrow">{label ?? f.label}</span>
      <div>
        <output>{text}</output>
        <button type="button" onClick={copy} data-copied={copied || undefined}>{copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}{copied ? "Copied" : "Copy"}</button>
      </div>
    </div>
  );
}

function ResultTable({ fields: [f], values, label, collapsed }: OutputBlockProps) {
  const t = values[f.key] as Table;
  if (!t?.rows?.length) return null;
  const table = (
    <div className="table-wrap">
      <table>
        {!collapsed && <caption>{label ?? f.label}</caption>}
        <thead><tr>{t.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return collapsed ? <details className="result-details"><summary>{label ?? f.label}</summary>{table}</details> : table;
}

function Legend({ items, total }: { items: BreakdownItem[]; total: number }) {
  return (
    <ul className="legend">
      {items.map((i, n) => (
        <li key={i.label}><i style={{ background: SEGMENT_COLORS[n % 4] }} />{i.label} <b>{pct(i.value, total)}%</b></li>
      ))}
    </ul>
  );
}

function BarBreakdown({ fields: [f], values, label }: OutputBlockProps) {
  const items = (values[f.key] as BreakdownItem[]) ?? [];
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <figure className="bars">
      <figcaption>{label ?? f.label}</figcaption>
      <div className="bar-track" role="img" aria-label={items.map((i) => `${i.label} ${pct(i.value, total)}%`).join(", ")}>
        {items.map((i, n) => <span key={i.label} style={{ width: `${(i.value / total) * 100}%`, background: SEGMENT_COLORS[n % 4] }} />)}
      </div>
      <Legend items={items} total={total} />
    </figure>
  );
}

function Donut({ fields: [f], values, label }: OutputBlockProps) {
  const items = (values[f.key] as BreakdownItem[]) ?? [];
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const C = 2 * Math.PI * 40;
  let offset = 0;
  return (
    <figure className="donut">
      <svg viewBox="0 0 100 100" width="140" height="140" role="img"
        aria-label={items.map((i) => `${i.label} ${pct(i.value, total)}%`).join(", ")}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--line)" strokeWidth="14" />
        {items.map((i, n) => {
          const len = (i.value / total) * C;
          const el = (
            <circle key={i.label} cx="50" cy="50" r="40" fill="none" stroke={SEGMENT_COLORS[n % 4]} strokeWidth="14"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />
          );
          offset += len;
          return el;
        })}
      </svg>
      <figcaption>
        <span className="eyebrow">{label ?? f.label}</span>
        <Legend items={items} total={total} />
      </figcaption>
    </figure>
  );
}

export const OUTPUT_COMPONENTS: Record<string, ComponentType<OutputBlockProps>> = {
  BigStat, StatGrid, StatList, Sentence, CopyBox, ResultTable, BarBreakdown, Donut,
};
