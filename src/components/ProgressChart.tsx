"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  date: string;
  exerciseName: string;
  oneRm: number;
};

type Props = {
  data: Point[];
};

export function ProgressChart({ data }: Props) {
  return (
    <div className="panel h-64 w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="oneRm" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
