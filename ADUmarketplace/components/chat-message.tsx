"use client";

interface SourceRef {
  page?: number;
  chunk_id?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLatest?: boolean;
  sources?: SourceRef[];
}

export function ChatMessage({
  role,
  content,
  isLatest,
  sources,
}: ChatMessageProps) {
  const isAI = role === "assistant";

  return (
    <div
      className={`flex ${isAI ? "justify-start" : "justify-end"} ${
        isLatest ? (isAI ? "animate-fade-in-up" : "animate-scale-in") : ""
      }`}
    >
      <div className="relative max-w-[85%]">
        <div
          className={`flex items-center gap-2 mb-2 ${isAI ? "" : "justify-end"}`}
        >
          {isAI ? (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--neon-cyan)]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary font-medium">
                ADU AI
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              You
            </span>
          )}
        </div>

        <div
          className={`relative ${
            isAI
              ? "bg-card/80 backdrop-blur-sm border-l-2 border-l-primary/60 border border-border/60 rounded-2xl rounded-tl-md"
              : "bg-primary/15 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-tr-md"
          } px-4 py-3.5 transition-all duration-300`}
        >
          <div
            className={`text-[13px] leading-[1.7] whitespace-pre-wrap ${
              isAI ? "text-foreground/90" : "text-foreground/85"
            }`}
          >
            {content}
          </div>

          {isAI && sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 block mb-1.5">
                Sources
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((source, i) => (
                  <span
                    key={`${source.chunk_id ?? "s"}-${i}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/80 border border-border/50 text-[10px] font-mono text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors duration-200 cursor-default"
                  >
                    Page {source.page ?? "?"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
