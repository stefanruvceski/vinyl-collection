"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

type Step = "email" | "code";

function AuthDialog({ onClose }: { onClose: () => void }) {
  const { supabase } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sendCode = async () => {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStep("code");
  };

  const verify = async () => {
    if (!supabase || !code.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setError(error.message);
    else onClose(); // onAuthStateChange updates the app
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-hair bg-[var(--bg-elevated)] p-6 shadow-xl"
      >
        <h2 className="text-[19px] font-bold tracking-tight">
          {step === "email" ? "Sign in to sync" : "Enter your code"}
        </h2>
        <p className="mt-1 text-[13px] text-secondary">
          {step === "email"
            ? "We'll email you a one-time code. No password needed."
            : `We sent a code to ${email}. Enter it below.`}
        </p>

        <div className="mt-4 space-y-3">
          {step === "email" ? (
            <input
              ref={firstField}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              className="bg-field w-full rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-4 focus:ring-accent/10"
            />
          ) : (
            <input
              ref={firstField}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="bg-field w-full rounded-xl px-4 py-3 text-center text-[20px] tracking-[0.3em] outline-none focus:ring-4 focus:ring-accent/10"
            />
          )}

          {error && <p className="text-[13px] text-accent">{error}</p>}

          <button
            type="button"
            onClick={step === "email" ? sendCode : verify}
            disabled={busy}
            className="w-full rounded-xl bg-accent px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : step === "email"
                ? "Email me a code"
                : "Verify & sign in"}
          </button>

          {step === "code" && (
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="w-full text-[13px] text-secondary transition-colors hover:text-accent"
            >
              Use a different email
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function AuthMenu() {
  const { supabase, user, enabled, ready } = useAuth();
  const [open, setOpen] = useState(false);

  // Auth not configured → render nothing (guest-only build).
  if (!enabled) return null;
  if (!ready) return null;

  if (user) {
    const label = user.email ?? "Account";
    return (
      <button
        type="button"
        onClick={() => supabase?.auth.signOut()}
        title={`Signed in as ${label} — sign out`}
        className="max-w-[9rem] truncate text-[13px] font-medium text-secondary transition-colors hover:text-accent sm:text-[14px]"
      >
        Sign out
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13px] font-medium text-secondary transition-colors hover:text-accent sm:text-[14px]"
      >
        Sign in
      </button>
      {open && <AuthDialog onClose={() => setOpen(false)} />}
    </>
  );
}
