"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event || hidden) return null;

  return (
    <button
      className="fixed right-4 top-4 z-50 rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-zinc-950"
      onClick={async () => {
        await event.prompt();
        const choice = await event.userChoice;
        if (choice.outcome === "accepted") {
          setHidden(true);
        }
      }}
    >
      Install App
    </button>
  );
}
