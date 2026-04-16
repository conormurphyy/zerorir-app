"use client";

import { useEffect, useState } from "react";
import { RestTimer } from "@/components/RestTimer";
import { useAppSession } from "@/components/AppProviders";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { addWorkoutLog, deleteWorkoutLog, updateWorkoutLog } from "@/lib/firestoreRepo";
import { detectPr, maybeEstimateOneRm } from "@/lib/workoutLogic";

function todayDayIndex() {
  const weekday = new Date().getDay();
  return weekday === 0 ? 7 : weekday;
}

function getLastWeekLog(logs: ReturnType<typeof useRealtimeData>["logs"], exerciseName: string) {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const start = now - 14 * 24 * 60 * 60 * 1000;
  const end = now - sevenDays;

  return logs.find(
    (log) =>
      log.exerciseName === exerciseName &&
      log.createdAt >= start &&
      log.createdAt < end
  );
}

function startOfLocalDayMs(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export default function WorkoutPage() {
  const { user } = useAppSession();
  const { assignedProgram, logs, assignment } = useRealtimeData();
  const [quick, setQuick] = useState<Record<string, { weight: number; reps: number; note: string }>>({});
  const [editingLogByExercise, setEditingLogByExercise] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState("");
  const [selectedDayId, setSelectedDayId] = useState("");
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!user || user.role !== "client") return <p className="text-slate-400">Client access only.</p>;
  if (!assignedProgram) return <p className="text-slate-400">No assigned program.</p>;

  const day =
    assignedProgram.days.find((item) => item.id === selectedDayId) ||
    assignedProgram.days.find((item) => item.dayIndex === todayDayIndex()) ||
    assignedProgram.days[0];
  const programId = assignedProgram.id;
  const todayStart = startOfLocalDayMs(nowTs);

  const totalProgramWeeks = Math.max(
    1,
    assignedProgram.blocks.reduce((sum, block) => sum + block.durationWeeks, 0) || 1
  );

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekFromAssignment = assignment.updatedAt
    ? Math.floor((nowTs - assignment.updatedAt) / msPerWeek) + 1
    : 1;
  const currentWeek = Math.max(1, Math.min(weekFromAssignment, totalProgramWeeks));

  async function saveSet(exerciseName: string, dayName: string) {
    const current = quick[exerciseName] || { weight: 0, reps: 0, note: "" };
    if (!current.weight || !current.reps) {
      setStatus("Enter weight and reps first.");
      return;
    }

    const estimatedOneRm = maybeEstimateOneRm(exerciseName, current.weight, current.reps);
    const editingLogId = editingLogByExercise[exerciseName] || null;
    const comparisonLogs = editingLogId ? logs.filter((log) => log.id !== editingLogId) : logs;
    const isPr = detectPr(comparisonLogs, exerciseName, estimatedOneRm);

    if (editingLogId) {
      await updateWorkoutLog(editingLogId, {
        reps: current.reps,
        weight: current.weight,
        note: current.note,
        estimatedOneRm,
        isPr,
      });

      setEditingLogByExercise((state) => ({
        ...state,
        [exerciseName]: null,
      }));

      setStatus(`${exerciseName}: Set updated`);
      return;
    }

    await addWorkoutLog({
      exerciseName,
      dayName,
      reps: current.reps,
      weight: current.weight,
      note: current.note,
      estimatedOneRm,
      isPr,
      programId,
    });

    setQuick((state) => ({
      ...state,
      [exerciseName]: { weight: 0, reps: current.reps, note: "" },
    }));

    setStatus(isPr ? `${exerciseName}: PR detected` : `${exerciseName}: Set saved`);
  }

  async function removeSet(logId: string, exerciseName: string) {
    const confirmed = window.confirm(`Delete this ${exerciseName} set? This cannot be undone.`);
    if (!confirmed) return;

    await deleteWorkoutLog(logId);

    setEditingLogByExercise((state) => {
      if (state[exerciseName] !== logId) return state;
      return {
        ...state,
        [exerciseName]: null,
      };
    });

    setStatus(`${exerciseName}: Set deleted`);
  }

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      <section className="panel p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Today&apos;s Session</p>
        <h2 className="text-xl font-semibold">{day.name}</h2>
        <p className="mt-1 text-sm text-cyan-300">Week {currentWeek} of {totalProgramWeeks}</p>
        <p className="text-sm text-slate-300">Fast log mode: tap reps and save each set in seconds.</p>

        {assignedProgram.days.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {assignedProgram.days
              .slice()
              .sort((a, b) => a.dayIndex - b.dayIndex)
              .map((item) => {
                const active = item.id === day.id;
                return (
                  <button
                    key={item.id}
                    className={`touch-target shrink-0 rounded-xl border px-3 py-2 text-sm ${
                      active
                        ? "border-cyan-300 bg-cyan-300 text-slate-950"
                        : "border-slate-600 bg-slate-900 text-slate-200"
                    }`}
                    onClick={() => setSelectedDayId(item.id)}
                  >
                    Day {item.dayIndex}
                  </button>
                );
              })}
          </div>
        ) : null}
      </section>

      {day.exercises.map((exercise) => {
        const item = quick[exercise.exerciseName] || {
          weight: 0,
          reps: exercise.reps,
          note: "",
        };

        const recent = logs.find((log) => log.exerciseName === exercise.exerciseName);
        const lastWeek = getLastWeekLog(logs, exercise.exerciseName);
        const exerciseSets = logs
          .filter(
            (log) =>
              log.programId === programId &&
              log.dayName === day.name &&
              log.exerciseName === exercise.exerciseName &&
              log.createdAt >= todayStart
          )
          .sort((a, b) => a.createdAt - b.createdAt);
        const editingLogId = editingLogByExercise[exercise.exerciseName] || null;

        return (
          <article key={exercise.id} className="panel p-4">
            <h3 className="text-lg font-semibold">{exercise.exerciseName}</h3>
            <p className="text-sm text-slate-300">
              {exercise.sets} sets x {exercise.reps} reps
            </p>
            {typeof exercise.targetRpe === "number" ? (
              <p className="mt-1 text-xs text-cyan-300">Coach target RPE: {exercise.targetRpe}</p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                className="input text-lg"
                type="number"
                inputMode="decimal"
                placeholder="Weight"
                value={item.weight || ""}
                onChange={(event) =>
                  setQuick((state) => ({
                    ...state,
                    [exercise.exerciseName]: {
                      ...item,
                      weight: Number(event.target.value || 0),
                    },
                  }))
                }
              />
              <input
                className="input text-lg"
                type="number"
                inputMode="numeric"
                placeholder="Reps"
                value={item.reps || ""}
                onChange={(event) =>
                  setQuick((state) => ({
                    ...state,
                    [exercise.exerciseName]: {
                      ...item,
                      reps: Number(event.target.value || 0),
                    },
                  }))
                }
              />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[5, 8, 10, 12].map((value) => (
                <button
                  key={value}
                  className="btn-secondary touch-target"
                  onClick={() =>
                    setQuick((state) => ({
                      ...state,
                      [exercise.exerciseName]: { ...item, reps: value },
                    }))
                  }
                >
                  {value} reps
                </button>
              ))}
            </div>

            <input
              className="input mt-2"
              placeholder="Workout note"
              value={item.note}
              onChange={(event) =>
                setQuick((state) => ({
                  ...state,
                  [exercise.exerciseName]: {
                    ...item,
                    note: event.target.value,
                  },
                }))
              }
            />

            <button
              className="btn-primary touch-target mt-3 w-full text-lg"
              onClick={() => void saveSet(exercise.exerciseName, day.name)}
            >
              {editingLogId ? "Update Set" : "Save Set"}
            </button>

            {editingLogId ? (
              <button
                className="btn-secondary touch-target mt-2 w-full"
                onClick={() => {
                  setEditingLogByExercise((state) => ({
                    ...state,
                    [exercise.exerciseName]: null,
                  }));
                  setQuick((state) => ({
                    ...state,
                    [exercise.exerciseName]: {
                      ...item,
                      note: "",
                    },
                  }));
                  setStatus(`${exercise.exerciseName}: edit canceled`);
                }}
              >
                Cancel Edit
              </button>
            ) : null}

            <button
              className="btn-secondary touch-target mt-2 w-full"
              disabled={!lastWeek}
              onClick={() => {
                if (!lastWeek) return;
                setQuick((state) => ({
                  ...state,
                  [exercise.exerciseName]: {
                    weight: lastWeek.weight,
                    reps: lastWeek.reps,
                    note: item.note,
                  },
                }));
                setStatus(`${exercise.exerciseName}: last week loaded`);
              }}
            >
              {lastWeek ? "Use Last Week" : "No Last Week Data"}
            </button>

            {recent ? (
              <p className="mt-2 text-xs text-slate-400">
                Last: {recent.weight}kg x {recent.reps}
              </p>
            ) : null}
            {lastWeek ? (
              <p className="mt-1 text-xs text-slate-400">
                Last week: {lastWeek.weight}kg x {lastWeek.reps}
              </p>
            ) : null}

            <div className="mt-3 space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Today&apos;s Sets</p>
              {exerciseSets.length === 0 ? (
                <p className="text-xs text-slate-500">No sets logged yet.</p>
              ) : (
                exerciseSets.map((setLog, index) => (
                  <div key={setLog.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-cyan-200">Set {index + 1}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(setLog.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-200">{setLog.weight}kg x {setLog.reps}</p>
                    {setLog.note ? <p className="mt-1 text-xs text-slate-300">{setLog.note}</p> : null}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        className="btn-secondary touch-target"
                        onClick={() => {
                          setQuick((state) => ({
                            ...state,
                            [exercise.exerciseName]: {
                              weight: setLog.weight,
                              reps: setLog.reps,
                              note: setLog.note,
                            },
                          }));
                          setEditingLogByExercise((state) => ({
                            ...state,
                            [exercise.exerciseName]: setLog.id,
                          }));
                          setStatus(`${exercise.exerciseName}: editing Set ${index + 1}`);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="touch-target rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200"
                        onClick={() => void removeSet(setLog.id, exercise.exerciseName)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        );
      })}

      <RestTimer />
      {status ? <p className="text-sm text-cyan-300">{status}</p> : null}
    </div>
  );
}
