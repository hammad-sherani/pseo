"use client";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { InputField } from "@/engines/types";

export interface InputBlockProps {
  id: string;
  field: InputField;
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
}

const optionValue = (field: InputField, raw: string) =>
  field.options?.find((o) => String(o.value) === raw)?.value ?? raw;

function Affix({ field, children }: { field: InputField; children: ReactNode }) {
  const prefix = field.unit === "$";
  return (
    <div className="affix">
      {prefix && <span aria-hidden>{field.unit}</span>}
      {children}
      {field.unit && !prefix && <span aria-hidden>{field.unit}</span>}
    </div>
  );
}

function NumberField({ id, field, label, value, onChange }: InputBlockProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Affix field={field}>
        <input id={id} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step ?? "any"}
          value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
      </Affix>
    </div>
  );
}

function Slider({ id, field, label, value, onChange }: InputBlockProps) {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const pct = Math.min(100, Math.max(0, ((Number(value) - min) / (max - min || 1)) * 100));
  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <Affix field={field}>
          <input aria-label={`${label} value`} className="slider-value" type="number" inputMode="decimal"
            step={field.step ?? "any"} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        </Affix>
      </div>
      <input id={id} type="range" min={field.min} max={field.max} step={field.step ?? 1} value={value}
        style={{ "--pct": `${pct}%` } as CSSProperties} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Stepper({ id, field, label, value, onChange }: InputBlockProps) {
  const step = field.step ?? 1;
  const clamp = (x: number) => Math.min(field.max ?? Infinity, Math.max(field.min ?? -Infinity, x));
  const bump = (d: number) => onChange(Number(clamp(Number(value) + d).toFixed(4)));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-step)}>−</button>
        <Affix field={field}>
          <input id={id} type="number" inputMode="decimal" step={step} value={value}
            onChange={(e) => onChange(Number(e.target.value))} />
        </Affix>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(step)}>+</button>
      </div>
    </div>
  );
}

function Choice({ id, field, label, value, onChange, variant }: InputBlockProps & { variant: "segmented" | "chips" }) {
  return (
    <fieldset className={`field ${variant}`}>
      <legend>{label}</legend>
      <div className="choices">
        {field.options?.map((o) => (
          <label key={o.value} className="choice">
            <input type="radio" name={id} value={o.value} checked={String(value) === String(o.value)}
              onChange={(e) => onChange(optionValue(field, e.target.value))} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Dropdown({ id, field, label, value, onChange }: InputBlockProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(optionValue(field, e.target.value))}>
        {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextArea({ id, field, label, value, onChange }: InputBlockProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={12} placeholder={field.placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export const INPUT_COMPONENTS: Record<string, ComponentType<InputBlockProps>> = {
  NumberField,
  Slider,
  Stepper,
  SegmentedToggle: (p) => <Choice {...p} variant="segmented" />,
  ChipGroup: (p) => <Choice {...p} variant="chips" />,
  Dropdown,
  TextArea,
};
