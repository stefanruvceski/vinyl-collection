"use client";

import { useEffect, useRef, useState } from "react";
import { Album, SearchResponse } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import AlbumCard from "./AlbumCard";
import Recommendations from "./Recommendations";

const MIN_CHARS = 3;

export default function SearchBar() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Album[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const debounced = useDebouncedValue(input, 325);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = debounced.trim();

    // Ispod praga: ocisti i ne zovi API (nema GET-a na svako slovo).
    if (q.length < MIN_CHARS) {
      abortRef.current?.abort();
      setResults([]);
      setSearched(false);
      setError(null);
      setLoading(false);
      return;
    }

    // Otkazi prethodni in-flight zahtev da stariji odgovor ne pregazi noviji.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch(`/api/search?mode=suggest&q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("search-failed");
        return (await res.json()) as SearchResponse;
      })
      .then((data) => {
        setResults(data.results);
        setSource(data.source);
        setSearched(true);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Search isn't working right now. Please try again.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  const tooShort = input.trim().length > 0 && input.trim().length < MIN_CHARS;

  return (
    <div className="w-full">
      <div className="relative mx-auto max-w-xl">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          )}
        </span>
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Artists, albums…"
          aria-label="Album search"
          autoComplete="off"
          className="bg-field w-full rounded-2xl border border-transparent py-3.5 pl-11 pr-4 text-[15px] outline-none transition-shadow placeholder:text-secondary focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
        />
      </div>

      <div className="mx-auto mt-2.5 min-h-[1.25rem] max-w-xl px-1 text-[13px] text-secondary">
        {tooShort && <span>Type at least {MIN_CHARS} characters…</span>}
        {!tooShort && searched && source && results.length > 0 && (
          <span>
            Results from <span className="capitalize text-accent">{source}</span>
          </span>
        )}
        {error && <span className="text-accent">{error}</span>}
      </div>

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <p className="mt-10 text-center text-[15px] text-secondary">
          No results for “{debounced.trim()}”.
        </p>
      )}

      {input.trim().length === 0 && <Recommendations />}
    </div>
  );
}
