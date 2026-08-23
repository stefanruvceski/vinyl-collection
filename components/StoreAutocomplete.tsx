"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { PurchaseMeta } from "@/lib/types";

interface Suggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

const fieldClass =
  "bg-elevated w-full rounded-lg border border-hair px-3 py-2 pr-8 text-[14px] outline-none focus:border-accent/50";

/**
 * "Bought at" input with OpenStreetMap place autocomplete. Picking a suggestion
 * stores the name + lat/lng (so the purchases map works later); typing freely
 * keeps just the name and clears any stale coordinates.
 */
export default function StoreAutocomplete({
  value,
  hasCoords,
  onChange,
}: {
  value: string;
  hasCoords: boolean;
  onChange: (meta: PurchaseMeta) => void;
}) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(input, 350);
  const skipNext = useRef(false);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const q = debounced.trim();
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setSuggestions((d.results as Suggestion[]) ?? []);
        setOpen(true);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setSuggestions([]);
      });
    return () => ctrl.abort();
  }, [debounced]);

  const onType = (t: string) => {
    setInput(t);
    // Free typing keeps the name but clears stale coordinates.
    onChange({ store: t || undefined, storeLat: undefined, storeLng: undefined });
  };

  const pick = (s: Suggestion) => {
    skipNext.current = true;
    setInput(s.label);
    setOpen(false);
    setSuggestions([]);
    onChange({ store: s.label, storeLat: s.lat, storeLng: s.lng });
  };

  return (
    <div className="relative">
      <input
        id="pd-store"
        type="text"
        autoComplete="off"
        placeholder="Shop name and/or city…"
        className={fieldClass}
        value={input}
        onChange={(e) => onType(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {hasCoords && (
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px]"
          title="Location saved — will show on the map"
        >
          📍
        </span>
      )}

      {open && suggestions.length > 0 && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="bg-elevated absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-hair p-1 shadow-xl">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span aria-hidden="true">📍</span>
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
