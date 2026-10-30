import type { Engine } from "./types";

export interface LoanParams {
  loanLabel: string;
  defaultAmount: number;
  maxAmount: number;
  defaultRate: number;
  defaultTermMonths: number;
  termOptions: number[];
  showDownPayment: boolean;
}

export const loanEngine: Engine<LoanParams> = {
  key: "loan",
  inputs: (p) => [
    { key: "amount", type: "number", label: `${p.loanLabel} amount`, unit: "$", min: 1000, max: p.maxAmount, step: 500 },
    ...(p.showDownPayment
      ? [{ key: "downPayment", type: "number" as const, label: "Down payment", unit: "$", min: 0, max: p.maxAmount / 2, step: 500 }]
      : []),
    { key: "rate", type: "number", label: "Interest rate (APR)", unit: "%", min: 0, max: 30, step: 0.1 },
    {
      key: "term",
      type: "select",
      label: "Loan term",
      options: p.termOptions.map((m) => ({ value: m, label: m % 12 === 0 ? `${m / 12} yr` : `${m} mo` })),
    },
  ],
  outputs: () => [
    { key: "monthlyPayment", kind: "number", label: "Monthly payment", format: "currency" },
    { key: "totalInterest", kind: "number", label: "Total interest", format: "currency" },
    { key: "totalCost", kind: "number", label: "Total cost", format: "currency" },
    { key: "principal", kind: "number", label: "Amount financed", format: "currency" },
    { key: "breakdown", kind: "breakdown", label: "Principal vs. interest" },
    { key: "schedule", kind: "table", label: "Amortization by year" },
  ],
  defaults: (p) => ({
    amount: p.defaultAmount,
    ...(p.showDownPayment ? { downPayment: Math.round(p.defaultAmount * 0.1) } : {}),
    rate: p.defaultRate,
    term: p.defaultTermMonths,
  }),
  run(input) {
    const principal = Math.max(0, Number(input.amount) - Number(input.downPayment ?? 0));
    const n = Math.max(1, Number(input.term));
    const r = Number(input.rate) / 100 / 12;
    const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));

    const rows: (string | number)[][] = [];
    let balance = principal;
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      const toPrincipal = monthly - interest;
      balance = Math.max(0, balance - toPrincipal);
      yearInterest += interest;
      yearPrincipal += toPrincipal;
      if (m % 12 === 0 || m === n) {
        rows.push([`Year ${Math.ceil(m / 12)}`, money(yearPrincipal), money(yearInterest), money(balance)]);
        yearInterest = 0;
        yearPrincipal = 0;
      }
    }

    const totalCost = monthly * n;
    const totalInterest = totalCost - principal;
    return {
      monthlyPayment: round2(monthly),
      totalInterest: round2(totalInterest),
      totalCost: round2(totalCost),
      principal: round2(principal),
      breakdown: [
        { label: "Principal", value: round2(principal) },
        { label: "Interest", value: round2(totalInterest) },
      ],
      schedule: { columns: ["Year", "Principal paid", "Interest paid", "Balance"], rows },
    };
  },
  formula: () => "M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where P is the amount financed, r the monthly rate (APR ÷ 12) and n the number of monthly payments.",
};

const round2 = (x: number) => Math.round(x * 100) / 100;
const money = (x: number) => `$${Math.round(x).toLocaleString("en-US")}`;
