"use client";

import { BookOpen, Sparkles } from "lucide-react";

interface SuggestionPrompt {
  label: string;
  prompt: string;
}

const SUGGESTIONS: SuggestionPrompt[] = [
  {
    label: "What is an ADU?",
    prompt:
      "What is an Accessory Dwelling Unit (ADU) and what are the basic requirements in California?",
  },
  {
    label: "Size limits",
    prompt: "What are the maximum size limits for an ADU in California?",
  },
  {
    label: "Permitting process",
    prompt:
      "What is the permitting process for building an ADU in California?",
  },
  {
    label: "Setback requirements",
    prompt: "What are the setback requirements for ADUs in California?",
  },
];

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 animate-fade-in-up">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150 animate-glow-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-card/80 backdrop-blur border border-border/60 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-foreground text-balance text-center mb-2.5 tracking-tight">
        ADU Advisor
      </h1>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-10 leading-relaxed">
        Ask questions about California ADU regulations, permits, and building
        guidelines powered by the HCD Handbook.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => onSelectPrompt(suggestion.prompt)}
            className="group flex items-center gap-3 text-left px-4 py-3.5 rounded-xl bg-card/60 backdrop-blur border border-border/60 hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_0_16px_rgba(56,189,248,0.04)] transition-all duration-300 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors duration-300" />
            <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors duration-300">
              {suggestion.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
