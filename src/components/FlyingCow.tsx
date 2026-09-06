"use client";

import { useEffect, useState } from "react";

type CowFlight = {
  id: number;
  top: number;
  size: number;
  duration: number;
  fromLeft: boolean;
  wobble: number;
  tilt: number;
};

function randomCow(): CowFlight {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    top: 8 + Math.random() * 72,
    size: 2.4 + Math.random() * 3.2,
    duration: 2.2 + Math.random() * 2.4,
    fromLeft: Math.random() > 0.5,
    wobble: 12 + Math.random() * 28,
    tilt: -18 + Math.random() * 36,
  };
}

export function FlyingCow() {
  const [cows, setCows] = useState<CowFlight[]>([]);

  useEffect(() => {
    let streak = 0;
    let lastAt = 0;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowDown") {
        streak = 0;
        return;
      }
      if (event.repeat) return;

      const now = Date.now();
      streak = now - lastAt < 900 ? streak + 1 : 1;
      lastAt = now;

      if (streak < 3) return;
      streak = 0;
      const cow = randomCow();
      setCows((current) => [...current, cow]);
      window.setTimeout(() => {
        setCows((current) => current.filter((item) => item.id !== cow.id));
      }, cow.duration * 1000 + 80);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flying-cow-layer" aria-hidden="true">
      {cows.map((cow) => (
        <span
          key={cow.id}
          className={`flying-cow ${cow.fromLeft ? "from-left" : "from-right"}`}
          style={
            {
              top: `${cow.top}vh`,
              fontSize: `${cow.size}rem`,
              animationDuration: `${cow.duration}s`,
              "--cow-wobble": `${cow.wobble}px`,
              "--cow-tilt": `${cow.tilt}deg`,
            } as React.CSSProperties
          }
        >
          🐄
        </span>
      ))}
    </div>
  );
}
