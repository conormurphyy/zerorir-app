"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { setDoc, doc } from "firebase/firestore";
import { useAppSession } from "@/components/AppProviders";
import { db } from "@/lib/firebase";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import type { Program, WorkoutLog } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAppSession();
  const { assignedProgram, assignment, programs, logs } = useRealtimeData();
  const [status, setStatus] = useState("");

  const todayLogCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return logs.filter((log) => new Date(log.createdAt).toISOString().slice(0, 10) === today).length;
  }, [logs]);

  if (!user) return null;

  async function exportData() {
    const payload = {
      programs,
      assignment,
      logs,
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zerorir-backup-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Backup exported.");
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        programs?: Program[];
        assignment?: { programId: string | null; updatedAt: number };
        logs?: WorkoutLog[];
      };

      for (const program of data.programs || []) {
        await setDoc(doc(db, "programs", program.id), program);
      }

      if (data.assignment) {
        await setDoc(doc(db, "appMeta", "assignment"), data.assignment, { merge: true });
      }

      for (const log of data.logs || []) {
        await setDoc(doc(db, "workoutLogs", log.id), log, { merge: true });
      }

      setStatus("Backup imported.");
    } catch {
      setStatus("Import failed. Invalid JSON file.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
        <h2 className="text-2xl font-bold capitalize">{user.role}</h2>
        <p className="text-sm text-slate-300">Realtime Firestore syncing is active when online. Offline edits are queued.</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="panel p-4">
          <p className="text-xs text-slate-400">Assigned Program</p>
          <p className="mt-1 text-lg font-semibold">{assignedProgram?.name || "Not assigned"}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-slate-400">Sets Logged Today</p>
          <p className="mt-1 text-lg font-semibold">{todayLogCount}</p>
        </div>
      </section>

      {user.role === "coach" ? (
        <section className="panel space-y-3 p-4">
          <h3 className="text-lg font-semibold">Coach Quick Actions</h3>
          <Link className="btn-primary block text-center" href="/app/programs">
            Edit Programs + Assign
          </Link>
          <Link className="btn-secondary block text-center" href="/app/progress">
            View Client Progress
          </Link>
        </section>
      ) : (
        <section className="panel space-y-3 p-4">
          <h3 className="text-lg font-semibold">Client Quick Actions</h3>
          <Link className="btn-primary block text-center text-lg" href="/app/workout">
            Start Workout
          </Link>
          <Link className="btn-secondary block text-center" href="/app/history">
            View History
          </Link>
        </section>
      )}

      <section className="panel p-4">
        <h3 className="text-lg font-semibold">Backup</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button className="btn-secondary" onClick={() => void exportData()}>
            Export JSON
          </button>
          <label className="btn-secondary flex cursor-pointer items-center justify-center">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importData(file);
                }
              }}
            />
          </label>
        </div>
        {status ? <p className="mt-2 text-sm text-cyan-300">{status}</p> : null}
      </section>

      <section className="panel p-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="mt-3 space-y-2">
          {logs.slice(0, 8).map((log) => (
            <div key={log.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm">
              <p className="font-semibold">{log.exerciseName}</p>
              <p className="text-slate-300">
                {log.weight}kg x {log.reps} reps
              </p>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-sm text-slate-400">No logs yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
