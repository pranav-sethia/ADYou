"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { TypingIndicator } from "@/components/typing-indicator";
import { WelcomeScreen } from "@/components/welcome-screen";
import { FeasibilitySidebar } from "@/components/feasibility-sidebar";
import { Zap, PanelLeftClose, PanelLeft } from "lucide-react";

const RAG_API_URL =
  process.env.NEXT_PUBLIC_RAG_API_URL ?? "http://localhost:8001";

interface Source {
  page?: number;
  chunk_id?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface ChatResponse {
  answer: string;
  sources: Source[];
}

function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

export function RAGChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const previousMessages = messagesRef.current;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setError(null);
      setIsLoading(true);

      const history = previousMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch(`${RAG_API_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });
        if (!res.ok) {
          const e = await res
            .json()
            .catch(() => ({ detail: res.statusText }));
          throw new Error(e.detail ?? `Request failed (${res.status})`);
        }
        const data: ChatResponse = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: data.answer,
            sources: data.sources,
          },
        ]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not get answer. Try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleSelectPrompt = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  return (
    <div className="relative flex h-screen">
      {/* Sidebar */}
      <div
        className={`shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-sm transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? "w-[320px]" : "w-0"
        }`}
      >
        <div className="w-[320px] h-full">
          <FeasibilitySidebar />
        </div>
      </div>

      {/* Main chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 shrink-0 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200 cursor-pointer"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>

            <div className="h-5 w-px bg-border/60" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight leading-none">
                  ADU Advisor
                </h1>
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider mt-0.5">
                  California HCD Handbook
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur border border-border/60">
            <div className="relative flex items-center justify-center w-2 h-2">
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Online
            </span>
          </div>
        </header>

        {/* Chat area */}
        {hasMessages ? (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto chat-scrollbar px-5 py-5"
          >
            <div className="flex flex-col gap-5 max-w-3xl mx-auto pb-2">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                  isLatest={i === messages.length - 1}
                />
              ))}
              {isLoading && <TypingIndicator />}
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 animate-fade-in-up">
                  <p className="text-sm text-destructive-foreground">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
        )}

        {/* Input dock */}
        <div className="max-w-3xl mx-auto w-full px-5">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
