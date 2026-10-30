import type { Cluster } from "@/schemas/page";
import type { PageSpec } from "@/lib/content";

// Stand-in for the keyword ingest step: in production these rows come from
// a keyword export, clustered and mapped to engines by scripts/pipeline.
export const CLUSTERS: Cluster[] = [
  { slug: "finance", name: "Loan & Finance Calculators", intent: "calculate", description: "Payment, interest and amortization calculators for every common loan type." },
  { slug: "converters", name: "Unit Converters", intent: "convert", description: "Exact conversions for weight, length, temperature and volume, with printable charts." },
  { slug: "text", name: "Writing & Text Tools", intent: "check", description: "Count words and characters, estimate reading time and check keyword density." },
];

const loan = (slug: string, keyword: string, volume: number, secondary: string[], params: Record<string, unknown>): PageSpec =>
  ({ slug, cluster: "finance", engine: "loan", keyword, volume, secondary, params });

const units = (slug: string, keyword: string, volume: number, category: string, from: string, to: string, chartValues: number[]): PageSpec => ({
  slug, cluster: "converters", engine: "units", keyword, volume, secondary: [`${from} to ${to}`, `convert ${from} to ${to}`],
  params: { category, from, to, defaultValue: chartValues[3], chartValues }, primaryOutput: "summary",
});

export const SAMPLE_TEXT = `Programmatic SEO works when every page answers a real question. A calculator page should calculate, a converter should convert, and the words around the tool should explain the result.

Thin pages fail because they repeat the same template with a different keyword. Useful pages win because the tool itself is the content.`;

const text = (slug: string, keyword: string, volume: number, params: Partial<Record<string, unknown>>, primaryOutput: string, editorial: PageSpec["editorial"]): PageSpec => ({
  slug, cluster: "text", engine: "text", keyword, volume, secondary: [], primaryOutput, editorial,
  params: { focus: "words", wordsPerMinute: 238, sample: SAMPLE_TEXT, ...params },
});

