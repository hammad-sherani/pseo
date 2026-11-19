"use client";
import { useMemo, useRef, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import type { Engine, InputValues, OutputValues } from "@/engines/types";
import type { UiConfig } from "@/schemas/page";
import { INPUT_COMPONENTS } from "@/blocks/inputs";
import { OUTPUT_COMPONENTS } from "@/blocks/outputs";
import { TOOL_LAYOUT_COMPONENTS } from "@/layouts/tool";
import { ResetIcon } from "./icons";

interface Props {
  slug: string;
  engineKey: string;
  params: Record<string, unknown>;
  ui: UiConfig;
}

type ViewProps = Omit<Props, "engineKey">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withEngine = (engine: Engine<any>) =>
  function EngineTool(props: ViewProps) {
    return <ToolView engine={engine} {...props} />;
  };

// One chunk per engine, so a page downloads only the engine it uses. Every
// key in src/engines/index.ts needs an entry here (tests/formula.test.ts checks).
const RUNTIMES: Record<string, ComponentType<ViewProps>> = {
  loan: dynamic(() => import("@/engines/loan").then((m) => withEngine(m.loanEngine))),
  units: dynamic(() => import("@/engines/units").then((m) => withEngine(m.unitsEngine))),
  text: dynamic(() => import("@/engines/text").then((m) => withEngine(m.textEngine))),
  formula: dynamic(() => import("@/engines/formula").then((m) => withEngine(m.formulaEngine))),
};

/**
 * The only client island on a tool page. It is server-rendered with the
 * engine defaults, so the initial HTML already contains a real result.
 */
export function ToolRuntime({ engineKey, ...props }: Props) {
  const Runtime = RUNTIMES[engineKey];
  if (!Runtime) throw new Error(`No client runtime for engine "${engineKey}"`);
  return <Runtime {...props} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ToolView({ engine, slug, params, ui }: ViewProps & { engine: Engine<any> }) {
  const fields = useMemo(() => engine.inputs(params), [engine, params]);
  const outFields = useMemo(() => engine.outputs(params), [engine, params]);
  const defaults = useMemo(() => engine.defaults(params), [engine, params]);
  const [values, setValues] = useState<InputValues>(defaults);
  const edited = Object.keys(defaults).some((k) => String(values[k]) !== String(defaults[k]));
  // Keep showing the last valid result while an input is empty or mid-edit.
  const lastValid = useRef<OutputValues | null>(null);

  const output = useMemo(() => {
    if (lastValid.current && Object.values(values).some((v) => v === "")) return lastValid.current;
    try {
      return (lastValid.current = engine.run(values, params));
    } catch {
      return lastValid.current ?? engine.run(engine.defaults(params), params);
    }
  }, [engine, values, params]);

  const inputs = ui.inputs.map((cfg) => {
    const field = fields.find((f) => f.key === cfg.field);
    const Block = INPUT_COMPONENTS[cfg.block];
    if (!field || !Block) return null;
    return (
      <Block key={cfg.field} id={`${slug}-${cfg.field}`} field={field} label={cfg.label ?? field.label}
        value={values[cfg.field] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [cfg.field]: v }))} />
    );
  });

  const outputs = ui.outputs.map((cfg, i) => {
    const Block = OUTPUT_COMPONENTS[cfg.block];
    const fs = cfg.fields.map((k) => outFields.find((f) => f.key === k)).filter((f) => f !== undefined);
    if (!Block || !fs.length) return null;
    return <Block key={i} fields={fs} values={output} label={cfg.label} collapsed={cfg.collapsed} />;
  });

  const Layout = TOOL_LAYOUT_COMPONENTS[ui.toolLayout];
  return (
    <form className="tool" onSubmit={(e) => e.preventDefault()} aria-label="Calculator">
      <div className="tool-bar">
        <span className="tool-status"><span className="live-dot" />Results update as you type</span>
        <button type="button" className="btn btn-quiet btn-sm" disabled={!edited} onClick={() => setValues(defaults)}>
          <ResetIcon size={15} />Reset
        </button>
      </div>
      <Layout inputs={inputs} outputs={outputs}
        inputLabels={ui.inputs.map((c) => c.label ?? fields.find((f) => f.key === c.field)?.label ?? c.field)} />
    </form>
  );
}
