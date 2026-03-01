"use client";

/**
 * ValidationHUD — Heads-up display overlay showing the analysis workflow
 * and results panel.
 */

import type { AnalyzeResponse } from "@/types";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface ValidationHUDProps {
    selectedLocation: { lat: number; lng: number; name: string } | null;
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
    isLoading,
    result,
    error,
    onAnalyze,
    onReset,
}: ValidationHUDProps) {
    return (
        <>
            {/* ---- Step Indicator Panel ---- */}
            <div className="absolute top-6 left-6 z-50 w-80 shadow-xl bg-white flex flex-col rounded-xl ring-1 ring-slate-900/5">

                {/* Header Section */}
                <div className="pt-3 px-9 mb-3">
                    <h2 className="text-xl font-extrabold tracking-normal text-slate-800 leading-tight pl-1">
                        ADU Feasibility
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 pl-1">Property qualification engine</p>
                </div>

                {/* Steps Section */}
                <div className="px-6 space-y-2">
                    <StepRow
                        number={1}
                        label="Location Search"
                        description="Identify target parcel"
                        isActive={!selectedLocation}
                        isComplete={!!selectedLocation}
                    />

                    <StepRow
                        number={2}
                        label="Point Selection"
                        description="Verify property on map"
                        isActive={!!selectedLocation && !result && !isLoading}
                        isComplete={!!result}
                    />

                    <StepRow
                        number={3}
                        label="AI Generation"
                        description="Compute buildable geometry"
                        isActive={isLoading}
                        isComplete={!!result}
                    />
                </div>

                {/* Unified Footer Section */}
                <div className="mt-4 flex flex-col w-full bg-slate-50/50 rounded-b-xl">
                    {!result && !isLoading && selectedLocation && (
                        <div className="flex flex-col w-full">
                            <div className="px-6 py-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl">
                                    <span className="text-sm font-medium text-slate-700 truncate flex-1 leading-tight">
                                        📍 {selectedLocation.name}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onAnalyze}
                                disabled={!selectedLocation}
                                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md cursor-pointer text-sm rounded-b-xl"
                            >
                                Check Property
                            </button>
                        </div>
                    )}

                    {!selectedLocation && !result && !error && (
                        <div className="text-center py-6 border-t border-slate-100 rounded-b-xl">
                            <p className="text-sm text-slate-500">
                                Search an address to begin
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="px-6 py-4 border-t border-slate-100 bg-rose-50">
                            <div className="flex items-start gap-2">
                                <span className="text-xl">⚠️</span>
                                <p className="text-sm text-rose-700 font-medium leading-tight">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    {(result || error) && (
                        <div className="border-t border-slate-100">
                            <button
                                onClick={onReset}
                                className="w-full py-5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all cursor-pointer block text-center rounded-b-xl"
                            >
                                Start New Project
                            </button>
                        </div>
                    )}

                    {/* Loading indicator with scanning animation */}
                    {isLoading && (
                        <div className="py-6 px-6 border-t border-slate-100 rounded-b-xl">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-emerald-600 animate-pulse">Computing Zones...</span>
                                <span className="text-xs font-semibold text-slate-500 font-mono">65%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500"
                                    style={{ width: "65%", transition: "width 0.5s ease-out" }} />
                            </div>
                            <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                                Detecting structures & setbacks...
                            </p>
                        </div>
                    )}
                </div>
            </div>
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
        <div className={`relative flex items-center gap-3 p-1 rounded-xl transition-all border ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-transparent border-transparent opacity-70'}`}>
            <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
          ${isComplete
                        ? "bg-emerald-100 text-emerald-600 animate-checkmark"
                        : isActive
                            ? "bg-slate-800 text-white shadow-md shadow-slate-900/10"
                            : "bg-slate-100 text-slate-500"
                    }`}
            >
                {isComplete ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    number
                )}
            </div>
            <div className="min-w-0">
                <p
                    className={`text-sm font-bold tracking-tight transition-colors ${isComplete || isActive
                        ? "text-slate-800"
                        : "text-slate-500"
                        }`}
                >
                    {label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug truncate">{description}</p>
            </div>

            {isActive && !isComplete && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
            )}
        </div>
    );
}
