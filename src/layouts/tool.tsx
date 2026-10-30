"use client";
import { useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import type { ToolLayout } from "@/schemas/page";

export interface ToolLayoutProps {
  inputs: ReactNode[];
  outputs: ReactNode[];
  inputLabels: string[];
}

function SplitPane({ inputs, outputs }: ToolLayoutProps) {
  return (
    <div className="tl-split">
      <div className="tl-inputs">{inputs}</div>
      <div className="tl-results" aria-live="polite">{outputs}</div>
    </div>
  );
}

function StackedCard({ inputs, outputs }: ToolLayoutProps) {
  return (
    <div className="tl-stacked">
      <div className="tl-inputs grid-auto">{inputs}</div>
      <div className="tl-results" aria-live="polite">{outputs}</div>
    </div>
  );
}

function Wizard({ inputs, outputs, inputLabels }: ToolLayoutProps) {
  const [step, setStep] = useState(0);
  const last = inputs.length - 1;
  return (
    <div className="tl-wizard">
      <ol className="steps" style={{ "--progress": `${(step / Math.max(last, 1)) * 100}%` } as CSSProperties}>
        {inputLabels.map((l, i) => (
          <li key={l} aria-current={i === step ? "step" : undefined} data-done={i < step || undefined}>
            <button type="button" onClick={() => setStep(i)}><span className="step-num">{i + 1}</span>{l}</button>
          </li>
        ))}
      </ol>
      <div className="tl-inputs">
        {/* Every step stays in the DOM (labels remain crawlable); inactive ones are hidden. */}
        {inputs.map((node, i) => <div key={i} hidden={i !== step}>{node}</div>)}
        <div className="step-nav">
          <button type="button" className="btn btn-quiet" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
          <span className="step-count">Step {step + 1} of {last + 1}</span>
          <button type="button" className="btn btn-primary" disabled={step === last} onClick={() => setStep(step + 1)}>Next</button>
        </div>
      </div>
      <div className="tl-results" aria-live="polite">{outputs}</div>
    </div>
  );
}

function InlineSentence({ inputs, outputs }: ToolLayoutProps) {
  return (
    <div className="tl-inline">
      <div className="tl-inputs inline-row">{inputs}</div>
      <div className="tl-results" aria-live="polite">{outputs}</div>
    </div>
  );
}

function Dashboard({ inputs, outputs }: ToolLayoutProps) {
  return (
    <div className="tl-dashboard">
      <div className="tl-inputs toolbar">{inputs}</div>
      <div className="tl-results metric-board" aria-live="polite">{outputs.map((o, i) => <div className="metric" key={i}>{o}</div>)}</div>
    </div>
  );
}

function Editor({ inputs, outputs }: ToolLayoutProps) {
  return (
    <div className="tl-editor">
      <div className="tl-inputs">{inputs}</div>
      <aside className="tl-results" aria-live="polite">{outputs}</aside>
    </div>
  );
}

export const TOOL_LAYOUT_COMPONENTS: Record<ToolLayout, ComponentType<ToolLayoutProps>> = {
  "split-pane": SplitPane,
  "stacked-card": StackedCard,
  wizard: Wizard,
  "inline-sentence": InlineSentence,
  dashboard: Dashboard,
  editor: Editor,
};
