"use client";

/**
 * ValidationHUD — Heads-up display overlay showing the analysis workflow
 * and results panel.
 */

import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/types";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface ValidationHUDProps {
    selectedLocation: { lat: number; lng: number; name: string } | null;
    hasDrawnBoundary: boolean;
    isLoading: boolean;
    result: AnalyzeResponse | null;
    error: string | null;
    onAnalyze: () => void;
    onReset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ValidationHUD({
    selectedLocation,
    hasDrawnBoundary,
    isLoading,
    result,
    error,
    onAnalyze,
    onReset,
}: ValidationHUDProps) {
    const [toastVisible, setToastVisible] = useState(false);
    const [toastExiting, setToastExiting] = useState(false);

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

                <StepRow
                    number={1}
                    label="Search Address"
                    description="Find your property on the map"
                    isActive={!selectedLocation}
                    isComplete={!!selectedLocation}
                />

                <StepRow
                    number={2}
                    label="Draw Analysis Boundary"
                    description="Use the polygon tool (top right) to outline the build area"
                    isActive={!!selectedLocation && !hasDrawnBoundary}
                    isComplete={hasDrawnBoundary}
                />

                <StepRow
                    number={3}
                    label="AI Property Scan"
                    description="Detect structures & compute buildable area"
                    isActive={isLoading}
                    isComplete={!!result}
                />

                {/* Action Buttons */}
                <div className="mt-5 flex flex-col gap-2">
                    {selectedLocation && !result && !isLoading && (
                        <>
                            <p className="text-xs text-zinc-400 mb-1 truncate">
                                📍 {selectedLocation.name}
                            </p>
                            <button
                                onClick={onAnalyze}
                                disabled={!hasDrawnBoundary}
                                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 
                                ${hasDrawnBoundary
                                        ? "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
                                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"}`}
                            >
                                🔍 Analyze Area
                            </button>
                        </>
                    )}

                    {!selectedLocation && !result && (
                        <p className="text-xs text-zinc-500 text-center">
                            Search for an address to get started
                        </p>
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

                {/* Loading indicator with scanning animation */}
                {isLoading && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            Scanning property…
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full animate-pulse"
                                style={{ width: "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1">
                            Fetching parcel boundary → Detecting structures → Computing zones
                        </p>
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
                                    ADU Eligible!
                                </h3>
                            </div>
                            {/* {result.address && (
                                <p className="text-xs text-zinc-400 mb-2">📍 {result.address}</p>
                            )} */}
                            <div className="space-y-1.5 mb-3">
                                <p className="text-xs text-zinc-300">
                                    Property: <span className="font-semibold">{result.property_area_sqft.toLocaleString()} sq ft</span>
                                </p>
                                <p className="text-xs text-zinc-300">
                                    Buildable: <span className="text-emerald-400 font-semibold">
                                        {result.buildable_area_sqft.toLocaleString()} sq ft
                                    </span>
                                </p>
                                <p className="text-xs text-zinc-300">
                                    Setback: {result.setback_ft} ft · Max ADU: {result.max_adu_sqft.toLocaleString()} sq ft
                                </p>
                            </div>
                            {result.obstacles.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-zinc-400 mb-1">Structures detected:</p>
                                    {result.obstacles.map((obs, i) => (
                                        <p key={i} className="text-xs text-zinc-500">
                                            • {obs.name} ({obs.area_sqft.toLocaleString()} sq ft, {Math.round(obs.confidence * 100)}% conf)
                                        </p>
                                    ))}
                                </div>
                            )}
                            {result.est_cost_low && result.est_cost_high && (
                                <p className="text-lg font-bold text-emerald-400">
                                    ${result.est_cost_low.toLocaleString()} – ${result.est_cost_high.toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    {result && !result.is_valid && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-400 text-lg">❌</span>
                                <h3 className="text-sm font-semibold text-red-400">
                                    Insufficient Space
                                </h3>
                            </div>
                            <p className="text-xs text-zinc-300 mb-2">{result.message}</p>
                            {/* {result.address && (
                                <p className="text-xs text-zinc-400">📍 {result.address}</p>
                            )} */}
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
