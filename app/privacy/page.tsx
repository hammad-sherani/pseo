import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/seo";
import { InfoPage } from "@/components/InfoPage";
import { ADS_ENABLED } from "@/ads/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles your data: calculations run in your browser and nothing you type is sent to us.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

// Bump when the policy text changes, including the first deploy with AdSense switched on.
const UPDATED = "2026-11-03";

export default function Privacy() {
  return (
    <InfoPage title="Privacy Policy" lede="The short version: the tools run in your browser, and nothing you type into them is sent to us." updated={UPDATED}>
      <section>
        <h2>What you type into the tools</h2>
        <p>
          All calculators, converters and text tools on {SITE_NAME} run entirely in your browser. The numbers and text
          you enter are processed on your device and are never sent to our servers, stored, or shared.
        </p>
      </section>
      <section>
        <h2>Accounts and forms</h2>
        <p>{SITE_NAME} has no user accounts, sign-up forms or newsletters, so we don&apos;t collect your name, email address or other personal details through the site. If you email us, we use your address and message only to reply to you.</p>
      </section>
      <section>
        <h2>Cookies and local storage</h2>
        <p>
          {ADS_ENABLED
            ? "We don't set cookies ourselves, but our advertising partner does (see below)."
            : "We don't set cookies."}{" "}
          If you switch between light and dark mode, that choice is saved in your browser&apos;s local storage so the site
          remembers it on your next visit. It never leaves your device, and you can clear it at any time through your
          browser settings.
        </p>
      </section>
      <section>
        <h2>Server logs</h2>
        <p>
          Like almost every website, our hosting provider automatically records basic technical information when a page is
          requested: your IP address, browser type, the page you asked for and the time. These logs are used to keep the
          site secure and running, are kept for a limited time, and are not used to identify you.
        </p>
      </section>
      <section>
        <h2>Analytics and advertising</h2>
        {ADS_ENABLED ? (
          <>
            <p>
              {SITE_NAME} shows ads served by Google AdSense. Google and its partners use cookies and similar technologies to
              show ads based on your visits to this and other websites, to limit how often you see an ad, and to measure
              how ads perform. Ads are shown only around the tools; what you type into a tool is never shared with them.
            </p>
            <p>
              You can turn off personalised ads in{" "}
              <a href="https://adssettings.google.com" rel="noopener">Google&apos;s Ads Settings</a>, or opt out of many
              third-party ad networks at <a href="https://www.aboutads.info/choices" rel="noopener">aboutads.info</a>. See{" "}
              <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses data from sites that use its services</a>.
            </p>
            <p>{SITE_NAME} uses no analytics services.</p>
          </>
        ) : (
          <p>
            {SITE_NAME} currently uses no analytics or advertising services. If we add any in the future, we will update
            this policy before they go live and explain what they collect and how to opt out.
          </p>
        )}
      </section>
      <section>
        <h2>Links to other sites</h2>
        <p>Pages may link to other websites. We are not responsible for their privacy practices, so please read their policies when you visit them.</p>
      </section>
      <section>
        <h2>Children</h2>
        <p>{SITE_NAME} is a general-audience site and does not knowingly collect personal information from children.</p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>
          If this policy changes, we will update it on this page and change the date at the top. Questions about privacy?{" "}
          <Link href="/contact">Contact us</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
