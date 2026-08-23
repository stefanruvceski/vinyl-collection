import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — your record collection`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "vinyl",
    "records",
    "vinyl records",
    "record collection",
    "vinyl collection",
    "discogs",
    "album",
    "LP",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — your record collection`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — your record collection`,
    description: siteConfig.description,
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
          <header className="flex items-center justify-between py-5">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-wax-gold">◉</span> {siteConfig.name}
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-400">
              <Link href="/" className="hover:text-neutral-100">
                Search
              </Link>
              <Link href="/collection" className="hover:text-neutral-100">
                My collection
              </Link>
            </nav>
          </header>

          <main className="flex-1 py-2">{children}</main>

          <footer className="py-8 text-center text-xs text-neutral-600">
            Data: Discogs &amp; MusicBrainz. Your collection is stored locally in
            your browser.
          </footer>
        </div>
      </body>
    </html>
  );
}
