import type { Engine } from "./types";

export interface TextParams {
  focus: "words" | "characters" | "reading";
  wordsPerMinute: number;
  limit?: number;
  /** What the limit belongs to, e.g. "X (Twitter) post"; distinguishes pages that share a limit. */
  context?: string;
  sample: string;
}

const STOP = new Set("the a an and or but of to in on at for with is are was were be it this that as by from".split(" "));

export const textEngine: Engine<TextParams> = {
  key: "text",
  inputs: () => [{ key: "text", type: "longtext", label: "Your text", placeholder: "Paste or type your text here…" }],
  outputs: (p) => [
    { key: "words", kind: "number", label: "Words", format: "integer" },
    { key: "characters", kind: "number", label: "Characters", format: "integer" },
    { key: "charactersNoSpaces", kind: "number", label: "Characters (no spaces)", format: "integer" },
    { key: "sentences", kind: "number", label: "Sentences", format: "integer" },
    { key: "paragraphs", kind: "number", label: "Paragraphs", format: "integer" },
    { key: "readingTime", kind: "number", label: `Reading time (${p.wordsPerMinute} wpm)`, format: "minutes" },
    { key: "speakingTime", kind: "number", label: "Speaking time (130 wpm)", format: "minutes" },
    { key: "limitStatus", kind: "text", label: "Limit" },
    { key: "composition", kind: "breakdown", label: "Character composition" },
    { key: "keywords", kind: "table", label: "Keyword density" },
  ],
  defaults: (p) => ({ text: p.sample }),
  run(input, p) {
    const text = String(input.text ?? "");
    const wordList = text.match(/[\p{L}\p{N}']+/gu) ?? [];
    const words = wordList.length;
    const counts = new Map<string, number>();
    for (const w of wordList) {
      const k = w.toLowerCase();
      if (k.length > 2 && !STOP.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const count = (re: RegExp) => (text.match(re) ?? []).length;
    const measured = p.focus === "characters" ? text.length : words;
    return {
      words,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, "").length,
      sentences: text.trim() ? count(/[^.!?]+[.!?]+(\s|$)/g) || 1 : 0,
      paragraphs: text.split(/\n\s*\n/).filter((s) => s.trim()).length,
      readingTime: Math.round((words / p.wordsPerMinute) * 10) / 10,
      speakingTime: Math.round((words / 130) * 10) / 10,
      limitStatus: p.limit
        ? measured <= p.limit
          ? `${p.limit - measured} ${p.focus === "characters" ? "characters" : "words"} left of ${p.limit}`
          : `${measured - p.limit} over the ${p.limit} limit`
        : `${words} words`,
      composition: [
        { label: "Letters", value: count(/\p{L}/gu) },
        { label: "Digits", value: count(/\p{N}/gu) },
        { label: "Spaces", value: count(/\s/g) },
        { label: "Punctuation", value: count(/[\p{P}\p{S}]/gu) },
      ],
      keywords: {
        columns: ["Word", "Count", "Density"],
        rows: top.map(([w, c]) => [w, c, `${((c / Math.max(1, words)) * 100).toFixed(1)}%`]),
      },
    };
  },
};
