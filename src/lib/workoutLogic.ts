import type { Program, WorkoutLog } from "@/lib/types";

const ONE_RM_EXERCISES = new Set(["Squat", "Bench Press", "Deadlift"]);

export function calcEpleyOneRm(weight: number, reps: number) {
  return Math.round(weight * (1 + reps / 30));
}

export function maybeEstimateOneRm(exerciseName: string, weight: number, reps: number) {
  if (!ONE_RM_EXERCISES.has(exerciseName)) return null;
  return calcEpleyOneRm(weight, reps);
}

export function detectPr(logs: WorkoutLog[], exerciseName: string, nextOneRm: number | null) {
  if (!nextOneRm) return false;
  const best = logs
    .filter((log) => log.exerciseName === exerciseName && typeof log.estimatedOneRm === "number")
    .reduce((current, log) => Math.max(current, log.estimatedOneRm || 0), 0);
  return nextOneRm > best;
}

export function suggestNextWeight(weight: number, reps: number) {
  if (reps >= 10) return Math.round((weight + 2.5) * 10) / 10;
  if (reps >= 6) return Math.round((weight + 1.25) * 10) / 10;
  return Math.round((weight + 0.5) * 10) / 10;
}

const id = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function premadePrograms(): Program[] {
  return [
    {
      id: id(),
      name: "Bodybuilding Split",
      description: "Push/Pull/Legs hypertrophy template",
      isTemplate: true,
      updatedAt: Date.now(),
      blocks: [
        { id: id(), name: "Volume", durationWeeks: 4, focusType: "hypertrophy" },
        { id: id(), name: "Intensification", durationWeeks: 4, focusType: "strength" },
      ],
      days: [
        {
          id: id(),
          dayIndex: 1,
          name: "Push",
          exercises: [
            { id: id(), exerciseName: "Bench Press", sets: 4, reps: 8, targetRpe: 8 },
            { id: id(), exerciseName: "Overhead Press", sets: 3, reps: 10, targetRpe: 8 },
            { id: id(), exerciseName: "Lateral Raise", sets: 3, reps: 15, targetRpe: 9 },
          ],
        },
        {
          id: id(),
          dayIndex: 3,
          name: "Pull",
          exercises: [
            { id: id(), exerciseName: "Barbell Row", sets: 4, reps: 8, targetRpe: 8 },
            { id: id(), exerciseName: "Pull-Up", sets: 4, reps: 8, targetRpe: 8 },
          ],
        },
        {
          id: id(),
          dayIndex: 5,
          name: "Legs",
          exercises: [
            { id: id(), exerciseName: "Squat", sets: 4, reps: 6, targetRpe: 8 },
            { id: id(), exerciseName: "Romanian Deadlift", sets: 3, reps: 8, targetRpe: 8 },
          ],
        },
      ],
    },
    {
      id: id(),
      name: "Powerlifting SBD",
      description: "SBD-focused strength template",
      isTemplate: true,
      updatedAt: Date.now(),
      blocks: [
        { id: id(), name: "Strength Build", durationWeeks: 6, focusType: "strength" },
        { id: id(), name: "Peak", durationWeeks: 2, focusType: "peaking" },
      ],
      days: [
        {
          id: id(),
          dayIndex: 1,
          name: "Squat + Bench",
          exercises: [
            { id: id(), exerciseName: "Squat", sets: 5, reps: 5, targetRpe: 8 },
            { id: id(), exerciseName: "Bench Press", sets: 5, reps: 5, targetRpe: 8 },
          ],
        },
        {
          id: id(),
          dayIndex: 3,
          name: "Deadlift + Bench",
          exercises: [
            { id: id(), exerciseName: "Deadlift", sets: 4, reps: 4, targetRpe: 8 },
            { id: id(), exerciseName: "Bench Press", sets: 4, reps: 6, targetRpe: 8 },
          ],
        },
        {
          id: id(),
          dayIndex: 5,
          name: "Squat + Deadlift",
          exercises: [
            { id: id(), exerciseName: "Squat", sets: 3, reps: 3, targetRpe: 8.5 },
            { id: id(), exerciseName: "Deadlift", sets: 3, reps: 3, targetRpe: 8.5 },
          ],
        },
      ],
    },
  ];
}

export const EXERCISE_LIBRARY = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Romanian Deadlift",
  "Pull-Up",
  "Lat Pulldown",
  "Dumbbell Press",
  "Lunge",
  "Leg Press",
  "Leg Curl",
  "Bicep Curl",
  "Tricep Pushdown",
];
