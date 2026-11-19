// A tiny, safe arithmetic language for formula tools. Formulas are data
// (stored in page params), so they are parsed here rather than run with eval.
//
//   numbers and names     2.5, weight, pi, e
//   operators             + - * / ^ (power, right-assoc), unary -, < > <= >= == != (1 or 0)
//   functions             sqrt abs min max round(x, digits) floor ceil ln log10 exp pow mod if(cond, a, b)

export type Node =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "op"; op: string; a: Node; b: Node }
  | { t: "neg"; a: Node }
  | { t: "call"; fn: string; args: Node[] };

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

const FUNCTIONS: Record<string, { arity: [number, number]; fn: (...x: number[]) => number }> = {
  sqrt: { arity: [1, 1], fn: Math.sqrt },
  abs: { arity: [1, 1], fn: Math.abs },
  min: { arity: [2, 9], fn: Math.min },
  max: { arity: [2, 9], fn: Math.max },
  round: { arity: [1, 2], fn: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d },
  floor: { arity: [1, 1], fn: Math.floor },
  ceil: { arity: [1, 1], fn: Math.ceil },
  ln: { arity: [1, 1], fn: Math.log },
  log10: { arity: [1, 1], fn: Math.log10 },
  exp: { arity: [1, 1], fn: Math.exp },
  pow: { arity: [2, 2], fn: Math.pow },
  mod: { arity: [2, 2], fn: (a, b) => a % b },
  if: { arity: [3, 3], fn: (c, a, b) => (c ? a : b) },
};

const TOKEN = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z_]\w*)|(<=|>=|==|!=|[-+*/^(),<>]))/y;

function tokenize(src: string): string[] {
  const out: string[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < src.length) {
    if (/^\s*$/.test(src.slice(TOKEN.lastIndex))) break;
    const at = TOKEN.lastIndex;
    const m = TOKEN.exec(src);
    if (!m) throw new Error(`Unexpected character at ${at} in "${src}"`);
    out.push(m[1] ?? m[2] ?? m[3]);
  }
  return out;
}

export function parse(src: string): Node {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const take = (expected?: string) => {
    const tok = tokens[i++];
    if (tok === undefined || (expected && tok !== expected)) throw new Error(`Expected ${expected ?? "a value"} in "${src}"`);
    return tok;
  };

  const binary = (next: () => Node, ops: string[]) => () => {
    let a = next();
    while (ops.includes(peek())) {
      const op = take();
      a = { t: "op", op, a, b: next() };
    }
    return a;
  };

  const primary = (): Node => {
    const tok = take();
    if (tok === "(") {
      const n = comparison();
      take(")");
      return n;
    }
    if (/^[\d.]/.test(tok)) return { t: "num", v: Number(tok) };
    if (/^[A-Za-z_]/.test(tok)) {
      if (peek() !== "(") return { t: "var", name: tok };
      const def = FUNCTIONS[tok];
      if (!def) throw new Error(`Unknown function "${tok}" in "${src}"`);
      take("(");
      const args: Node[] = [];
      if (peek() !== ")") {
        args.push(comparison());
        while (peek() === ",") {
          take();
          args.push(comparison());
        }
      }
      take(")");
      if (args.length < def.arity[0] || args.length > def.arity[1]) throw new Error(`Wrong number of arguments to ${tok}() in "${src}"`);
      return { t: "call", fn: tok, args };
    }
    throw new Error(`Unexpected "${tok}" in "${src}"`);
  };
  const unary = (): Node => (peek() === "-" ? (take(), { t: "neg", a: unary() }) : power());
  const power = (): Node => {
    const base = primary();
    return peek() === "^" ? (take(), { t: "op", op: "^", a: base, b: unary() }) : base;
  };
  const term = binary(unary, ["*", "/"]);
  const additive = binary(term, ["+", "-"]);
  const comparison = binary(additive, ["<", ">", "<=", ">=", "==", "!="]);

  const node = comparison();
  if (i < tokens.length) throw new Error(`Unexpected "${tokens[i]}" in "${src}"`);
  return node;
}

/** Names an expression reads, excluding constants; used to validate formulas. */
export function variables(node: Node, out = new Set<string>()): Set<string> {
  if (node.t === "var" && !(node.name in CONSTANTS)) out.add(node.name);
  if (node.t === "op") (variables(node.a, out), variables(node.b, out));
  if (node.t === "neg") variables(node.a, out);
  if (node.t === "call") node.args.forEach((a) => variables(a, out));
  return out;
}

export function evaluate(node: Node, scope: Record<string, number>): number {
  switch (node.t) {
    case "num":
      return node.v;
    case "var": {
      const v = scope[node.name] ?? CONSTANTS[node.name];
      if (v === undefined) throw new Error(`Unknown name "${node.name}"`);
      return v;
    }
    case "neg":
      return -evaluate(node.a, scope);
    case "call":
      return FUNCTIONS[node.fn].fn(...node.args.map((a) => evaluate(a, scope)));
    case "op": {
      const a = evaluate(node.a, scope);
      const b = evaluate(node.b, scope);
      switch (node.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return a / b;
        case "^": return a ** b;
        case "<": return +(a < b);
        case ">": return +(a > b);
        case "<=": return +(a <= b);
        case ">=": return +(a >= b);
        case "==": return +(a === b);
        default: return +(a !== b);
      }
    }
  }
}

const compiled = new Map<string, Node>();

/** Parses once per distinct expression string, then evaluates. */
export function calc(expr: string, scope: Record<string, number>): number {
  let node = compiled.get(expr);
  if (!node) compiled.set(expr, (node = parse(expr)));
  return evaluate(node, scope);
}
