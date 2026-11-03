import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/seo";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${SITE_NAME}: report a wrong result, suggest a new tool, or ask a question.`,
  alternates: { canonical: `${SITE_URL}/contact` },
};

const REASONS = [
  { title: "Report a wrong result", text: "Tell us the page, what you entered, the answer you got and the answer you expected." },
  { title: "Suggest a tool", text: "Missing a calculator or converter? Tell us what you were trying to work out." },
  { title: "Anything else", text: "Questions about the site, privacy or partnerships." },
];

export default function Contact() {
  return (
    <InfoPage title="Contact" lede="Found a mistake, want a new tool, or have a question? We read every message.">
      <section>
        <h2>Email us</h2>
        {CONTACT_EMAIL ? (
          <p className="info-email"><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
        ) : (
          <p>Our contact address is being set up. Please check back soon.</p>
        )}
        <p>We usually reply within a few working days.</p>
      </section>
      <section>
        <h2>What to write about</h2>
        <dl className="info-list">
          {REASONS.map((r) => <div key={r.title}><dt>{r.title}</dt><dd>{r.text}</dd></div>)}
        </dl>
      </section>
      <section>
        <h2>Before you write</h2>
        <p>
          The tools run in your browser, so we can&apos;t see what you typed. When reporting a problem, please include the
          values you used. See our <Link href="/privacy">privacy policy</Link> for how we handle the messages we receive.
        </p>
      </section>
    </InfoPage>
  );
}
