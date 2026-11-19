import type { FormulaParams } from "@/engines/formula";
import type { FormulaTool } from "./index";

// WHO adult categories; used by both BMI pages.
const BMI_VERDICT: FormulaParams["verdict"] = {
  of: "bmi",
  bands: [
    { below: 18.5, text: "underweight" },
    { below: 25, text: "healthy weight" },
    { below: 30, text: "overweight" },
    { text: "obesity" },
  ],
};

const BMI_FAQ = [
  { q: "What is a healthy BMI?", a: "For adults, the World Health Organization classes 18.5 to 24.9 as a healthy weight, 25 to 29.9 as overweight and 30 or more as obesity." },
  { q: "Is BMI accurate for everyone?", a: "No. BMI does not separate muscle from fat, so athletes can read as overweight, and it is not used for children or during pregnancy. Treat it as a screening number and talk to a doctor about your health." },
];

export const HEALTH_FORMULAS: FormulaTool[] = [
  {
    slug: "bmi-calculator",
    cluster: "health",
    keyword: "bmi calculator",
    volume: 1800000,
    secondary: ["body mass index calculator", "bmi calculator kg cm"],
    params: {
      inputs: [
        { key: "weight", label: "Weight", unit: "kg", default: 70, min: 20, max: 250, step: 0.5 },
        { key: "height", label: "Height", unit: "cm", default: 175, min: 100, max: 230, step: 1 },
      ],
      outputs: [
        { key: "bmi", label: "BMI", expr: "weight / (height / 100) ^ 2", decimals: 1 },
        { key: "low", label: "Healthy weight from", unit: "kg", expr: "18.5 * (height / 100) ^ 2", decimals: 1 },
        { key: "high", label: "Healthy weight up to", unit: "kg", expr: "24.9 * (height / 100) ^ 2", decimals: 1 },
      ],
      summary: "{weight} kg at {height} cm gives a BMI of {bmi}",
      verdict: BMI_VERDICT,
      formula: "BMI = weight (kg) ÷ height (m)²",
    },
    formula: {
      subject: "your body mass index (BMI)",
      examples: [
        { title: "60 kg at 165 cm", values: { weight: 60, height: 165 } },
        { title: "92 kg at 180 cm", values: { weight: 92, height: 180 } },
        { title: "50 kg at 172 cm", values: { weight: 50, height: 172 } },
      ],
    },
    editorial: {
      intro: "Check your body mass index from your weight in kilograms and height in centimetres. You get your BMI, the WHO category it falls in and the healthy weight range for your height.",
      faq: BMI_FAQ,
    },
    checks: [{ values: { weight: 70, height: 175 }, expect: { bmi: 22.9, low: 56.7, high: 76.3, verdict: "healthy weight" } }],
  },
  {
    slug: "bmi-calculator-pounds",
    cluster: "health",
    keyword: "bmi calculator in pounds and feet",
    volume: 60000,
    secondary: ["bmi calculator lbs", "bmi calculator feet inches"],
    params: {
      inputs: [
        { key: "weight", label: "Weight", unit: "lb", default: 160, min: 50, max: 550, step: 1 },
        { key: "feet", label: "Height (feet)", unit: "ft", default: 5, min: 3, max: 7, step: 1 },
        { key: "inches", label: "Height (inches)", unit: "in", default: 9, min: 0, max: 11, step: 1 },
      ],
      outputs: [
        { key: "bmi", label: "BMI", expr: "703 * weight / (feet * 12 + inches) ^ 2", decimals: 1 },
        { key: "low", label: "Healthy weight from", unit: "lb", expr: "18.5 * (feet * 12 + inches) ^ 2 / 703", decimals: 0 },
        { key: "high", label: "Healthy weight up to", unit: "lb", expr: "24.9 * (feet * 12 + inches) ^ 2 / 703", decimals: 0 },
      ],
      summary: "{weight} lb at {feet} ft {inches} in gives a BMI of {bmi}",
      verdict: BMI_VERDICT,
      formula: "BMI = 703 × weight (lb) ÷ height (in)²",
    },
    formula: {
      subject: "your BMI from pounds, feet and inches",
      examples: [
        { title: "135 lb at 5 ft 4 in", values: { weight: 135, feet: 5, inches: 4 } },
        { title: "210 lb at 6 ft 0 in", values: { weight: 210, feet: 6, inches: 0 } },
        { title: "118 lb at 5 ft 7 in", values: { weight: 118, feet: 5, inches: 7 } },
      ],
    },
    editorial: {
      intro: "Work out your BMI in US units: enter your weight in pounds and your height in feet and inches. You get your BMI, its category and the healthy weight range in pounds for your height.",
      faq: [
        { q: "Why is there a 703 in the formula?", a: "BMI is defined in kilograms and metres. Multiplying pounds per square inch by 703 converts it to the same scale, so the result matches the metric calculation." },
        ...BMI_FAQ.slice(1),
      ],
    },
    checks: [{ values: { weight: 160, feet: 5, inches: 9 }, expect: { bmi: 23.6, low: 125, high: 169, verdict: "healthy weight" } }],
  },
];
