"use client";

import { useEffect, useMemo, useState } from "react";
import {
  subscribeAccounts,
  subscribeAssignment,
  subscribeLogs,
  subscribePrograms,
} from "@/lib/firestoreRepo";
import type { Assignment, Program, SessionUser, WorkoutLog } from "@/lib/types";

export function useRealtimeData() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [assignment, setAssignment] = useState<Assignment>({ programId: null, updatedAt: 0 });
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [accounts, setAccounts] = useState<SessionUser[]>([]);

  useEffect(() => {
    const unsubPrograms = subscribePrograms(setPrograms);
    const unsubAssignment = subscribeAssignment(setAssignment);
    const unsubLogs = subscribeLogs(setLogs);
    const unsubAccounts = subscribeAccounts(setAccounts);

    return () => {
      unsubPrograms();
      unsubAssignment();
      unsubLogs();
      unsubAccounts();
    };
  }, []);

  const assignedProgram = useMemo(
    () => programs.find((program) => program.id === assignment.programId) || null,
    [assignment.programId, programs]
  );

  return {
    programs,
    logs,
    accounts,
    assignment,
    assignedProgram,
  };
}
