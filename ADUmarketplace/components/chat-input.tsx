"use client";

import { Send, Paperclip } from "lucide-react";
import { type FormEvent, useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <div className="shrink-0 px-1 pb-4 pt-3">
      <form onSubmit={onSubmit} className="relative">
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/30 via-neon-purple/20 to-primary/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-[2px]" />

          <div className="relative flex items-end gap-3 bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl px-4 py-3 transition-all duration-300 group-focus-within:border-primary/30 group-focus-within:shadow-[0_0_30px_rgba(56,189,248,0.06)]">
            <button
              type="button"
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/60 transition-all duration-200 cursor-pointer"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder ?? "Ask about ADU regulations, requirements, permits..."}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[24px] max-h-[120px] leading-relaxed"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:shadow-[0_0_20px_var(--neon-cyan)] hover:scale-105 disabled:opacity-20 disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-2 font-mono tracking-wider">
          Powered by RAG &middot; California HCD ADU Handbook
        </p>
      </form>
    </div>
  );
}
