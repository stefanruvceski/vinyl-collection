import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — tvoja kolekcija ploča`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "vinyl",
    "ploče",
    "gramofonske ploče",
    "kolekcija ploča",
    "vinyl kolekcija",
    "discogs",
    "album",
    "LP",
  ],
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — tvoja kolekcija ploča`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — tvoja kolekcija ploča`,
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
    <html lang="sr">
      <body>
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
          <header className="flex items-center justify-between py-5">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-wax-gold">◉</span> {siteConfig.name}
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-400">
              <Link href="/" className="hover:text-neutral-100">
                Pretraga
              </Link>
              <Link href="/collection" className="hover:text-neutral-100">
                Moja kolekcija
              </Link>
            </nav>
          </header>

          <main className="flex-1 py-2">{children}</main>

          <footer className="py-8 text-center text-xs text-neutral-600">
            Podaci: Discogs &amp; MusicBrainz. Kolekcija se čuva lokalno u tvom
            pregledaču.
          </footer>
        </div>
      </body>
    </html>
  );
}
