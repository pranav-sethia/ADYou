"use client";

import dynamic from "next/dynamic";

/**
 * Dynamically import MapInterface with SSR disabled — Mapbox GL requires
 * the browser's `window` object and cannot render on the server.
 */
const MapInterface = dynamic(() => import("@/components/MapInterface"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500 tracking-wide">
          Loading satellite view…
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen">
      <MapInterface />
    </main>
  );
}
