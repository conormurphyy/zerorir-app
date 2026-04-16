"use client";

import { useEffect, useState } from "react";

export function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">Rest Timer</p>
      <p className="mt-1 text-3xl font-bold text-lime-300">{secondsLeft}s</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[60, 90, 120].map((seconds) => (
          <button
            key={seconds}
            className="rounded-xl bg-zinc-800 px-3 py-2 text-sm"
            onClick={() => setSecondsLeft(seconds)}
          >
            {seconds}s
          </button>
        ))}
      </div>
    </div>
  );
}
