import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/ads/config";
import { CommandMenu } from "@/components/CommandMenu";
import { SiteChrome } from "@/components/SiteChrome";
import { THEME_INIT_SCRIPT } from "@/theme/themes";
import { siteNav } from "@/lib/nav";
import { SITE_NAME, SITE_URL } from "@/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} – Free Online Tools`, template: `%s | ${SITE_NAME}` },
  description: "Free calculators, unit converters and text tools that run instantly in your browser.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0e" },
  ],
};

const FOOTER_LINKS = [
  { title: "Finance", links: [["/finance", "All loan calculators"], ["/finance/mortgage-calculator", "Mortgage calculator"], ["/finance/auto-loan-calculator", "Auto loan calculator"]] },
  { title: "Converters", links: [["/converters", "All unit converters"], ["/converters/kg-to-lbs", "Kilograms to pounds"], ["/converters/celsius-to-fahrenheit", "Celsius to Fahrenheit"]] },
  { title: "Text", links: [["/text", "All text tools"], ["/text/word-counter", "Word counter"], ["/text/character-counter", "Character counter"]] },
  { title: "Site", links: [["/about", "About"], ["/contact", "Contact"], ["/privacy", "Privacy policy"]] },
] as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nav = await siteNav();
  return (
    // The init script sets data-theme before hydration, so React must not flag it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <div className="app">
          <SiteChrome siteName={SITE_NAME} groups={nav.groups} total={nav.total} />
          <div className="app-main">
            <div id="main">{children}</div>
            <footer className="site-footer">
              <div className="container footer-inner">
                <div className="footer-brand">
                  <p className="footer-title">{SITE_NAME}</p>
                  <p>Free tools that run in your browser. Every result shows the formula behind it.</p>
                </div>
                {FOOTER_LINKS.map((col) => (
                  <nav key={col.title} aria-label={`${col.title} tools`} className="footer-col">
                    <h2>{col.title}</h2>
                    <ul>{col.links.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
                  </nav>
                ))}
              </div>
              <div className="container footer-legal">
                © {new Date().getFullYear()} {SITE_NAME}. Results are estimates; check important figures with a professional.
              </div>
            </footer>
          </div>
        </div>
        <CommandMenu items={nav.search} />
        {ADS_ENABLED && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
