"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Flame,
  MapPin,
  FileCheck,
  Maximize2,
  ChevronRight,
  AlertCircle,
  Home,
  AlertTriangle,
  Warehouse,
  Zap,
  ShieldCheck,
  Coins,
  XCircle,
  Circle,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { UserProfile, PropertyContext } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type ItemStatus = "pass" | "fail" | "warning" | "unknown";

interface FeasibilityItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: ItemStatus;
}

interface Tip {
  id: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}

/* ------------------------------------------------------------------ */
/*  Static requirement items (always present)                         */
/* ------------------------------------------------------------------ */

function getBaseItems(ctx?: PropertyContext): FeasibilityItem[] {
  const address = ctx?.address || "Irvine, CA";
  const size = ctx?.aduSize || 800;
  const max = ctx?.maxAduSqft || 1200;
  const setback = ctx?.setback !== undefined ? ctx.setback : 4;

  return [
    {
      id: "zoning",
      icon: <MapPin className="w-4 h-4" />,
      title: "Zoning & Setbacks",
      description: `Verified rear and side setback requirements (${setback}ft) for ${address}.`,
      status: "pass",
    },
    {
      id: "size",
      icon: <Maximize2 className="w-4 h-4" />,
      title: `Size Limits (${size} sqft)`,
      description: `Unit falls within the ${max.toLocaleString()} sqft maximum for detached ADUs.`,
      status: "pass",
    },
    {
      id: "fire",
      icon: <Flame className="w-4 h-4" />,
      title: "Fire Hazard Compliance",
      description: "Property is not within a Very High Fire Hazard Severity Zone.",
      status: "unknown",
    },
    {
      id: "permit",
      icon: <FileCheck className="w-4 h-4" />,
      title: "Permitting Process",
      description: "Ministerial approval \u2014 no discretionary review required.",
      status: "unknown",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Conditional items (added after onboarding)                        */
/* ------------------------------------------------------------------ */

function getConditionalItems(profile: UserProfile): FeasibilityItem[] {
  const items: FeasibilityItem[] = [];

  if (profile.aduType === "jadu") {
    items.push({
      id: "owner-occupancy",
      icon: <Home className="w-4 h-4" />,
      title: "Owner-Occupancy Required",
      description:
        "JADUs require the property owner to live on-site in either the main home or the JADU.",
      status: "warning",
    });
  }

  if (profile.primaryUse === "str") {
    items.push({
      id: "str-permit",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Irvine STR Permit Required",
      description:
        "Short-term rentals need a separate City of Irvine STR permit in addition to the ADU building permit.",
      status: "warning",
    });
  }

  if (profile.hasBlockers) {
    items.push({
      id: "additional-review",
      icon: <AlertCircle className="w-4 h-4" />,
      title: "Additional Review May Apply",
      description: `${profile.blockerTypes.join(", ")} conditions may add design requirements or review steps.`,
      status: "warning",
    });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Tips generation                                                   */
/* ------------------------------------------------------------------ */

function getTips(profile: UserProfile): Tip[] {
  const tips: Tip[] = [];

  const isGarageConversion = profile.aduType === "garage_conversion";
  if (isGarageConversion || profile.hasExistingStructure) {
    tips.push({
      id: "garage-advantage",
      icon: <Warehouse className="w-4 h-4" />,
      title: "Garage Conversion Advantage",
      detail:
        "Conversions have zero setback requirements and qualify for faster ministerial approval under California AB-68.",
    });
  }

  if (profile.aduType === "jadu") {
    tips.push({
      id: "owner-occupancy-tip",
      icon: <Home className="w-4 h-4" />,
      title: "Owner-Occupancy Rule",
      detail:
        "JADUs require the property owner to live on-site in either the main home or the JADU itself.",
    });
  }

  if (profile.primaryUse === "str") {
    tips.push({
      id: "str-tip",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Irvine STR Permit Required",
      detail:
        "Short-term rentals need a separate City of Irvine STR permit in addition to the ADU building permit.",
    });
  }

  if (profile.aduType === "detached") {
    tips.push({
      id: "streamlined",
      icon: <Zap className="w-4 h-4" />,
      title: "Streamlined Approval Available",
      detail:
        "ADUs under 800 sqft with 4ft setbacks qualify for ministerial approval \u2014 no discretionary review or public hearing.",
    });
  }

  if (profile.hasBlockers) {
    tips.push({
      id: "blocker-tip",
      icon: <ShieldCheck className="w-4 h-4" />,
      title: "Additional Review May Apply",
      detail:
        "HOA, historic district, or hillside conditions may add design requirements or review steps beyond standard permitting.",
    });
  }

  tips.push({
    id: "impact-fee",
    icon: <Coins className="w-4 h-4" />,
    title: "Impact Fee Exemption",
    detail:
      "ADUs under 750 sqft are exempt from school impact fees in California \u2014 this can save several thousand dollars.",
  });

  return tips;
}

/* ------------------------------------------------------------------ */
/*  Status icon helper                                                */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: ItemStatus }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />;
    case "fail":
      return <XCircle className="w-4 h-4 text-destructive-foreground shrink-0" />;
    case "warning":
      return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
    default:
      return <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />;
  }
}

function statusIconClass(status: ItemStatus): string {
  switch (status) {
    case "pass":
      return "bg-primary/10 border-primary/30 text-primary";
    case "warning":
      return "bg-amber-400/10 border-amber-400/30 text-amber-400";
    case "fail":
      return "bg-destructive/10 border-destructive/30 text-destructive-foreground";
    default:
      return "bg-secondary/80 border-border text-muted-foreground";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface Props {
  userProfile: UserProfile;
  propertyContext?: PropertyContext;
}

export function FeasibilitySidebar({ userProfile, propertyContext }: Props) {
  const [activeTab, setActiveTab] = useState<"requirements" | "tips">("requirements");
  const [tipsBadge, setTipsBadge] = useState(false);
  const prevComplete = useRef(false);

  useEffect(() => {
    if (userProfile.onboardingComplete && !prevComplete.current) {
      setTipsBadge(true);
    }
    prevComplete.current = userProfile.onboardingComplete;
  }, [userProfile.onboardingComplete]);

  const conditionalItems = userProfile.onboardingComplete
    ? getConditionalItems(userProfile)
    : [];
  const baseItems = getBaseItems(propertyContext);
  const allItems = [...baseItems, ...conditionalItems];
  const passCount = allItems.filter((i) => i.status === "pass").length;
  const tips = userProfile.onboardingComplete ? getTips(userProfile) : [];

  return (
    <aside className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          Project Feasibility
        </h2>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-xs text-muted-foreground truncate" title={propertyContext?.address || "Irvine, CA"}>
            {propertyContext?.address || "Irvine, CA"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-5 flex gap-1 p-1 rounded-lg bg-secondary/40">
        <button
          onClick={() => setActiveTab("requirements")}
          className={`flex-1 text-[12px] font-medium py-1.5 rounded-md transition-all duration-200 cursor-pointer ${activeTab === "requirements"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Requirements
        </button>
        <button
          onClick={() => {
            setActiveTab("tips");
            setTipsBadge(false);
          }}
          className={`relative flex-1 text-[12px] font-medium py-1.5 rounded-md transition-all duration-200 cursor-pointer ${activeTab === "tips"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Tips
          {tipsBadge && activeTab !== "tips" && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      </div>

      <div className="mx-5 mt-3 h-px bg-border/60" />

      {/* ---- Requirements Tab ---- */}
      {activeTab === "requirements" && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="flex flex-col gap-1.5">
              {allItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-300 hover:bg-secondary/60"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div
                    className={`shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-300 ${statusIconClass(item.status)}`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground leading-tight truncate">
                        {item.title}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
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
                {passCount}/{allItems.length}
              </span>
            </div>
            <Progress
              value={(passCount / allItems.length) * 100}
              className="h-1.5 bg-secondary"
            />
          </div>
        </>
      )}

      {/* ---- Tips Tab ---- */}
      {activeTab === "tips" && (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {!userProfile.onboardingComplete ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-card/80 border border-border/60 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[220px]">
                Answer the quick setup questions in the chat to get personalized tips for your project.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tips.map((tip, index) => (
                <div
                  key={tip.id}
                  className="flex items-start gap-3 rounded-xl px-3 py-3 bg-card/40 border border-border/40 transition-all duration-300 hover:bg-card/60 animate-fade-in-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center text-primary/70">
                    {tip.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-foreground leading-tight">
                      {tip.title}
                    </span>
                    <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">
                      {tip.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
