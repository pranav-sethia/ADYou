"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ChatMessage from "@/components/ChatMessage";

const RAG_API_URL =
  process.env.NEXT_PUBLIC_RAG_API_URL ?? "http://localhost:8001";

interface Source {
  page?: number;
  chunk_id?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface ChatResponse {
  answer: string;
  sources: Source[];
}

const QUICK_PROMPTS = [
  "What is an ADU?",
  "Size limits",
  "Permitting process",
  "Setback requirements",
];

export default function RAGChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;
      setInput("");
      setError(null);
      setMessages((prev) => [...prev, { role: "user", content: msg }]);
      setLoading(true);

      try {
        const res = await fetch(`${RAG_API_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(e.detail ?? `Request failed (${res.status})`);
        }
        const data: ChatResponse = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, sources: data.sources },
        ]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not get answer. Try again."
        );
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [input, loading]
  );

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#060609] text-white">
      {/* ── Global styles ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }

        .hero-float { animation: float 5s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .fade-up-d1 { animation-delay: 0.08s; }
        .fade-up-d2 { animation-delay: 0.16s; }
        .fade-up-d3 { animation-delay: 0.24s; }
        .dot-b1 { animation: dotBounce 1.4s ease-in-out infinite 0s; }
        .dot-b2 { animation: dotBounce 1.4s ease-in-out infinite 0.15s; }
        .dot-b3 { animation: dotBounce 1.4s ease-in-out infinite 0.3s; }

        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(63, 63, 70, 0.5);
          border-radius: 10px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(82, 82, 91, 0.7);
        }

        .input-glow:focus-within {
          box-shadow: 0 0 0 1px rgba(6, 182, 212, 0.3),
                      0 0 20px rgba(6, 182, 212, 0.08);
        }
      `}</style>

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-30%] left-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-900/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-teal-900/[0.05] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex-none flex items-center justify-between px-6 lg:px-10 h-16 border-b border-white/[0.06] bg-[#060609]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-[0_0_24px_rgba(6,182,212,0.45)] ring-1 ring-white/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[18px] w-[18px] text-white"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-white tracking-[-0.01em]">
              ADU Advisor
            </p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.18em] mt-px">
              California HCD Handbook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
          </span>
          <span className="text-[11px] font-semibold text-zinc-300 tracking-[0.08em] uppercase">
            RAG AI &middot; Online
          </span>
        </div>
      </nav>

      {/* ── Main area ── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        {/* Empty state */}
        {isEmpty && mounted && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Floating icon */}
            <div className="relative hero-float fade-up mb-8">
              <div className="absolute -inset-6 rounded-3xl bg-cyan-500/15 blur-3xl" />
              <div className="relative h-[72px] w-[72px] rounded-2xl bg-gradient-to-br from-[#0f2a2a] to-[#0a1e1e] border border-cyan-700/30 flex items-center justify-center shadow-[0_8px_40px_rgba(6,182,212,0.2)] ring-1 ring-white/[0.05]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-cyan-400"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>

            {/* Title block */}
            <div className="text-center max-w-lg fade-up fade-up-d1">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                ADU Advisor
              </h1>
              <p className="text-[15px] text-zinc-400 mt-3 leading-relaxed max-w-md mx-auto">
                Ask questions about California ADU regulations, permits,
                requirements, and building guidelines powered by the HCD ADU
                Handbook.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-lg fade-up fade-up-d2">
              {QUICK_PROMPTS.map((label) => (
                <button
                  key={label}
                  onClick={() => send(label)}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] px-5 py-3.5 text-left transition-all duration-200"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 text-zinc-600 group-hover:text-cyan-400 flex-none transition-colors duration-200"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors duration-200">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {!isEmpty && (
          <div className="flex-1 min-h-0 overflow-y-auto chat-scroll px-6 lg:px-10">
            <div className="max-w-4xl mx-auto py-8 space-y-7">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={`${msg.role}-${i}`}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                />
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="w-full flex justify-start fade-up">
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
                      <div className="bg-zinc-900/95 border border-zinc-700/40 border-l-0 rounded-2xl pl-6 pr-6 py-5 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400/80 dot-b1" />
                        <span className="h-2 w-2 rounded-full bg-cyan-400/80 dot-b2" />
                        <span className="h-2 w-2 rounded-full bg-cyan-400/80 dot-b3" />
                        <span className="text-sm text-zinc-500 ml-2">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-950/20 px-6 py-4 fade-up">
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="relative z-10 flex-none border-t border-white/[0.06] bg-[#060609]/90 backdrop-blur-xl px-6 lg:px-10 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="max-w-4xl mx-auto"
        >
          <div className="input-glow flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 transition-all duration-300">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about ADU regulations, requirements, permits..."
              disabled={loading}
              className="flex-1 bg-transparent text-[15px] text-zinc-100 placeholder-zinc-600 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="h-9 w-9 flex-none flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path
                  d="M22 2L11 13"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22l-4-9-9-4 20-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-[11px] text-zinc-600 mt-3 tracking-wider font-medium">
          Powered by RAG &middot; California HCD ADU Handbook
        </p>
      </div>
    </div>
  );
}
