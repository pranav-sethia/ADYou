"use client";

import { Fragment, useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { Zap, PanelLeftClose, PanelLeft, BookOpen, ArrowLeft } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { TypingIndicator } from "@/components/typing-indicator";
import { WelcomeScreen } from "@/components/welcome-screen";
import { FeasibilitySidebar } from "@/components/feasibility-sidebar";
import { ChipGroup, OnboardingQ2 } from "@/components/answer-chips";
import type { UserProfile, PropertyContext } from "@/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL ?? "http://localhost:8001";
const STORAGE_KEY = "adu-advisor-profile";
const MESSAGES_KEY = "adu-advisor-messages";

const DEFAULT_PROFILE: UserProfile = {
  aduType: null,
  blockerTypes: [],
  hasBlockers: null,
  hasExistingStructure: null,
  primaryUse: null,
  onboardingComplete: false,
  onboardingStep: 0,
};

const GREETING =
  "Hi! I'm your ADU Advisor, powered by the California HCD Handbook.\n\nI have 3 quick questions to personalize your requirements checklist — takes about 30 seconds.\n\nWhat type of ADU are you looking to build?";

const Q2_TEXT = "Two quick things about your property:";

const Q3_TEXT = "Last one — what's the main purpose of the ADU?";

const Q1_OPTIONS = [
  { id: "detached", label: "New detached structure" },
  { id: "garage_conversion", label: "Garage or storage conversion" },
  { id: "attached", label: "Room addition / attached" },
  { id: "jadu", label: "Junior ADU (≤500 sqft)" },
  { id: "unsure", label: "Not sure yet" },
];

const Q3_OPTIONS = [
  { id: "rental", label: "Long-term rental" },
  { id: "family", label: "House a family member" },
  { id: "str", label: "Short-term rental (Airbnb / VRBO)" },
  { id: "personal", label: "Personal use / office" },
];

const QUICK_PROMPTS = [
  { label: "What is an ADU?", prompt: "What is an ADU and what are the basic requirements in California?" },
  { label: "Size limits", prompt: "What are the maximum size limits for an ADU in California?" },
  { label: "Permitting process", prompt: "What is the permitting process for building an ADU?" },
  { label: "Setback requirements", prompt: "What are the setback requirements for ADUs?" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

const ADU_TYPE_TEXT: Record<string, string> = {
  detached: "a new detached ADU",
  garage_conversion: "a garage or storage conversion",
  attached: "an attached room addition",
  jadu: "a Junior ADU (JADU) within my home",
  unsure: "an ADU, but I'm not sure what type yet",
};

const PRIMARY_USE_TEXT: Record<string, string> = {
  rental: "long-term rental income",
  family: "housing a family member",
  str: "short-term rental (Airbnb/VRBO)",
  personal: "personal use or a home office",
};

function buildSummaryPrompt(profile: UserProfile, ctx?: PropertyContext): string {
  const typeText = ADU_TYPE_TEXT[profile.aduType ?? "unsure"] ?? "an ADU";
  const useText = PRIMARY_USE_TEXT[profile.primaryUse ?? "personal"] ?? "general use";
  const blockerText =
    profile.blockerTypes.length > 0
      ? `Property conditions: ${profile.blockerTypes.join(", ")}.`
      : "No special property conditions (no HOA, historic district, or hillside).";
  const structureText =
    profile.hasExistingStructure === true
      ? "Has an existing structure available for conversion."
      : profile.hasExistingStructure === false
        ? "No existing structure to convert."
        : "Unsure about existing structures.";

  const parts = [
    `The user is planning to build ${typeText} in Irvine, CA.`,
    `Primary use: ${useText}.`,
    blockerText,
    structureText,
  ];

  if (ctx) {
    parts.push("");
    parts.push("Property analysis data from the map:");
    if (ctx.address) parts.push(`- Address: ${ctx.address}`);
    if (ctx.propertyArea) parts.push(`- Property area: ${ctx.propertyArea.toLocaleString()} sq ft`);
    if (ctx.buildableArea) parts.push(`- Buildable area (after setbacks): ${ctx.buildableArea.toLocaleString()} sq ft`);
    if (ctx.setback) parts.push(`- Required setback: ${ctx.setback} ft`);
    if (ctx.aduSize) parts.push(`- Planned ADU size: ${ctx.aduSize} sq ft`);
    if (ctx.aduShape) parts.push(`- ADU shape: ${ctx.aduShape.replace("_", " ")}`);
    if (ctx.maxAduSqft) parts.push(`- Maximum allowed ADU: ${ctx.maxAduSqft} sq ft`);
  }

  parts.push(
    "",
    "Respond in 3-4 conversational sentences:",
    "- Confirm the key rules that apply to their specific situation",
    "- Flag the single most important thing they need to know",
  );

  if (profile.hasExistingStructure && profile.aduType !== "garage_conversion") {
    parts.push("- Mention the garage conversion pathway as a potentially faster/cheaper option");
  }
  if (profile.primaryUse === "str") {
    parts.push("- Warn that Irvine requires a separate Short-Term Rental permit");
  }
  parts.push(
    '- End with: "Your checklist and tips on the left have been updated. What questions do you have?"'
  );

  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Source {
  page?: number;
  chunk_id?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  onboardingStep?: number;
  isOnboarding?: boolean;
}

interface ChatResponse {
  answer: string;
  sources: Source[];
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

interface RAGChatProps {
  propertyContext?: PropertyContext;
}

export function RAGChat({ propertyContext }: RAGChatProps) {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const profileRef = useRef(userProfile);
  profileRef.current = userProfile;
  const propertyContextRef = useRef(propertyContext);
  propertyContextRef.current = propertyContext;

  /* ---- Initialize from sessionStorage or property context ---- */
  useEffect(() => {
    if (!propertyContext) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const profile: UserProfile = JSON.parse(saved);
          if (profile.onboardingComplete) {
            setUserProfile(profile);
            setInitialized(true);
            return;
          }
        }
      } catch { /* start fresh */ }
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    const greeting = propertyContext
      ? (() => {
          const addr = propertyContext.address ?? "your property";
          const size = propertyContext.aduSize ? `${propertyContext.aduSize} sqft` : "";
          const shape = propertyContext.aduShape ? ` ${propertyContext.aduShape.replace("_", " ")}` : "";
          return `I see you've analyzed **${addr}** on the map and designed a ${size}${shape} ADU — great start!\n\nI have 3 quick questions to personalize your requirements checklist and tips — takes about 30 seconds.\n\nWhat type of ADU are you looking to build?`;
        })()
      : GREETING;

    setMessages([
      { id: generateId(), role: "assistant", content: greeting, onboardingStep: 0 },
    ]);
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Save profile on completion ---- */
  useEffect(() => {
    if (userProfile.onboardingComplete) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    }
  }, [userProfile.onboardingComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Scroll to bottom ---- */
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  /* ---------------------------------------------------------------- */
  /*  Onboarding handlers                                             */
  /* ---------------------------------------------------------------- */

  const handleQ1 = useCallback((aduType: string) => {
    setUserProfile((prev) => ({
      ...prev,
      aduType: aduType as UserProfile["aduType"],
      onboardingStep: 1,
    }));
    const text = `I want to build ${ADU_TYPE_TEXT[aduType] ?? "an ADU"}.`;
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: "user", content: text, isOnboarding: true },
      { id: generateId(), role: "assistant", content: Q2_TEXT, onboardingStep: 1 },
    ]);
  }, []);

  const handleQ2 = useCallback(
    (blockerTypes: string[], hasStructure: boolean | null) => {
      const hasBlockers = blockerTypes.length > 0;
      setUserProfile((prev) => ({
        ...prev,
        blockerTypes,
        hasBlockers,
        hasExistingStructure: hasStructure,
        onboardingStep: 2,
      }));

      const blockerText = hasBlockers
        ? `My property has: ${blockerTypes.join(", ")}.`
        : "None of those apply to my property.";
      const structureText =
        hasStructure === true
          ? "I have an existing structure to convert."
          : hasStructure === false
            ? "I don't have an existing structure to convert."
            : "I'm not sure about existing structures.";

      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "user", content: `${blockerText} ${structureText}`, isOnboarding: true },
        { id: generateId(), role: "assistant", content: Q3_TEXT, onboardingStep: 2 },
      ]);
    },
    []
  );

  const handleQ3 = useCallback(async (primaryUse: string) => {
    const userContent = `The main purpose is ${PRIMARY_USE_TEXT[primaryUse] ?? "general use"}.`;

    const updatedProfile: UserProfile = {
      ...profileRef.current,
      primaryUse: primaryUse as UserProfile["primaryUse"],
      onboardingStep: 3,
    };
    setUserProfile(updatedProfile);
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: "user", content: userContent, isOnboarding: true },
    ]);

    setIsLoading(true);
    setError(null);

    const history = messagesRef.current.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const prompt = buildSummaryPrompt(updatedProfile, propertyContextRef.current);

    try {
      const res = await fetch(`${RAG_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, history }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(e.detail ?? `Request failed (${res.status})`);
      }
      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content: data.answer, sources: data.sources },
      ]);
      setUserProfile((prev) => ({ ...prev, onboardingComplete: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get answer. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Regular chat handlers                                           */
  /* ---------------------------------------------------------------- */

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const previousMessages = messagesRef.current;
      const userMsg: Message = { id: generateId(), role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setError(null);
      setIsLoading(true);

      const history = previousMessages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch(`${RAG_API_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(e.detail ?? `Request failed (${res.status})`);
        }
        const data: ChatResponse = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: "assistant", content: data.answer, sources: data.sources },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not get answer. Try again.");
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

  const handleFinishChat = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profileRef.current));
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messagesRef.current));

    const inIframe = window.self !== window.top;
    if (inIframe) {
      window.parent.postMessage({ type: "adu-chat-finish" }, "*");
    } else {
      window.location.href = "/";
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Onboarding chip renderer                                        */
  /* ---------------------------------------------------------------- */

  function renderStepChips(step: number) {
    const isLocked =
      userProfile.onboardingStep > step || userProfile.onboardingComplete;

    if (step === 0) {
      return (
        <div className="mt-3 ml-3">
          <ChipGroup
            options={Q1_OPTIONS}
            selected={isLocked && userProfile.aduType ? [userProfile.aduType] : []}
            onSelect={(sel) => {
              if (!isLocked) handleQ1(sel[0]);
            }}
            locked={isLocked}
          />
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="mt-3 ml-3">
          <OnboardingQ2
            onAnswer={handleQ2}
            locked={isLocked}
            savedBlockers={userProfile.blockerTypes}
            savedStructure={userProfile.hasExistingStructure}
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="mt-3 ml-3">
          <ChipGroup
            options={Q3_OPTIONS}
            selected={isLocked && userProfile.primaryUse ? [userProfile.primaryUse] : []}
            onSelect={(sel) => {
              if (!isLocked) handleQ3(sel[0]);
            }}
            locked={isLocked}
          />
        </div>
      );
    }

    return null;
  }

  /* ---------------------------------------------------------------- */
  /*  Derived state                                                   */
  /* ---------------------------------------------------------------- */

  if (!initialized) return <div className="relative flex h-screen" />;

  const hasMessages = messages.length > 0;
  const freeFormStarted =
    userProfile.onboardingComplete &&
    messages.some((m) => m.role === "user" && !m.isOnboarding);

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="relative flex h-screen">
      {/* Sidebar */}
      <div
        className={`shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-sm transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? "w-[320px]" : "w-0"
        }`}
      >
        <div className="w-[320px] h-full">
          <FeasibilitySidebar userProfile={userProfile} />
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
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <div className="h-5 w-px bg-border/60" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight leading-none">ADU Advisor</h1>
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider mt-0.5">California HCD Handbook</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur border border-border/60">
              <div className="relative flex items-center justify-center w-2 h-2">
                <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Online</span>
            </div>
            <button
              onClick={handleFinishChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur border border-border/60 hover:border-primary/30 hover:bg-primary/10 transition-all duration-200 cursor-pointer group"
            >
              <ArrowLeft className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                Finish &amp; Return Home
              </span>
            </button>
          </div>
        </header>

        {/* Chat area */}
        {hasMessages ? (
          <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scrollbar px-5 py-5">
            <div className="flex flex-col gap-5 max-w-3xl mx-auto pb-2">
              {messages.map((msg, i) => (
                <Fragment key={msg.id}>
                  <ChatMessage
                    role={msg.role}
                    content={msg.content}
                    sources={msg.sources}
                    isLatest={i === messages.length - 1}
                  />
                  {msg.onboardingStep !== undefined && renderStepChips(msg.onboardingStep)}
                </Fragment>
              ))}

              {isLoading && <TypingIndicator />}

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 animate-fade-in-up">
                  <p className="text-sm text-destructive-foreground">{error}</p>
                </div>
              )}

              {/* Post-onboarding quick-action chips */}
              {userProfile.onboardingComplete && !freeFormStarted && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-2 animate-fade-in-up">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handleSelectPrompt(p.prompt)}
                      className="group flex items-center gap-2 text-left px-3.5 py-2.5 rounded-xl bg-card/60 backdrop-blur border border-border/60 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors duration-300" />
                      <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {p.label}
                      </span>
                    </button>
                  ))}
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
            isLoading={isLoading || !userProfile.onboardingComplete}
            placeholder={
              !userProfile.onboardingComplete
                ? "Answer the questions above to continue..."
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
