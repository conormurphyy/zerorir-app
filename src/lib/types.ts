export type Role = "coach" | "client";

export type SessionUser = {
  role: Role;
  email: string;
  name: string;
};

export type Account = SessionUser & {
  pin: string;
  createdAt: number;
};

export type NewAccount = {
  role: Role;
  email: string;
  name: string;
  pin: string;
};

export type ProgramExercise = {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number;
  targetRpe?: number;
};

export type ProgramDay = {
  id: string;
  dayIndex: number;
  name: string;
  exercises: ProgramExercise[];
};

export type TrainingBlock = {
  id: string;
  name: string;
  durationWeeks: number;
  focusType: "hypertrophy" | "strength" | "peaking";
};

export type Program = {
  id: string;
  name: string;
  description: string;
  isTemplate: boolean;
  blocks: TrainingBlock[];
  days: ProgramDay[];
  updatedAt: number;
};

export type Assignment = {
  programId: string | null;
  updatedAt: number;
};

export type WorkoutLog = {
  id: string;
  exerciseName: string;
  dayName: string;
  reps: number;
  weight: number;
  note: string;
  estimatedOneRm: number | null;
  isPr: boolean;
  programId: string | null;
  createdAt: number;
};