export const PAGE_SPECS: PageSpec[] = [
  loan("auto-loan-calculator", "auto loan calculator", 450000, ["car payment calculator", "car loan calculator"],
    { loanLabel: "Auto loan", defaultAmount: 35000, maxAmount: 150000, defaultRate: 7.1, defaultTermMonths: 60, termOptions: [36, 48, 60, 72, 84], showDownPayment: true }),
  loan("mortgage-calculator", "mortgage calculator", 1200000, ["home loan calculator", "mortgage payment calculator"],
    { loanLabel: "Mortgage", defaultAmount: 400000, maxAmount: 2000000, defaultRate: 6.5, defaultTermMonths: 360, termOptions: [120, 180, 240, 360], showDownPayment: true }),
  loan("personal-loan-calculator", "personal loan calculator", 165000, ["personal loan payment calculator"],
    { loanLabel: "Personal loan", defaultAmount: 15000, maxAmount: 100000, defaultRate: 11.5, defaultTermMonths: 36, termOptions: [12, 24, 36, 48, 60], showDownPayment: false }),
  loan("student-loan-calculator", "student loan calculator", 90000, ["student loan payment calculator"],
    { loanLabel: "Student loan", defaultAmount: 30000, maxAmount: 200000, defaultRate: 5.5, defaultTermMonths: 120, termOptions: [60, 120, 180, 240, 300], showDownPayment: false }),
  loan("boat-loan-calculator", "boat loan calculator", 40000, ["boat payment calculator"],
    { loanLabel: "Boat loan", defaultAmount: 60000, maxAmount: 500000, defaultRate: 8.4, defaultTermMonths: 180, termOptions: [60, 120, 180, 240], showDownPayment: true }),

  units("kg-to-lbs", "kg to lbs", 900000, "mass", "kg", "lb", [1, 2, 5, 10, 20, 50, 70, 100]),
  units("lbs-to-kg", "lbs to kg", 820000, "mass", "lb", "kg", [1, 5, 10, 50, 100, 150, 200, 250]),
  units("cm-to-inches", "cm to inches", 670000, "length", "cm", "in", [1, 5, 10, 15, 30, 50, 100, 180]),
  units("km-to-miles", "km to miles", 300000, "length", "km", "mi", [1, 5, 10, 21.1, 42.2, 50, 100, 200]),
  units("celsius-to-fahrenheit", "celsius to fahrenheit", 550000, "temperature", "c", "f", [-40, -10, 0, 20, 25, 37, 100, 180]),
  units("fahrenheit-to-celsius", "fahrenheit to celsius", 500000, "temperature", "f", "c", [-40, 0, 32, 50, 72, 98.6, 212, 350]),
  units("liters-to-gallons", "liters to gallons", 110000, "volume", "l", "gal", [1, 2, 4, 5, 10, 20, 50, 100]),

  text("word-counter", "word counter", 2400000, { focus: "words" }, "words", {
    intro: "Count words as you type, then go further: sentences, paragraphs and a keyword density table that shows which terms you lean on most. Useful for blog posts, product copy, cover letters and anything with a target length.",
    howTo: ["Paste a draft or start typing in the editor.", "The word total sits at the top; sentence and paragraph counts sit beside it.", "Scan the density table for words that repeat more than you meant them to."],
    faq: [
      { q: "What counts as a word?", a: "Any run of letters or digits. Apostrophes stay inside a word, so “don't” is one word; hyphenated compounds like “well-known” count as two, which matches how most style guides and editors tally them." },
      { q: "Why does my count differ from Google Docs or Word?", a: "Tools disagree mainly on hyphens, numbers and URLs. Word treats “well-known” as one word, Google Docs as two. Differences are normally within 1–2%." },
      { q: "What is a good keyword density for SEO?", a: "There is no target number. If one term is far above every other in the table, rewrite a few instances with synonyms so the text reads naturally." },
    ],
  }),
  text("character-counter", "character counter", 600000, { focus: "characters" }, "characters", {
    intro: "See exactly how many characters your text uses, with and without spaces. Handy for meta descriptions, SMS messages, app store listings, form fields and any box with a hard character cap.",
    howTo: ["Paste the text you need to fit into a limited field.", "Compare the total with spaces against your platform's limit.", "Use the composition bar to see how much of the count is spaces and punctuation you could trim."],
    faq: [
      { q: "Do spaces count as characters?", a: "On almost every platform, yes. That is why the main figure includes spaces; the second figure without spaces is mostly used for translation pricing." },
      { q: "How long should a meta description be?", a: "Google truncates by pixel width, roughly 150–160 characters on desktop. Aim for about 150 to keep the whole sentence visible." },
      { q: "Are emoji one character?", a: "Visually yes, but many platforms store them as two or more code units, so an emoji can use 2 characters of a limit. This counter shows the JavaScript string length, which matches most web forms." },
    ],
  }),
  text("twitter-character-counter", "twitter character counter", 30000, { focus: "characters", limit: 280, context: "X (Twitter) post" }, "limitStatus", {
    intro: "Draft a post and see how much room is left before the 280-character limit on X (Twitter). The counter turns into an overage warning the moment you go past it, so you can trim before you hit post.",
    howTo: ["Write or paste your post.", "Watch the remaining-characters figure count down from 280.", "If it shows you are over, cut filler words or move detail into a reply."],
    faq: [
      { q: "Is the X (Twitter) limit still 280 characters?", a: "For standard accounts, yes. Premium subscribers can post longer text, but only the first 280 characters show in the timeline before “Show more”." },
      { q: "Do links count toward the 280?", a: "Every URL is shortened to a t.co link that counts as 23 characters, whatever its real length. Paste a placeholder of 23 characters here to plan for it." },
      { q: "Do @mentions at the start of a reply count?", a: "Not any more: leading @usernames in replies are excluded from the limit. Mentions inside the text do count." },
    ],
  }),
  text("essay-word-counter", "essay word counter", 25000, { focus: "words", limit: 500, context: "essay" }, "limitStatus", {
    intro: "Keep an essay inside its word limit. The counter tracks a 500-word target, tells you how many words you have left or how far over you are, and estimates how long the essay takes to read aloud.",
    howTo: ["Paste the essay body; leave out the title and references if your course excludes them.", "Check the words-left figure against the 500-word target.", "Use paragraph and sentence counts to balance sections: introduction, body paragraphs and conclusion."],
    faq: [
      { q: "Do titles and citations count toward an essay word limit?", a: "Usually not. Most schools exclude the title, reference list and footnotes, but include in-text citations. Check your assignment brief." },
      { q: "How strict is a word limit?", a: "Many instructors allow 10% either way, so a 500-word essay can run 450–550 words. Some penalise any overage, so ask if unsure." },
      { q: "How many paragraphs is a 500-word essay?", a: "Typically five: an introduction, three body paragraphs of around 100 words each, and a conclusion." },
    ],
  }),
  text("reading-time-calculator", "reading time calculator", 18000, { focus: "reading" }, "readingTime", {
    intro: "Find out how long a piece takes to read and to say out loud. Paste an article, newsletter or speech and get reading time at 238 words per minute plus speaking time at a presentation pace of 130 wpm.",
    howTo: ["Paste the full article or script.", "Read the reading-time figure for silent reading.", "Use speaking time when you are timing a talk, video script or podcast segment."],
    examples: [{ title: "A 1,500-word blog post", detail: "About 6 min 18 sec to read at 238 wpm, or 11 min 32 sec to deliver as a talk at 130 wpm." }],
    faq: [
      { q: "Why 238 words per minute?", a: "A 2019 meta-analysis of 190 studies put average adult silent reading speed for English non-fiction at about 238 wpm. Fiction is read a little faster." },
      { q: "Should I show reading time on my blog?", a: "Many publishers do because it sets expectations and can reduce early exits. Round to whole minutes when you display it." },
      { q: "How fast should I speak in a presentation?", a: "Between 120 and 150 words per minute is comfortable for most audiences. Slow down for technical material." },
    ],
  }),
];
