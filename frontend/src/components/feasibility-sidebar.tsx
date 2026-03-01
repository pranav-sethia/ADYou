"use client";

import {
  CheckCircle2,
  Flame,
  MapPin,
  FileCheck,
  Maximize2,
  ChevronRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FeasibilityItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  verified: boolean;
}

const ITEMS: FeasibilityItem[] = [
  {
    id: "zoning",
    icon: <MapPin className="w-4 h-4" />,
    title: "Zoning & Setbacks",
    description:
      "Verified rear and side setback requirements for Irvine, CA.",
    verified: true,
  },
  {
    id: "size",
    icon: <Maximize2 className="w-4 h-4" />,
    title: "Size Limits (800 sqft)",
    description:
      "Unit falls within the 1,200 sqft maximum for detached ADUs.",
    verified: true,
  },
  {
    id: "fire",
    icon: <Flame className="w-4 h-4" />,
    title: "Fire Hazard Compliance",
    description:
      "Property is not within a Very High Fire Hazard Severity Zone.",
    verified: false,
  },
  {
    id: "permit",
    icon: <FileCheck className="w-4 h-4" />,
    title: "Permitting Process",
    description:
      "Ministerial approval \u2014 no discretionary review required.",
    verified: false,
  },
];

export function FeasibilitySidebar() {
  const verifiedCount = ITEMS.filter((i) => i.verified).length;

  return (
    <aside className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          Project Feasibility
        </h2>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--neon-cyan)]" />
          <span className="text-xs text-muted-foreground">
            Irvine, CA &middot; 1 Bed / 1 Bath
          </span>
        </div>
      </div>

      <div className="mx-5 h-px bg-border/60" />

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-1.5">
          {ITEMS.map((item, index) => (
            <button
              key={item.id}
              className="group relative flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-300 hover:bg-secondary/60 cursor-default"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div
                className={`shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-300 ${
                  item.verified
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/80 border-border text-muted-foreground group-hover:border-primary/20 group-hover:text-foreground"
                }`}
              >
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-foreground leading-tight truncate">
                    {item.title}
                  </span>
                  {item.verified ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 pt-2">
        <div className="h-px bg-border/60 mb-4" />
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Verification
          </span>
          <span className="text-[11px] font-mono text-primary tracking-wider">
            {verifiedCount}/{ITEMS.length}
          </span>
        </div>
        <Progress
          value={(verifiedCount / ITEMS.length) * 100}
          className="h-1.5 bg-secondary"
        />
      </div>
    </aside>
  );
}
