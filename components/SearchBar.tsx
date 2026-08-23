"use client";

import { useEffect, useRef, useState } from "react";
import { Album, SearchResponse } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import AlbumCard from "./AlbumCard";

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
        setError("Pretraga trenutno ne radi. Pokušaj ponovo.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  const tooShort = input.trim().length > 0 && input.trim().length < MIN_CHARS;

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pretraži album ili izvođača (npr. born to die)…"
          aria-label="Pretraga albuma"
          autoComplete="off"
          className="w-full rounded-lg border border-wax-border bg-wax-card px-4 py-3 pr-11 text-base outline-none placeholder:text-neutral-500 focus:border-wax-gold"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-wax-gold border-t-transparent" />
          ) : (
            "🔍"
          )}
        </span>
      </div>

      <div className="mt-2 min-h-[1.25rem] text-sm text-neutral-500">
        {tooShort && <span>Ukucaj bar {MIN_CHARS} karaktera…</span>}
        {!tooShort && searched && source && results.length > 0 && (
          <span>
            Rezultati iz izvora: <span className="text-neutral-300">{source}</span>
          </span>
        )}
        {error && <span className="text-red-400">{error}</span>}
      </div>

      <div className="mt-3 grid gap-3">
        {results.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>

      {searched && !loading && results.length === 0 && !error && (
        <p className="mt-6 text-center text-neutral-500">
          Nema rezultata za „{debounced.trim()}”.
        </p>
      )}
    </div>
  );
}
