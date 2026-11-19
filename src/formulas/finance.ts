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
  {
    slug: "simple-interest-calculator",
    cluster: "finance",
    keyword: "simple interest calculator",
    volume: 200000,
    secondary: ["simple interest formula", "interest calculator without compounding"],
    params: {
      inputs: [
        { key: "principal", label: "Principal", format: "currency", default: 5000, min: 0, step: 100 },
        { key: "rate", label: "Annual interest rate", unit: "%", default: 4, min: 0, max: 50, step: 0.1 },
        { key: "years", label: "Years", default: 3, min: 0, max: 50, step: 0.5 },
      ],
      outputs: [
        { key: "interest", label: "Interest", format: "currency", expr: "principal * rate / 100 * years", decimals: 2 },
        { key: "total", label: "Total amount", format: "currency", expr: "principal + interest", decimals: 2 },
        { key: "perYear", label: "Interest per year", format: "currency", expr: "principal * rate / 100", decimals: 2 },
      ],
      summary: "{principal} at {rate}% simple interest for {years} years earns {interest}, for a total of {total}",
      formula: "Interest = principal × rate ÷ 100 × years",
    },
    formula: {
      subject: "simple interest on a loan or deposit",
      examples: [
        { title: "$10,000 at 6% for 2 years", values: { principal: 10000, rate: 6, years: 2 } },
        { title: "$2,500 at 3.5% for 18 months", values: { principal: 2500, rate: 3.5, years: 1.5 } },
        { title: "$50,000 at 8% for 5 years", values: { principal: 50000, rate: 8, years: 5 } },
      ],
    },
    editorial: {
      intro: "Work out interest that is charged or paid only on the original amount. Enter the principal, the annual rate and the time in years to get the interest, the total and the interest for each year.",
      faq: [
        { q: "Where is simple interest used?", a: "Some car loans and short-term personal loans, bond coupon payments, and deposits that pay interest out instead of adding it to the balance." },
        { q: "How is it different from compound interest?", a: "Simple interest is always worked out on the original principal, so it grows in a straight line. Compound interest is added to the balance and earns interest itself, so it grows faster." },
        { q: "How do I enter months?", a: "Divide the months by 12. Eighteen months is 1.5 years; 9 months is 0.75 years." },
      ],
    },
    checks: [{ values: { principal: 5000, rate: 4, years: 3 }, expect: { interest: 600, total: 5600, perYear: 200 } }],
  },
  {
    slug: "roi-calculator",
    cluster: "finance",
    keyword: "roi calculator",
    volume: 110000,
    secondary: ["return on investment calculator", "investment return calculator"],
    params: {
      inputs: [
        { key: "invested", label: "Amount invested", format: "currency", default: 1000, min: 0, step: 100 },
        { key: "returned", label: "Amount returned", format: "currency", default: 1500, min: 0, step: 100 },
        { key: "years", label: "Years held", default: 3, min: 0.1, max: 50, step: 0.5 },
      ],
      outputs: [
        { key: "roi", label: "Return on investment", unit: "%", expr: "(returned - invested) / invested * 100", decimals: 2 },
        { key: "gain", label: "Gain or loss", format: "currency", expr: "returned - invested", decimals: 2 },
        { key: "annual", label: "Annualized return", unit: "%", expr: "((returned / invested) ^ (1 / years) - 1) * 100", decimals: 2 },
      ],
      summary: "Turning {invested} into {returned} is a {roi}% return, or {annual}% a year over {years} years",
      formula: "ROI = (amount returned − amount invested) ÷ amount invested × 100; annualized = ((returned ÷ invested)^(1 ÷ years) − 1) × 100",
    },
    formula: {
      subject: "the return on an investment, in total and per year",
      examples: [
        { title: "$5,000 grown to $7,200 over 4 years", values: { invested: 5000, returned: 7200, years: 4 } },
        { title: "$20,000 sold for $18,500 after 2 years", values: { invested: 20000, returned: 18500, years: 2 } },
        { title: "$800 of ad spend bringing in $2,000 in a year", values: { invested: 800, returned: 2000, years: 1 } },
      ],
    },
    editorial: {
      intro: "Measure how well an investment paid off. Enter what you put in, what you got back and how long you held it to get the total return, the gain or loss and the annualized return that makes different time periods comparable.",
      faq: [
        { q: "Why does annualized return matter?", a: "A 50% return over 10 years is far weaker than 50% over 2 years. The annualized figure converts both to a yearly rate (about 4.1% versus 22.5%) so you can compare them." },
        { q: "Should I include fees and dividends?", a: "Yes. Subtract fees and taxes from the amount returned and add any dividends or interest you received, so the ROI reflects what you actually earned." },
      ],
    },
    checks: [{ values: { invested: 1000, returned: 1500, years: 3 }, expect: { roi: 50, gain: 500, annual: 14.47 } }],
  },
  {
    slug: "salary-to-hourly-calculator",
    cluster: "finance",
    keyword: "salary to hourly calculator",
    volume: 300000,
    secondary: ["annual salary to hourly", "salary calculator"],
    params: {
      inputs: [
        { key: "salary", label: "Annual salary", format: "currency", default: 60000, min: 0, step: 1000 },
        { key: "hours", label: "Hours per week", default: 40, min: 1, max: 100, step: 1 },
        { key: "weeks", label: "Paid weeks per year", default: 52, min: 1, max: 52, step: 1 },
      ],
      outputs: [
        { key: "hourly", label: "Hourly rate", format: "currency", expr: "salary / (hours * weeks)", decimals: 2 },
        { key: "weekly", label: "Weekly pay", format: "currency", expr: "salary / weeks", decimals: 2 },
        { key: "monthly", label: "Monthly pay", format: "currency", expr: "salary / 12", decimals: 2 },
      ],
      summary: "A {salary} salary at {hours} hours a week is {hourly} an hour",
      formula: "Hourly rate = annual salary ÷ (hours per week × paid weeks per year)",
    },
    formula: {
      subject: "the hourly rate behind an annual salary",
      examples: [
        { title: "$45,000 a year at 40 hours a week", values: { salary: 45000, hours: 40, weeks: 52 } },
        { title: "$85,000 a year at 45 hours a week", values: { salary: 85000, hours: 45, weeks: 52 } },
        { title: "$32,000 a year at 30 hours, 48 paid weeks", values: { salary: 32000, hours: 30, weeks: 48 } },
      ],
    },
    editorial: {
      intro: "Convert an annual salary into an hourly rate, plus weekly and monthly pay. Adjust the hours you work each week and the weeks you are paid for to compare a salaried offer with an hourly one.",
      faq: [
        { q: "How many work hours are in a year?", a: "A full-time year is usually counted as 2,080 hours: 40 hours a week for 52 weeks. Paid holidays and vacation are included because you are paid for them." },
        { q: "Is this before or after tax?", a: "Before tax. Take-home pay depends on federal, state and local taxes and deductions such as retirement contributions and health insurance." },
        { q: "What is a quick way to estimate it?", a: "Halve the annual salary and drop the thousands: $60,000 is about $30 an hour. The exact figure at 2,080 hours is $28.85." },
      ],
    },
    checks: [{ values: { salary: 60000, hours: 40, weeks: 52 }, expect: { hourly: 28.85, weekly: 1153.85, monthly: 5000 } }],
  },
];
