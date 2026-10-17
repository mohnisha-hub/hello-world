"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const PerfumeFinder = dynamic(
  () => import("@/components/PerfumeFinder").then((module) => module.PerfumeFinder),
  { ssr: false, loading: () => <div className="perfume-finder-deferred">Preparing the perfume explorer…</div> },
);

type LiveListing = { brand: string | null; name: string };

export function DeferredPerfumeFinder({ signedIn, liveListings }: { signedIn: boolean; liveListings: LiveListing[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setReady(true);
      observer.disconnect();
    }, { rootMargin: "360px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div id="perfume-explorer" ref={ref}>{ready ? <PerfumeFinder signedIn={signedIn} liveListings={liveListings} /> : <section className="perfume-finder explore-zone perfume-finder-placeholder"><div className="explore-zone-heading"><div><p className="eyebrow">YOUR SCENT JOURNEY</p><h2>Perfume explorer</h2><p>Scroll a little further to explore Atelier&apos;s fragrance catalogue by note or house.</p></div></div></section>}</div>;
}
