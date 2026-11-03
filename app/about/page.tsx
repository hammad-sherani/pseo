import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/seo";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "About",
  description: `What ${SITE_NAME} is, how its calculators and converters work, and how the explanations are written and checked.`,
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function About() {
  return (
    <InfoPage title={`About ${SITE_NAME}`} lede="Free calculators, unit converters and text tools that give an answer instantly and show how they got it.">
      <section>
        <h2>What this site is</h2>
        <p>
          {SITE_NAME} is a collection of small, single-purpose tools: loan and mortgage calculators, unit converters, and
          word and character counters. Each tool answers one question well, updates as you type, and needs no account.
        </p>
      </section>
      <section>
        <h2>How the tools work</h2>
        <p>
          Every calculation runs in your browser. The numbers you type are not sent to a server, stored, or shared. Each
          tool page explains the formula it uses, so you can check any result by hand.
        </p>
        <p>
          The worked examples, tables and charts on each page are produced by the same code that powers the tool, so the
          figures in the explanation always match what the calculator gives you.
        </p>
      </section>
      <section>
        <h2>How the content is written</h2>
        <p>
          Explanations, how-to steps and FAQs are drafted with the help of AI writing tools, then checked against the
          tool&apos;s own output. Pages that don&apos;t meet our quality checks are not published or are kept out of search
          results.
        </p>
      </section>
      <section>
        <h2>A note on accuracy</h2>
        <p>
          We work to keep every formula correct, but results are estimates. Loan figures in particular depend on terms set
          by your lender, such as fees and how interest is compounded. For important financial decisions, confirm the
          numbers with a qualified professional.
        </p>
      </section>
      <section>
        <h2>Get in touch</h2>
        <p>
          Found a mistake or want a tool we don&apos;t have yet? <Link href="/contact">Contact us</Link>. You can also read
          our <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
