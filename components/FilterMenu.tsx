"use client";

import { ReactNode, useEffect, useState } from "react";

export interface MenuOption {
  value: string;
  label: string;
}

/**
 * Apple Music / Spotify-style filter/sort control: a rounded pill that opens a
 * popover of options with a checkmark on the active one. Turns accent when the
 * value differs from the default. Closes on outside click or Escape.
 */
export default function FilterMenu({
  options,
  value,
  onChange,
  defaultValue = "",
  leadingIcon,
  ariaLabel,
}: {
  options: MenuOption[];
  value: string;
  onChange: (value: string) => void;
  defaultValue?: string;
  leadingIcon?: ReactNode;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const active = value !== defaultValue;
  const current = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
          (active
            ? "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30"
            : "bg-elevated text-secondary hover:text-accent")
        }
      >
        {leadingIcon}
        <span className="whitespace-nowrap">{current}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"shrink-0 transition-transform " + (open ? "rotate-180" : "")}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="listbox"
            className="bg-elevated absolute left-0 z-30 mt-2 max-h-72 min-w-[190px] overflow-auto rounded-xl border border-hair p-1 shadow-xl"
          >
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[14px] transition-colors " +
                    (selected
                      ? "text-accent"
                      : "hover:bg-black/5 dark:hover:bg-white/10")
                  }
                >
                  <span className="whitespace-nowrap">{o.label}</span>
                  {selected && (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
