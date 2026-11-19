import type { FormulaTool } from "./index";

export const FINANCE_FORMULAS: FormulaTool[] = [
  {
    slug: "compound-interest-calculator",
    cluster: "finance",
    keyword: "compound interest calculator",
    volume: 1000000,
    secondary: ["interest calculator", "savings growth calculator"],
    params: {
      inputs: [
        { key: "principal", label: "Starting amount", format: "currency", default: 10000, min: 0, max: 1000000, step: 100 },
        { key: "rate", label: "Annual interest rate", unit: "%", default: 5, min: 0, max: 30, step: 0.1 },
        { key: "years", label: "Years", default: 10, min: 1, max: 50, step: 1 },
        {
          key: "periods", label: "Compounding", default: 12,
          options: [{ value: 1, label: "Yearly" }, { value: 4, label: "Quarterly" }, { value: 12, label: "Monthly" }, { value: 365, label: "Daily" }],
        },
      ],
      outputs: [
        { key: "balance", label: "Final balance", format: "currency", expr: "principal * (1 + rate / 100 / periods) ^ (periods * years)", decimals: 2 },
        { key: "interest", label: "Interest earned", format: "currency", expr: "balance - principal", decimals: 2 },
        { key: "growth", label: "Total growth", unit: "%", expr: "if(principal > 0, interest / principal * 100, 0)", decimals: 1 },
      ],
      summary: "{principal} at {rate}% for {years} years grows to {balance}, earning {interest} in interest",
      formula: "Balance = P × (1 + r ÷ n)^(n × t), where r is the annual rate, n the compounding periods per year and t the years",
    },
    formula: {
      subject: "how much your savings grow with compound interest",
      examples: [
        { title: "$5,000 at 4% for 5 years, compounded monthly", values: { principal: 5000, rate: 4, years: 5, periods: 12 } },
        { title: "$25,000 at 7% for 20 years, compounded yearly", values: { principal: 25000, rate: 7, years: 20, periods: 1 } },
        { title: "$1,000 at 10% for 30 years, compounded daily", values: { principal: 1000, rate: 10, years: 30, periods: 365 } },
      ],
    },
    editorial: {
      intro: "See how a lump sum grows when interest earns interest. Enter a starting amount, the annual rate, how many years and how often interest is added, and get the final balance and the interest earned.",
      faq: [
        { q: "What is the difference between simple and compound interest?", a: "Simple interest is paid only on the original amount. Compound interest is added to the balance, so later interest is earned on earlier interest as well, and growth speeds up over time." },
        { q: "Does compounding more often make a big difference?", a: "Less than most people expect. At 5% for 10 years, monthly compounding beats yearly by about 1.8% of the starting amount; daily adds only a little more." },
        { q: "What is the rule of 72?", a: "Divide 72 by the annual rate to estimate how many years it takes to double your money. At 6%, that is about 12 years." },
      ],
    },
    checks: [
      { values: { principal: 10000, rate: 5, years: 10, periods: 1 }, expect: { balance: 16288.95, interest: 6288.95 } },
      { values: { principal: 10000, rate: 5, years: 10, periods: 12 }, expect: { balance: 16470.09 } },
    ],
  },
];
