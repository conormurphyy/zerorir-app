"use client";

import { useMemo, useState } from "react";
import { useAppSession } from "@/components/AppProviders";
import { useRealtimeData } from "@/hooks/useRealtimeData";

function startOfWeekKey(timestamp: number) {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function toReadableWeek(weekKey: string) {
  const start = new Date(`${weekKey}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function getWeekNumberByKey(orderedWeekKeysAsc: string[], targetWeekKey: string) {
  const index = orderedWeekKeysAsc.findIndex((key) => key === targetWeekKey);
  return index >= 0 ? index + 1 : 0;
}

export default function HistoryPage() {
  const { user } = useAppSession();
  const { logs } = useRealtimeData();
  const [weekIndex, setWeekIndex] = useState(0);

  const weekKeys = useMemo(() => {
    const keys = Array.from(new Set(logs.map((log) => startOfWeekKey(log.createdAt))));
    return keys.sort((a, b) => b.localeCompare(a));
  }, [logs]);

  const weekKeysAsc = useMemo(() => [...weekKeys].reverse(), [weekKeys]);

  const safeWeekIndex = Math.min(weekIndex, Math.max(weekKeys.length - 1, 0));
  const selectedWeek = weekKeys[safeWeekIndex] || null;

  const weeklyLogs = useMemo(() => {
    if (!selectedWeek) return [];
    return logs.filter((log) => startOfWeekKey(log.createdAt) === selectedWeek);
  }, [logs, selectedWeek]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, typeof weeklyLogs>();
    for (const log of weeklyLogs) {
      const label = new Date(log.createdAt).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      const current = map.get(label) || [];
      current.push(log);
      map.set(label, current);
    }
    return Array.from(map.entries());
  }, [weeklyLogs]);

  const dayNames = useMemo(() => {
    const names = Array.from(new Set(logs.map((log) => log.dayName))).filter(Boolean);
    return names.sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const [selectedDayName, setSelectedDayName] = useState("");

  const activeDayName =
    dayNames.find((name) => name === selectedDayName) ||
    dayNames[0] ||
    "";

  const weekToWeekByDay = useMemo(() => {
    if (!activeDayName) return [] as Array<{
      weekKey: string;
      weekNumber: number;
      logs: typeof logs;
    }>;

    return weekKeysAsc
      .map((weekKey) => {
        const items = logs.filter(
          (log) => startOfWeekKey(log.createdAt) === weekKey && log.dayName === activeDayName
        );
        return {
          weekKey,
          weekNumber: getWeekNumberByKey(weekKeysAsc, weekKey),
          logs: items,
        };
      })
      .filter((entry) => entry.logs.length > 0);
  }, [activeDayName, logs, weekKeysAsc]);

  if (!user || user.role !== "client") return <p className="text-zinc-400">Client access only.</p>;

  return (
    <div className="space-y-4 pb-16">
      <section className="panel p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Timeline</p>
        <h2 className="text-2xl font-semibold">Workout History</h2>
        <p className="text-sm text-slate-300">Move week by week to review every session quickly.</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button className="btn-secondary" onClick={() => setWeekIndex((current) => Math.min(current + 1, weekKeys.length - 1))} disabled={safeWeekIndex >= weekKeys.length - 1}>
            Older Week
          </button>
          <p className="text-center text-sm text-slate-200">{selectedWeek ? toReadableWeek(selectedWeek) : "No history yet"}</p>
          <button className="btn-secondary" onClick={() => setWeekIndex((current) => Math.max(current - 1, 0))} disabled={safeWeekIndex <= 0}>
            Newer Week
          </button>
        </div>
      </section>

      {groupedByDay.map(([dayLabel, dayLogs]) => (
        <section key={dayLabel} className="panel p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-cyan-200">{dayLabel}</h3>
            <span className="pill">{dayLogs.length} sets</span>
          </div>

          <div className="space-y-2">
            {dayLogs.map((log) => (
              <article key={log.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{log.exerciseName}</p>
                  <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <p className="text-sm text-slate-200">{log.weight}kg x {log.reps}</p>
                {log.note ? <p className="mt-1 text-sm text-slate-300">{log.note}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="panel p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Week To Week</p>
        <h3 className="text-xl font-semibold">Compare By Program Day</h3>
        <p className="text-sm text-slate-300">See progression as Week 1, Day 1 then Week 2, Day 1 and so on.</p>

        {dayNames.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {dayNames.map((name) => {
              const active = name === activeDayName;
              return (
                <button
                  key={name}
                  className={`touch-target shrink-0 rounded-xl border px-3 py-2 text-sm ${
                    active
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : "border-slate-600 bg-slate-900 text-slate-200"
                  }`}
                  onClick={() => setSelectedDayName(name)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          {weekToWeekByDay.map((entry) => (
            <article key={`${entry.weekKey}-${activeDayName}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-semibold text-cyan-200">Week {entry.weekNumber} - {activeDayName}</p>
                <span className="pill">{entry.logs.length} sets</span>
              </div>
              <p className="text-xs text-slate-400">{toReadableWeek(entry.weekKey)}</p>
              <div className="mt-2 space-y-1">
                {entry.logs.map((log) => (
                  <p key={log.id} className="text-sm text-slate-200">
                    {log.exerciseName}: {log.weight}kg x {log.reps}
                  </p>
                ))}
              </div>
            </article>
          ))}
          {dayNames.length > 0 && weekToWeekByDay.length === 0 ? (
            <p className="text-sm text-slate-400">No week-to-week entries yet for {activeDayName}.</p>
          ) : null}
        </div>
      </section>

      {logs.length === 0 ? <p className="text-sm text-slate-400">No workouts logged yet.</p> : null}
      {logs.length > 0 && weeklyLogs.length === 0 ? <p className="text-sm text-slate-400">No workouts in this week.</p> : null}
    </div>
  );
}
