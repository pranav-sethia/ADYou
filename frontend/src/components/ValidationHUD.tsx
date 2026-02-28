"use client";

/**
 * ValidationHUD — Heads-up display overlay showing the drawing workflow
 * steps and validation results (toast notifications).
 */

import { useEffect, useState } from "react";
import type { DrawingPhase, ValidationResponse } from "@/types";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface ValidationHUDProps {
    phase: DrawingPhase;
    isLoading: boolean;
    result: ValidationResponse | null;
    error: string | null;
    onDrawProperty: () => void;
    onDrawADU: () => void;
    onReset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ValidationHUD({
    phase,
    isLoading,
    result,
    error,
    onDrawProperty,
    onDrawADU,
    onReset,
}: ValidationHUDProps) {
    const [toastVisible, setToastVisible] = useState(false);
    const [toastExiting, setToastExiting] = useState(false);

    // Show toast when we get a result or error
    useEffect(() => {
        if (result || error) {
            setToastVisible(true);
            setToastExiting(false);
        }
    }, [result, error]);

    const dismissToast = () => {
        setToastExiting(true);
        setTimeout(() => {
            setToastVisible(false);
            setToastExiting(false);
        }, 300);
    };

    return (
        <>
            {/* ---- Step Indicator Panel ---- */}
            <div className="fixed top-6 left-6 z-50 glass rounded-2xl p-5 w-80 shadow-2xl">
                <h2 className="text-sm font-semibold tracking-widest uppercase text-zinc-400 mb-4">
                    Feasibility Engine
                </h2>

                {/* Step 1 */}
                <StepRow
                    number={1}
                    label="Draw Property Boundary"
                    description="Trace the outline of your lot"
                    isActive={phase === "idle" || phase === "property"}
                    isComplete={phase === "adu" || !!result}
                />

                {/* Step 2 */}
                <StepRow
                    number={2}
                    label="Draw ADU Footprint"
                    description="Place your accessory dwelling"
                    isActive={phase === "adu"}
                    isComplete={!!result}
                />

                {/* Action Buttons */}
                <div className="mt-5 flex flex-col gap-2">
                    {phase === "idle" && !result && (
                        <button
                            onClick={onDrawProperty}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 
                         text-white text-sm font-medium transition-all duration-200 
                         hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
                        >
                            ✏️ Draw Property
                        </button>
                    )}

                    {phase === "property" && (
                        <p className="text-xs text-indigo-300 text-center animate-pulse">
                            Click on the map to trace your property boundary…
                        </p>
                    )}

                    {phase === "adu" && !result && (
                        <button
                            onClick={onDrawADU}
                            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 
                         text-white text-sm font-medium transition-all duration-200 
                         hover:shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
                        >
                            📐 Draw ADU
                        </button>
                    )}

                    {(result || error) && (
                        <button
                            onClick={onReset}
                            className="w-full py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 
                         text-white text-sm font-medium transition-all duration-200 cursor-pointer"
                        >
                            🔄 Start Over
                        </button>
                    )}
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        Validating placement…
                    </div>
                )}
            </div>

            {/* ---- Toast Notification ---- */}
            {toastVisible && (result || error) && (
                <div
                    className={`fixed top-6 right-6 z-50 max-w-sm glass rounded-2xl p-5 shadow-2xl 
                      ${toastExiting ? "toast-exit" : "toast-enter"}`}
                >
                    <button
                        onClick={dismissToast}
                        className="absolute top-3 right-3 text-zinc-500 hover:text-white text-sm cursor-pointer"
                    >
                        ✕
                    </button>

                    {error && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-400 text-lg">⚠️</span>
                                <h3 className="text-sm font-semibold text-red-400">Error</h3>
                            </div>
                            <p className="text-xs text-zinc-300">{error}</p>
                        </div>
                    )}

                    {result && result.is_valid && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-emerald-400 text-lg">✅</span>
                                <h3 className="text-sm font-semibold text-emerald-400">
                                    Valid Placement!
                                </h3>
                            </div>
                            <p className="text-xs text-zinc-300 mb-1">
                                Area: {result.area_sqft.toLocaleString()} sq ft
                            </p>
                            {result.est_cost && (
                                <p className="text-lg font-bold text-emerald-400">
                                    Est. Cost: ${result.est_cost.toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    {result && !result.is_valid && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-400 text-lg">❌</span>
                                <h3 className="text-sm font-semibold text-red-400">
                                    Invalid Placement
                                </h3>
                            </div>
                            <p className="text-xs text-zinc-300 mb-2">
                                Area: {result.area_sqft.toLocaleString()} sq ft
                            </p>
                            <ul className="space-y-1">
                                {result.violations.map((v, i) => (
                                    <li key={i} className="text-xs text-red-300 flex gap-1.5">
                                        <span className="shrink-0">•</span>
                                        <span>{v}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function StepRow({
    number,
    label,
    description,
    isActive,
    isComplete,
}: {
    number: number;
    label: string;
    description: string;
    isActive: boolean;
    isComplete: boolean;
}) {
    return (
        <div className="flex items-start gap-3 mb-3">
            <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
          ${isComplete
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : isActive
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 pulse-ring"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}
            >
                {isComplete ? "✓" : number}
            </div>
            <div>
                <p
                    className={`text-sm font-medium transition-colors duration-300 ${isComplete
                            ? "text-emerald-400"
                            : isActive
                                ? "text-white"
                                : "text-zinc-500"
                        }`}
                >
                    {label}
                </p>
                <p className="text-xs text-zinc-500">{description}</p>
            </div>
        </div>
    );
}
