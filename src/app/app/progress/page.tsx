"use client";

import { useMemo } from "react";
import { ProgressChart } from "@/components/ProgressChart";
import { useAppSession } from "@/components/AppProviders";
import { useRealtimeData } from "@/hooks/useRealtimeData";

export default function ProgressPage() {
  const { user } = useAppSession();
  const { logs } = useRealtimeData();

  const chartData = useMemo(
    () =>
      logs
        .filter((log) => log.estimatedOneRm)
        .map((log) => ({
          date: new Date(log.createdAt).toISOString().slice(0, 10),
          exerciseName: log.exerciseName,
          oneRm: log.estimatedOneRm || 0,
        }))
        .reverse(),
    [logs]
  );

  const prs = useMemo(() => logs.filter((log) => log.isPr).slice(0, 20), [logs]);

  if (!user) return null;

  return (
    <div className="space-y-4 pb-16">
      <section className="panel p-4">
        <h2 className="text-xl font-semibold">Progress</h2>
        <p className="text-sm text-slate-300">
          {user.role === "coach" ? "Live client progression feed" : "Your strength progression"}
        </p>
      </section>

      <ProgressChart data={chartData} />

      <section className="panel space-y-2 p-4">
        <h3 className="text-lg font-semibold">Personal Records</h3>
        {prs.length === 0 ? <p className="text-sm text-slate-400">No PRs logged yet.</p> : null}
        {prs.map((pr) => (
          <div key={pr.id} className="rounded-xl border border-cyan-300/30 bg-slate-900/70 p-3">
            <p className="font-semibold text-cyan-200">{pr.exerciseName}</p>
            <p className="text-sm text-slate-200">
              {pr.weight}kg x {pr.reps}
              {pr.estimatedOneRm ? ` (1RM ${pr.estimatedOneRm}kg)` : ""}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
