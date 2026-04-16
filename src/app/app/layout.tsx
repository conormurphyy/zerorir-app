"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { BarChart3, ClipboardList, Home } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useAppSession } from "@/components/AppProviders";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAppSession();

  if (loading) {
    return <div className="p-6 text-zinc-400">Loading...</div>;
  }

  if (!user) {
    router.replace("/");
    return null;
  }

  const coachDesktopNav = [
    { href: "/app", label: "Dashboard", icon: Home },
    { href: "/app/programs", label: "Programs", icon: ClipboardList },
    { href: "/app/progress", label: "Progress", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col pb-20 md:pb-6">
      <InstallPrompt />
      <header className="sticky top-0 z-30 border-b border-slate-700/70 bg-slate-950/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">ZeroRIR</p>
            <h1 className="text-lg font-semibold text-slate-100">{user.role === "coach" ? "Coach Console" : "Client Training"}</h1>
          </div>
          <button
            className="rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 transition hover:border-slate-400"
            onClick={() => {
              logout();
              router.replace("/");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {user.role === "coach" ? (
        <div className="mx-auto flex w-full flex-1 gap-4 px-4 py-4">
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="panel sticky top-24 p-3">
              <p className="px-2 pb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <nav className="space-y-1">
                {coachDesktopNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                        active
                          ? "bg-cyan-300 text-slate-950 shadow-[0_8px_18px_rgba(34,211,238,0.35)]"
                          : "text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">{children}</main>
      )}

      <BottomNav role={user.role} />
    </div>
  );
}
