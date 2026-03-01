"use client";

import { useEffect, useRef, useState } from "react";

interface Source {
  page?: number;
  chunk_id?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function ChatMessage({ role, content, sources }: ChatMessageProps) {
  const isUser = role === "user";
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const base =
    "transition-all duration-500 ease-out " +
    (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3");

  if (isUser) {
    return (
      <div ref={ref} className={`w-full flex justify-end ${base}`}>
        <div className="max-w-[85%] sm:max-w-[72%] lg:max-w-[60%]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 text-right mb-2.5 mr-1 select-none">
            You
          </p>
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-700/50 px-6 py-4 shadow-lg shadow-black/30">
            <p className="text-[15px] sm:text-base text-zinc-100 leading-7 whitespace-pre-wrap">
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`w-full flex justify-start ${base}`}>
      <div className="max-w-[92%] sm:max-w-[78%] lg:max-w-[68%]">
        <div className="flex items-center gap-2.5 mb-2.5 ml-1 select-none">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-40" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
            ADU AI
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-black/30">
          <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-cyan-400 via-cyan-500 to-teal-600" />
          <div className="bg-zinc-900/95 border border-zinc-700/40 border-l-0 rounded-2xl pl-6 pr-6 py-5">
            <div className="text-[15px] sm:text-base text-zinc-50 leading-[1.8] whitespace-pre-wrap">
              {content}
            </div>

            {sources && sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-800/60">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2.5">
                  Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, idx) => (
                    <span
                      key={`${s.chunk_id ?? "s"}-${idx}`}
                      className="text-[11px] font-medium rounded-lg border border-zinc-700/70 bg-zinc-800/80 text-zinc-400 px-3 py-1 hover:border-zinc-600 hover:text-zinc-300 transition-colors cursor-default"
                    >
                      Page {s.page ?? "?"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
