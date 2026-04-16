"use client";

import { useMemo, useState } from "react";
import { useAppSession } from "@/components/AppProviders";
import { assignProgram, deleteProgram, saveProgram } from "@/lib/firestoreRepo";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { EXERCISE_LIBRARY } from "@/lib/workoutLogic";
import type { Program, ProgramDay, ProgramExercise } from "@/lib/types";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createExercise(name = "Exercise"): ProgramExercise {
  return {
    id: createId("ex"),
    exerciseName: name,
    sets: 3,
    reps: 8,
    targetRpe: 8,
  };
}

function createDay(index: number): ProgramDay {
  return {
    id: createId("day"),
    dayIndex: index,
    name: `Day ${index}`,
    exercises: [createExercise("Bench Press")],
  };
}

function createBlankProgram(): Program {
  const baseId = createId("program");
  return {
    id: baseId,
    name: "New Program",
    description: "",
    isTemplate: false,
    updatedAt: Date.now(),
    blocks: [{ id: createId("block"), name: "Main Block", durationWeeks: 4, focusType: "strength" }],
    days: [
      {
        id: createId("day"),
        dayIndex: 1,
        name: "Day 1",
        exercises: [createExercise("Squat")],
      },
    ],
  };
}

export default function ProgramsPage() {
  const { user } = useAppSession();
  const { programs, assignment, accounts } = useRealtimeData();
  const [selectedId, setSelectedId] = useState<string>("");
  const [status, setStatus] = useState("");

  const clients = useMemo(
    () => accounts.filter((account) => account.role === "client"),
    [accounts]
  );

  const selected = useMemo(
    () => programs.find((program) => program.id === selectedId) || null,
    [programs, selectedId]
  );

  if (!user || user.role !== "coach") {
    return <p className="text-zinc-400">Coach access only.</p>;
  }

  async function persist(program: Program) {
    await saveProgram(program);
    setStatus("Program saved.");
  }

  function updateDay(selectedProgram: Program, dayIndex: number, nextDay: ProgramDay) {
    const nextDays = [...selectedProgram.days];
    nextDays[dayIndex] = nextDay;
    void persist({ ...selectedProgram, days: nextDays });
  }

  async function createProgram() {
    const blank = createBlankProgram();
    await saveProgram(blank);
    setSelectedId(blank.id);
    setStatus("New program created.");
  }

  async function removeSelectedProgram() {
    if (!selected) return;

    await deleteProgram(selected.id);
    if (assignment.programId === selected.id) {
      await assignProgram(null);
    }

    setSelectedId("");
    setStatus("Program deleted.");
  }

  return (
    <div className="pb-16 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-4 lg:pb-8">
      <section className="panel p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Coach Studio</p>
            <h2 className="text-2xl font-semibold">Program Builder</h2>
          </div>
          <button className="btn-primary touch-target" onClick={() => void createProgram()}>
            + New Program
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {programs.map((program) => (
            <button
              key={program.id}
              className={`rounded-xl border p-3 text-left ${
                selectedId === program.id ? "border-cyan-300 bg-slate-800" : "border-slate-700 bg-slate-900/70"
              }`}
              onClick={() => setSelectedId(program.id)}
            >
              <p className="font-semibold">{program.name}</p>
              <p className="text-xs text-slate-300">{program.description || "No description"}</p>
              <p className="mt-2 inline-flex pill">{program.isTemplate ? "Template" : "Custom"}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 space-y-4 lg:mt-0">
        <section className="panel p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Clients</p>
              <h3 className="text-lg font-semibold">Client Program Roster</h3>
            </div>
            <span className="pill">{clients.length} client{clients.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-2 space-y-2">
            {clients.map((client) => (
              <div key={client.email} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <p className="font-semibold">{client.name}</p>
                <p className="text-xs text-slate-400">{client.email}</p>
                <p className="mt-1 text-sm text-cyan-200">Program: {assignment.programId ? (programs.find((item) => item.id === assignment.programId)?.name || "Unknown") : "Not assigned"}</p>
              </div>
            ))}
            {clients.length === 0 ? <p className="text-sm text-slate-400">No client accounts created yet.</p> : null}
          </div>
        </section>

        {selected ? (
          <section className="panel space-y-3 p-4">
          <datalist id="exercise-library">
            {EXERCISE_LIBRARY.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          <input
            className="input"
            value={selected.name}
            placeholder="Program name"
            onChange={(event) =>
              void persist({
                ...selected,
                name: event.target.value,
              })
            }
          />
          <input
            className="input"
            value={selected.description}
            placeholder="Description"
            onChange={(event) =>
              void persist({
                ...selected,
                description: event.target.value,
              })
            }
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button className="btn-primary touch-target" onClick={() => void assignProgram(selected.id)}>
              {assignment.programId === selected.id ? "Assigned to Client" : "Assign to Client"}
            </button>
            <button className="btn-secondary touch-target border-red-400/40 text-red-200 hover:border-red-300" onClick={() => void removeSelectedProgram()}>
              Delete Program
            </button>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Blocks</p>
            {selected.blocks.map((block, index) => (
              <div key={block.id} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  className="input"
                  value={block.name}
                  onChange={(event) => {
                    const next = [...selected.blocks];
                    next[index] = { ...block, name: event.target.value };
                    void persist({ ...selected, blocks: next });
                  }}
                />
                <input
                  className="input"
                  type="number"
                  value={block.durationWeeks}
                  min={1}
                  max={24}
                  onChange={(event) => {
                    const next = [...selected.blocks];
                    next[index] = { ...block, durationWeeks: Number(event.target.value || 1) };
                    void persist({ ...selected, blocks: next });
                  }}
                />
                <select
                  className="input"
                  value={block.focusType}
                  onChange={(event) => {
                    const next = [...selected.blocks];
                    next[index] = {
                      ...block,
                      focusType: event.target.value as "hypertrophy" | "strength" | "peaking",
                    };
                    void persist({ ...selected, blocks: next });
                  }}
                >
                  <option value="hypertrophy">Hypertrophy</option>
                  <option value="strength">Strength</option>
                  <option value="peaking">Peaking</option>
                </select>
              </div>
            ))}
          </div>

          {selected.days.map((day, dayIndex) => (
            <div key={day.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
              <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  className="input"
                  value={day.name}
                  onChange={(event) => {
                    updateDay(selected, dayIndex, { ...day, name: event.target.value });
                  }}
                />
                <input
                  className="input"
                  type="number"
                  value={day.dayIndex}
                  min={1}
                  max={7}
                  onChange={(event) => {
                    updateDay(selected, dayIndex, { ...day, dayIndex: Number(event.target.value || 1) });
                  }}
                />
              </div>

              <div className="mb-2 hidden grid-cols-12 gap-2 px-1 text-[11px] uppercase tracking-[0.12em] text-slate-400 lg:grid">
                <p className="col-span-5">Exercise</p>
                <p className="col-span-2">Sets</p>
                <p className="col-span-2">Reps</p>
                <p className="col-span-2">RPE</p>
                <p className="col-span-1">Action</p>
              </div>

              {day.exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="mb-2 grid grid-cols-12 gap-2">
                  <input
                    className="input col-span-12 lg:col-span-5"
                    list="exercise-library"
                    value={exercise.exerciseName}
                    placeholder="Exercise name"
                    onChange={(event) => {
                      const nextExercises = [...day.exercises];
                      nextExercises[exerciseIndex] = {
                        ...exercise,
                        exerciseName: event.target.value,
                      };
                      updateDay(selected, dayIndex, { ...day, exercises: nextExercises });
                    }}
                  />
                  <input
                    className="input col-span-4 lg:col-span-2"
                    type="number"
                    min={1}
                    value={exercise.sets}
                    placeholder="Sets"
                    onChange={(event) => {
                      const nextExercises = [...day.exercises];
                      nextExercises[exerciseIndex] = {
                        ...exercise,
                        sets: Number(event.target.value || 1),
                      };
                      updateDay(selected, dayIndex, { ...day, exercises: nextExercises });
                    }}
                  />
                  <input
                    className="input col-span-4 lg:col-span-2"
                    type="number"
                    min={1}
                    value={exercise.reps}
                    placeholder="Reps"
                    onChange={(event) => {
                      const nextExercises = [...day.exercises];
                      nextExercises[exerciseIndex] = {
                        ...exercise,
                        reps: Number(event.target.value || 1),
                      };
                      updateDay(selected, dayIndex, { ...day, exercises: nextExercises });
                    }}
                  />
                  <input
                    className="input col-span-4 lg:col-span-2"
                    type="number"
                    min={5}
                    max={10}
                    step={0.5}
                    value={exercise.targetRpe || ""}
                    placeholder="RPE"
                    onChange={(event) => {
                      const nextExercises = [...day.exercises];
                      const nextValue = Number(event.target.value || 0);
                      nextExercises[exerciseIndex] = {
                        ...exercise,
                        targetRpe: nextValue > 0 ? nextValue : undefined,
                      };
                      updateDay(selected, dayIndex, { ...day, exercises: nextExercises });
                    }}
                  />
                  <button
                    className="btn-secondary col-span-12 touch-target lg:col-span-1"
                    onClick={() => {
                      const nextExercises = day.exercises.filter((item) => item.id !== exercise.id);
                      updateDay(selected, dayIndex, {
                        ...day,
                        exercises: nextExercises.length ? nextExercises : [createExercise("Exercise")],
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                className="btn-secondary mt-2 touch-target"
                onClick={() => {
                  updateDay(selected, dayIndex, {
                    ...day,
                    exercises: [...day.exercises, createExercise("Exercise")],
                  });
                }}
              >
                + Add Exercise
              </button>
            </div>
          ))}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              className="btn-secondary touch-target"
              onClick={() =>
                void persist({
                  ...selected,
                  days: [...selected.days, createDay(selected.days.length + 1)],
                })
              }
            >
              + Add Day
            </button>
            <div className="pill flex items-center justify-center">Number fields are Sets, Reps, and RPE</div>
          </div>
          </section>
        ) : null}

        {status ? <p className="text-sm text-cyan-300">{status}</p> : null}
      </div>
    </div>
  );
}
