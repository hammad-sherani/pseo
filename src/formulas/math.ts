import type { FormulaTool } from "./index";

export const MATH_FORMULAS: FormulaTool[] = [
  {
    slug: "percentage-calculator",
    cluster: "math",
    keyword: "percentage calculator",
    volume: 1500000,
    secondary: ["percent of a number", "what is x percent of y"],
    params: {
      inputs: [
        { key: "percent", label: "Percentage", unit: "%", default: 15, step: 0.5 },
        { key: "number", label: "Number", default: 200 },
      ],
      outputs: [{ key: "result", label: "Result", expr: "percent / 100 * number" }],
      summary: "{percent}% of {number} is {result}",
      formula: "Result = percentage ÷ 100 × number",
    },
    formula: {
      subject: "a percentage of any number",
      examples: [
        { title: "20% of 85", values: { percent: 20, number: 85 } },
        { title: "7.5% sales tax on 240", values: { percent: 7.5, number: 240 } },
        { title: "150% of 60", values: { percent: 150, number: 60 } },
      ],
    },
    editorial: {
      intro: "Find any percentage of any number: tax on a price, a share of a budget, a mark out of a total. Type the percentage and the number and the answer appears at once, with the working shown so you can check it.",
      faq: [
        { q: "How do I work out a percentage of a number in my head?", a: "Find 10% by moving the decimal point one place left, then scale. For 15% of 200: 10% is 20, 5% is half of that (10), so 15% is 30." },
        { q: "Is x% of y the same as y% of x?", a: "Yes. Multiplication works in either order, so 8% of 50 equals 50% of 8. Both are 4, and swapping can make mental maths easier." },
        { q: "Can a percentage be more than 100?", a: "Yes. 150% of a number is one and a half times it; 200% is double. Percentages above 100 are common for growth figures." },
      ],
    },
    checks: [{ values: { percent: 15, number: 200 }, expect: { result: 30, summary: "15% of 200 is 30" } }],
  },
  {
    slug: "percentage-change-calculator",
    cluster: "math",
    keyword: "percentage change calculator",
    volume: 200000,
    secondary: ["percent increase calculator", "percent decrease calculator"],
    params: {
      inputs: [
        { key: "old", label: "Original value", default: 80 },
        { key: "new", label: "New value", default: 100 },
      ],
      outputs: [
        { key: "change", label: "Percentage change", unit: "%", expr: "(new - old) / abs(old) * 100", decimals: 2 },
        { key: "difference", label: "Difference", expr: "new - old" },
      ],
      summary: "Going from {old} to {new} is a change of {change}%",
      verdict: { of: "change", bands: [{ below: 0, text: "a decrease" }, { below: 1e-9, text: "no change" }, { text: "an increase" }] },
      formula: "Change = (new value − original value) ÷ |original value| × 100",
    },
    formula: {
      subject: "the percentage increase or decrease between two values",
      examples: [
        { title: "A price rising from $40 to $52", values: { old: 40, new: 52 } },
        { title: "Visitors falling from 1,250 to 900", values: { old: 1250, new: 900 } },
        { title: "A salary going from 48,000 to 51,000", values: { old: 48000, new: 51000 } },
      ],
    },
    editorial: {
      intro: "Measure how much something grew or shrank in percentage terms: prices, salaries, traffic, test scores. Enter the starting value and the new one to get the percentage change, the raw difference and whether it is an increase or a decrease.",
      faq: [
        { q: "Why is a 50% drop not undone by a 50% rise?", a: "Each percentage is taken from a different starting value. 100 falls 50% to 50, but a 50% rise from 50 only gets you to 75. You need a 100% rise to get back." },
        { q: "What is the difference between percentage change and percentage points?", a: "If a rate moves from 4% to 5%, it rose by 1 percentage point but by 25% in relative terms. Use points for differences between two percentages." },
        { q: "What if the original value is zero?", a: "Percentage change from zero is undefined, because you cannot divide by zero. Report the raw difference instead." },
      ],
    },
    checks: [
      { values: { old: 80, new: 100 }, expect: { change: 25, difference: 20, verdict: "an increase" } },
      { values: { old: 50, new: 40 }, expect: { change: -20, verdict: "a decrease" } },
    ],
  },
  {
    slug: "what-percent-calculator",
    cluster: "math",
    keyword: "what percent calculator",
    volume: 90000,
    secondary: ["x is what percent of y", "percentage of total"],
    params: {
      inputs: [
        { key: "part", label: "Part", default: 45 },
        { key: "whole", label: "Whole", default: 60 },
      ],
      outputs: [{ key: "percent", label: "Percentage", unit: "%", expr: "part / whole * 100", decimals: 2 }],
      summary: "{part} is {percent}% of {whole}",
      formula: "Percentage = part ÷ whole × 100",
    },
    formula: {
      subject: "what percentage one number is of another",
      examples: [
        { title: "A test score of 42 out of 50", values: { part: 42, whole: 50 } },
        { title: "18 of 240 survey answers", values: { part: 18, whole: 240 } },
        { title: "$350 of a $1,400 rent", values: { part: 350, whole: 1400 } },
      ],
    },
    editorial: {
      intro: "Turn a part and a whole into a percentage: a score out of a total, a share of a budget, the portion of a survey that answered yes. Enter both numbers to see what percent the first is of the second.",
      faq: [
        { q: "How do I turn a fraction into a percentage?", a: "Divide the top number by the bottom one and multiply by 100. Three quarters is 3 ÷ 4 = 0.75, which is 75%." },
        { q: "Can the part be bigger than the whole?", a: "Yes, and the answer will be over 100%. That is normal when comparing, say, this year's sales with last year's." },
      ],
    },
    checks: [{ values: { part: 45, whole: 60 }, expect: { percent: 75, summary: "45 is 75% of 60" } }],
  },
  {
    slug: "discount-calculator",
    cluster: "math",
    keyword: "discount calculator",
    volume: 165000,
    secondary: ["sale price calculator", "percent off calculator"],
    params: {
      inputs: [
        { key: "price", label: "Original price", format: "currency", default: 80, step: 1 },
        { key: "discount", label: "Discount", unit: "%", default: 25, step: 5 },
      ],
      outputs: [
        { key: "final", label: "Sale price", format: "currency", expr: "price * (1 - discount / 100)", decimals: 2 },
        { key: "savings", label: "You save", format: "currency", expr: "price - final", decimals: 2 },
      ],
      summary: "{discount}% off {price} is {final}, saving you {savings}",
      formula: "Sale price = original price × (1 − discount ÷ 100)",
    },
    formula: {
      subject: "the sale price after a percentage discount",
      examples: [
        { title: "30% off a $129 jacket", values: { price: 129, discount: 30 } },
        { title: "15% off a $899 laptop", values: { price: 899, discount: 15 } },
        { title: "A half-price $46 order", values: { price: 46, discount: 50 } },
      ],
    },
    editorial: {
      intro: "See what you will actually pay in a sale. Enter the original price and the percentage off to get the sale price and how much you save, before you get to the checkout.",
      faq: [
        { q: "Is 20% off and then another 20% off the same as 40% off?", a: "No. Stacked discounts multiply: the second 20% comes off the already reduced price, so the total is 36% off, not 40%." },
        { q: "Is sales tax included?", a: "No. Tax is normally added to the sale price at the till. Use the percentage calculator to add your local rate." },
      ],
    },
    checks: [{ values: { price: 80, discount: 25 }, expect: { final: 60, savings: 20 } }],
  },
  {
    slug: "tip-calculator",
    cluster: "math",
    keyword: "tip calculator",
    volume: 450000,
    secondary: ["gratuity calculator", "split bill calculator"],
    primaryOutput: "perPerson",
    params: {
      inputs: [
        { key: "bill", label: "Bill amount", format: "currency", default: 64.5, step: 1 },
        { key: "tipPercent", label: "Tip", unit: "%", default: 18, step: 1 },
        { key: "people", label: "Number of people", format: "integer", default: 2, min: 1, max: 20, step: 1 },
      ],
      outputs: [
        { key: "tip", label: "Tip", format: "currency", expr: "bill * tipPercent / 100", decimals: 2 },
        { key: "total", label: "Total with tip", format: "currency", expr: "bill + tip", decimals: 2 },
        { key: "perPerson", label: "Each person pays", format: "currency", expr: "total / max(1, round(people))", decimals: 2 },
      ],
      summary: "A {tipPercent}% tip on {bill} is {tip}, so the total is {total}: {perPerson} each for {people}",
      formula: "Tip = bill × tip % ÷ 100; each person pays (bill + tip) ÷ number of people",
    },
    formula: {
      subject: "the tip and each person's share of the bill",
      examples: [
        { title: "A $120 dinner for four at 20%", values: { bill: 120, tipPercent: 20, people: 4 } },
        { title: "A $38.40 lunch for one at 15%", values: { bill: 38.4, tipPercent: 15, people: 1 } },
        { title: "A $250 group meal for six at 18%", values: { bill: 250, tipPercent: 18, people: 6 } },
      ],
    },
    editorial: {
      intro: "Work out the tip and split the bill in one step. Enter the bill, pick a tip percentage and the number of people, and see the tip, the total and exactly what each person owes.",
      faq: [
        { q: "How much should I tip at a restaurant in the US?", a: "15–20% of the pre-tax bill is standard for table service, with 20% common in cities. Many people tip less for counter service." },
        { q: "Should I tip on the total before or after tax?", a: "Etiquette guides suggest tipping on the pre-tax amount. Enter the bill before tax here if you follow that rule." },
      ],
    },
    checks: [{ values: { bill: 100, tipPercent: 20, people: 4 }, expect: { tip: 20, total: 120, perPerson: 30 } }],
  },
];
