"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--neon-cyan)]" />
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary font-medium">
            ADU AI
          </span>
        </div>

        <div className="bg-card/80 backdrop-blur-sm border-l-2 border-l-primary/60 border border-border/60 rounded-2xl rounded-tl-md px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-primary/70 animate-dot-pulse"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-primary/70 animate-dot-pulse"
              style={{ animationDelay: "200ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-primary/70 animate-dot-pulse"
              style={{ animationDelay: "400ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
