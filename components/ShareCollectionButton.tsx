"use client";

import { useState } from "react";
import { useCollection } from "@/lib/useCollection";
import { encodeShare } from "@/lib/share";

const ShareIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

export default function ShareCollectionButton() {
  const { items, ready } = useCollection();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!ready || items.length === 0) return null;

  const share = async () => {
    const link = `${window.location.origin}/shared#c=${encodeShare(items)}`;

    // On mobile, offer the native share sheet first.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My vinyl collection",
          text: "Here's my vinyl collection on Vinyl Nation.",
          url: link,
        });
        return;
      } catch {
        // Cancelled or unsupported — fall through to the copy panel.
      }
    }

    setUrl(link);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-full bg-elevated px-4 py-2 text-[14px] font-medium text-secondary ring-1 ring-inset ring-[var(--border)] transition-colors hover:text-accent"
      >
        {ShareIcon}
        Share
      </button>

      {url && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setUrl(null)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-30 mt-2 w-[min(88vw,22rem)] rounded-xl border border-hair bg-[var(--bg-elevated)] p-3 shadow-lg">
            <p className="mb-2 text-[13px] text-secondary">
              Anyone with this link can see your albums — not prices, notes, or
              where you bought them.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="bg-field min-w-0 flex-1 rounded-lg px-3 py-2 text-[13px] outline-none"
              />
              <button
                type="button"
                onClick={copy}
                className="shrink-0 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
