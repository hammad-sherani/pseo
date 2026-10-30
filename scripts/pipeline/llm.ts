import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";

/** The one LLM operation the pipeline needs: schema-validated JSON out. Tests inject a fake. */
export interface LlmClient {
  json<S extends z.ZodType>(req: { system: string; user: string; schema: S }): Promise<z.infer<S>>;
}

export class LlmError extends Error {}

export const MODEL = process.env.PIPELINE_MODEL ?? "claude-opus-5-5";

export function anthropicLlm(client = new Anthropic()): LlmClient {
  return {
    async json({ system, user, schema }) {
      const res = await client.beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        // Copywriting and classification don't need deep reasoning.
        output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
        // If a safety classifier declines, the API retries on a fallback model in the same call.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        // The system prompt is identical across a run, so it is cached after the first call.
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: user }],
      });
      if (res.stop_reason === "refusal") {
        throw new LlmError(`Model declined (${res.stop_details?.category ?? "unknown"}): ${res.stop_details?.explanation ?? ""}`);
      }
      if (res.stop_reason === "max_tokens") throw new LlmError("Output hit max_tokens before the JSON was complete");
      if (!res.parsed_output) throw new LlmError("Response did not match the schema");
      return res.parsed_output;
    },
  };
}

/** Runs fn over items with at most `limit` in flight. */
export async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
    }),
  );
}
