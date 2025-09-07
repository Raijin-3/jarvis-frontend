"use client";

import { useEffect, useState } from "react";

function format(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
}

export function TodayCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(now);
      // End of today (local time)
      end.setHours(23, 59, 59, 999);
      setLeft(Math.max(0, end.getTime() - now.getTime()));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  if (left <= 0) {
    return <span className="text-xs font-medium text-red-600">Time's up!</span>;
  }
  return (
    <span className="text-xs text-muted-foreground">Time left: {format(left)}</span>
  );
}

