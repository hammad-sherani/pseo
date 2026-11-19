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
  {
    slug: "calorie-calculator",
    cluster: "health",
    keyword: "calorie calculator",
    volume: 1200000,
    secondary: ["tdee calculator", "bmr calculator", "maintenance calorie calculator"],
    params: {
      inputs: [
        // The option values are the Mifflin-St Jeor sex constants.
        { key: "sex", label: "Sex", default: 5, options: [{ value: 5, label: "Male" }, { value: -161, label: "Female" }] },
        { key: "age", label: "Age", unit: "years", default: 30, min: 15, max: 80, step: 1 },
        { key: "weight", label: "Weight", unit: "kg", default: 70, min: 30, max: 250, step: 0.5 },
        { key: "height", label: "Height", unit: "cm", default: 175, min: 120, max: 230, step: 1 },
        {
          key: "activity", label: "Activity level", default: 1.55,
          options: [
            { value: 1.2, label: "Sedentary (little or no exercise)" },
            { value: 1.375, label: "Light (exercise 1–3 days a week)" },
            { value: 1.55, label: "Moderate (exercise 3–5 days a week)" },
            { value: 1.725, label: "Very active (6–7 days a week)" },
            { value: 1.9, label: "Extra active (physical job or twice a day)" },
          ],
        },
      ],
      outputs: [
        { key: "maintain", label: "Calories to maintain weight", unit: "kcal/day", expr: "round((10 * weight + 6.25 * height - 5 * age + sex) * activity)" },
        { key: "bmr", label: "Basal metabolic rate (BMR)", unit: "kcal/day", expr: "round(10 * weight + 6.25 * height - 5 * age + sex)" },
        { key: "lose", label: "Mild weight loss (−500 kcal)", unit: "kcal/day", expr: "maintain - 500" },
        { key: "gain", label: "Mild weight gain (+500 kcal)", unit: "kcal/day", expr: "maintain + 500" },
      ],
      summary: "You burn about {maintain} kcal a day; your BMR is {bmr} kcal",
      formula: "BMR = 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5 (male) or − 161 (female); daily calories = BMR × activity factor",
    },
    formula: {
      subject: "how many calories you burn each day",
      examples: [
        { title: "A 25-year-old woman, 60 kg, 165 cm, sedentary", values: { sex: -161, age: 25, weight: 60, height: 165, activity: 1.2 } },
        { title: "A 40-year-old man, 90 kg, 182 cm, lightly active", values: { sex: 5, age: 40, weight: 90, height: 182, activity: 1.375 } },
        { title: "A 55-year-old woman, 72 kg, 160 cm, moderately active", values: { sex: -161, age: 55, weight: 72, height: 160, activity: 1.55 } },
      ],
    },
    editorial: {
      intro: "Estimate how many calories your body uses in a day. Enter your sex, age, weight, height and activity level to get your basal metabolic rate (BMR), the calories that keep your weight steady and targets for mild loss or gain.",
      faq: [
        { q: "Which formula does this calculator use?", a: "The Mifflin-St Jeor equation, published in 1990. Studies comparing BMR equations have found it among the most accurate for most adults, though any equation can be off by around 10% for an individual." },
        { q: "How fast will a 500-calorie deficit make me lose weight?", a: "Roughly 0.5 kg (about 1 lb) a week at first. Weight loss usually slows over time as your body adapts, so adjust your target every few weeks." },
        { q: "How low should I go?", a: "Common guidance is not to eat below about 1,200 kcal a day for women or 1,500 for men without medical supervision. Talk to a doctor or dietitian before a big change." },
      ],
    },
    checks: [
      { values: { sex: 5, age: 30, weight: 80, height: 180, activity: 1.55 }, expect: { bmr: 1780, maintain: 2759, lose: 2259 } },
      { values: { sex: -161, age: 25, weight: 60, height: 165, activity: 1.2 }, expect: { bmr: 1345, maintain: 1614 } },
    ],
  },
];
