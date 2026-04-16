"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/components/AppProviders";
import type { Role } from "@/lib/types";

export default function CreateAccountPage() {
  const router = useRouter();
  const { register } = useAppSession();
  const [form, setForm] = useState({
    name: "",
    email: "",
    pin: "",
    role: "client" as Role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"idle" | "error" | "success">("idle");

  async function submit() {
    setStatus("");
    setStatusKind("idle");
    setIsSubmitting(true);

    try {
      const result = await register(form);
      if (!result.ok) {
        setStatus(result.reason || "Could not create account.");
        setStatusKind("error");
        return;
      }

      setStatus("Account created. Opening app...");
      setStatusKind("success");
      router.push("/app");
    } catch {
      setStatus("Could not create account right now. Please try again.");
      setStatusKind("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <section className="panel w-full p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">ZeroRIR</p>
        <h1 className="mt-1 text-3xl font-bold">Create Account</h1>
        <p className="mt-1 text-sm text-slate-300">Register a coach or client account to use the app.</p>

        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            className="input"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <input
            className="input"
            type="password"
            placeholder="PIN / Password"
            value={form.pin}
            onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value }))}
          />
          <select
            className="input"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
          >
            <option value="client">Client</option>
            <option value="coach">Coach</option>
          </select>

          <button type="submit" className="btn-primary mt-2 w-full text-lg disabled:opacity-70" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className={`mt-3 text-sm ${statusKind === "error" ? "text-red-400" : "text-cyan-300"}`}>{status}</p>
        <Link href="/" className="mt-3 inline-flex text-sm text-slate-300 underline underline-offset-4">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
