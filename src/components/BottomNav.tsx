"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Home, ListChecks, Dumbbell } from "lucide-react";
import clsx from "clsx";

type Props = {
  role: "coach" | "client";
};

export function BottomNav({ role }: Props) {
  const pathname = usePathname();

  const items =
    role === "coach"
      ? [
          { href: "/app", label: "Home", icon: Home },
          { href: "/app/programs", label: "Programs", icon: ClipboardList },
          { href: "/app/progress", label: "Progress", icon: BarChart3 },
        ]
      : [
          { href: "/app", label: "Home", icon: Home },
          { href: "/app/workout", label: "Workout", icon: Dumbbell },
          { href: "/app/progress", label: "Progress", icon: BarChart3 },
          { href: "/app/history", label: "History", icon: ListChecks },
        ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-700/70 bg-slate-950/90 px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex min-h-14 min-w-16 flex-col items-center justify-center rounded-xl px-3 py-2 text-xs transition",
                active
                  ? "bg-cyan-400 text-slate-950 shadow-[0_6px_18px_rgba(34,211,238,0.35)]"
                  : "text-slate-300 hover:bg-slate-800/80"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
