"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/components/AppProviders";

export default function AuthPage() {
  const { login, user } = useAppSession();
  const [form, setForm] = useState({ email: "", pin: "" });
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"idle" | "error" | "success">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/app");
    }
  }, [router, user]);

  async function submit() {
    setStatus("");
    setStatusKind("idle");
    setIsSubmitting(true);

    const nextEmail = form.email.trim();
    const nextPin = form.pin.trim();

    if (!nextEmail || !nextPin) {
      setStatus("Enter both email and PIN.");
      setStatusKind("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const ok = await login({ email: nextEmail, pin: nextPin });
      if (!ok) {
        setStatus("Invalid login. Check your email and PIN.");
        setStatusKind("error");
        return;
      }

      setStatusKind("success");
      setStatus("Success. Opening app...");
      router.push("/app");
    } catch {
      setStatus("Could not sign in right now. Please try again.");
      setStatusKind("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <section className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">ZeroRIR</p>
        <h1 className="mt-1 text-3xl font-bold">Coach + Client Sync</h1>
        <p className="mt-1 text-sm text-zinc-400">Realtime Firestore sync, offline-first usage, zero custom backend.</p>

        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
          />
          <input
            className="input"
            type="password"
            placeholder="PIN"
            value={form.pin}
            onChange={(e) => setForm((current) => ({ ...current, pin: e.target.value }))}
          />

          <button type="submit" className="btn-primary mt-2 w-full cursor-pointer text-lg disabled:opacity-70" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Enter App"}
          </button>
        </form>

        <p className={`mt-3 text-sm ${statusKind === "error" ? "text-red-400" : "text-lime-300"}`}>{status}</p>
        <Link href="/create-account" className="mt-3 inline-flex text-sm text-cyan-300 underline underline-offset-4">
          Need an account? Create one
        </Link>
      </section>
    </main>
  );
}
