import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { AuthProvider } from "@/components/AuthProvider";
import AuthMenu from "@/components/AuthMenu";
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
      <body className="font-sans">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-hair bg-[var(--bg)]/80 backdrop-blur-xl backdrop-saturate-150">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-[17px] font-semibold tracking-tight"
                >
                  <span className="text-accent">●</span>
                  {siteConfig.name}
                </Link>
                <nav className="flex items-center gap-6 text-[14px] font-medium text-secondary">
                  <Link href="/" className="transition-colors hover:text-accent">
                    Search
                  </Link>
                  <Link
                    href="/collection"
                    className="transition-colors hover:text-accent"
                  >
                    My collection
                  </Link>
                  <Link
                    href="/history"
                    className="transition-colors hover:text-accent"
                  >
                    History
                  </Link>
                  <AuthMenu />
                </nav>
              </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
