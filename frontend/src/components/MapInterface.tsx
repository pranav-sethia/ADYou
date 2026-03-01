"use client";

/**
 * MapInterface — Full-screen Mapbox satellite view with automated
 * ADU feasibility analysis. User searches an address, clicks "Analyze",
 * and the backend returns property boundary, obstacles, and buildable zone.
 */

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import Map, { Source, Layer, NavigationControl, Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import * as turf from "@turf/turf";

import ValidationHUD from "./ValidationHUD";
import AddressSearch from "./AddressSearch";

import type { AnalyzeRequest, AnalyzeResponse } from "@/types";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const IRVINE_CENTER = { longitude: -117.7731, latitude: 33.6846 };

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function MapInterface() {
    const mapRef = useRef<MapRef | null>(null);

    // Location state (set by address search)
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
        name: string;
    } | null>(null);

    // Analysis state
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalyzeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Interactive ADU State
    const [aduCenter, setAduCenter] = useState<{ lng: number; lat: number } | null>(null);
    const [aduSize, setAduSize] = useState<number>(600); // Square feet
    const [aduAspectRatio, setAduAspectRatio] = useState<number>(1.0); // Width / Length
    const [aduRotation, setAduRotation] = useState<number>(0); // Degrees 0-360
    const [isAduValid, setIsAduValid] = useState<boolean>(true);

    // GeoJSON layers (derived from result)
    const propertyLayer = result?.property_geojson
        ? {
            type: "Feature" as const,
            properties: {},
            geometry: result.property_geojson as unknown as GeoJSON.Geometry,
        }
        : null;

    const buildableLayer = result?.buildable_zone_geojson
        ? {
            type: "Feature" as const,
            properties: {},
            geometry: result.buildable_zone_geojson as unknown as GeoJSON.Geometry,
        }
        : null;

    const obstacleFeatures = (result?.obstacles ?? [])
        .map((obs, i) => ({
            type: "Feature" as const,
            properties: { name: obs.name, index: i },
            geometry: obs.geojson as unknown as GeoJSON.Geometry,
        }));

    /* ---------------------------------------------------------------- */
    /*  Handlers                                                        */
    /* ---------------------------------------------------------------- */

    /** Called when user selects an address from search */
    const handleAddressResult = useCallback(
        (lng: number, lat: number, placeName: string) => {
            setSelectedLocation({ lat, lng, name: placeName });
            setResult(null);
            setError(null);
            mapRef.current?.flyTo({
                center: [lng, lat],
                zoom: 18,
                duration: 2000,
            });
        },
        [],
    );

    const handleMapClick = useCallback((e: any) => {
        setSelectedLocation({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
            name: "Selected Map Location"
        });
        setResult(null);
        setError(null);
    }, []);

    /** Trigger the full analysis */
    const handleAnalyze = useCallback(async () => {
        if (!selectedLocation) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        const payload: AnalyzeRequest = { location: "irvine_ca", lat: selectedLocation!.lat, lng: selectedLocation!.lng };

        try {
            const res = await fetch(`${API_URL}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const detail = await res.json().catch(() => null);
                throw new Error(detail?.detail ?? `Server error (${res.status})`);
            }

            const data: AnalyzeResponse = await res.json();
            setResult(data);

            if (data.property_geojson) {
                const coords =
                    data.property_geojson.type === "Polygon"
                        ? (data.property_geojson.coordinates as number[][][])[0]
                        : (data.property_geojson.coordinates as number[][][][])[0][0];

                if (coords && coords.length > 0) {
                    const lngs = coords.map((c) => c[0]);
                    const lats = coords.map((c) => c[1]);

                    const minLng = Math.min(...lngs);
                    const maxLng = Math.max(...lngs);
                    const minLat = Math.min(...lats);
                    const maxLat = Math.max(...lats);

                    mapRef.current?.fitBounds(
                        [
                            [minLng - 0.0002, minLat - 0.0002],
                            [maxLng + 0.0002, maxLat + 0.0002],
                        ],
                        { duration: 1500 },
                    );

                    // Set initial ADU center to the centroid
                    setAduCenter({
                        lng: (minLng + maxLng) / 2,
                        lat: (minLat + maxLat) / 2
                    });
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation]);

    /** Reset everything */
    const handleReset = useCallback(() => {
        setSelectedLocation(null);
        setResult(null);
        setError(null);
        setAduCenter(null);
    }, []);

    /* ---------------------------------------------------------------- */
    /*  ADU Math & Validation                                           */
    /* ---------------------------------------------------------------- */

    const aduPolygon = useMemo(() => {
        if (!aduCenter) return null;

        // Area = W * L. AspectRatio = W / L -> W = AR * L
        // Area = AR * L^2 -> L = sqrt(Area / AR)
        const lengthFt = Math.sqrt(aduSize / aduAspectRatio);
        const widthFt = aduAspectRatio * lengthFt;

        // Add 0.0001 to avoid exact 0 rounding issues
        const FEET_TO_KM = 0.0003048;
        const lengthKm = lengthFt * FEET_TO_KM;
        const widthKm = widthFt * FEET_TO_KM;

        const pt = turf.point([aduCenter.lng, aduCenter.lat]);
        const halfW = widthKm / 2;
        const halfL = lengthKm / 2;

        try {
            // Compute 4 corners starting from center
            const n = turf.rhumbDestination(pt, halfL, 0);
            const s = turf.rhumbDestination(pt, halfL, 180);

            const nw = turf.rhumbDestination(n, halfW, -90);
            const ne = turf.rhumbDestination(n, halfW, 90);
            const se = turf.rhumbDestination(s, halfW, 90);
            const sw = turf.rhumbDestination(s, halfW, -90);

            let poly = turf.polygon([[
                nw.geometry.coordinates,
                ne.geometry.coordinates,
                se.geometry.coordinates,
                sw.geometry.coordinates,
                nw.geometry.coordinates
            ]]);

            if (aduRotation !== 0) {
                poly = turf.transformRotate(poly, aduRotation, { pivot: [aduCenter.lng, aduCenter.lat] });
            }

            return poly;
        } catch (e) {
            console.error("Failed to generate ADU polygon", e);
            return null;
        }
    }, [aduCenter, aduSize, aduAspectRatio, aduRotation]);

    useEffect(() => {
        if (!aduPolygon || !result?.buildable_zone_geojson) {
            setIsAduValid(true);
            return;
        }

        try {
            // Safe zone acts as the bounds. 
            // In Turf, booleanContains(container, inner)
            const safeZone = result.buildable_zone_geojson as unknown as GeoJSON.Feature | GeoJSON.Geometry;

            // Turf booleanContains requires polygons or multipolygons
            const isInside = turf.booleanContains(
                safeZone.type === "Feature" ? safeZone : turf.feature(safeZone as GeoJSON.Geometry),
                aduPolygon
            );

            setIsAduValid(isInside);
        } catch (e) {
            console.error("Validation error:", e);
            setIsAduValid(false);
        }
    }, [aduPolygon, result]);

    /* ---------------------------------------------------------------- */
    /*  Render                                                          */
    /* ---------------------------------------------------------------- */

    return (
        <div className="relative w-full h-full">
            <Map
                ref={mapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                    ...IRVINE_CENTER,
                    zoom: 15,
                    pitch: 0,
                    bearing: 0,
                }}
                maxZoom={22}
                mapStyle="mapbox://styles/mapbox/satellite-v9"
                style={{ width: "100%", height: "100%" }}
                attributionControl={false}
                onClick={handleMapClick}
                cursor="crosshair"
            >
                <NavigationControl position="bottom-right" />

                {/* Property Boundary — dashed indigo outline */}
                {propertyLayer && (
                    <Source
                        id="property-boundary"
                        type="geojson"
                        data={{
                            type: "FeatureCollection",
                            features: [propertyLayer],
                        }}
                    >
                        <Layer
                            id="property-fill"
                            type="fill"
                            paint={{
                                "fill-color": "#6366f1",
                                "fill-opacity": 0.08,
                            }}
                        />
                        <Layer
                            id="property-outline"
                            type="line"
                            paint={{
                                "line-color": "#818cf8",
                                "line-width": 2.5,
                                "line-dasharray": [3, 2],
                            }}
                        />
                    </Source>
                )}

                {/* Obstacles layer removed since backend no longer returns them. */}

                {/* Buildable Zone — glowing green */}
                {buildableLayer && (
                    <Source
                        id="buildable-zone"
                        type="geojson"
                        data={{
                            type: "FeatureCollection",
                            features: [buildableLayer],
                        }}
                    >
                        <Layer
                            id="buildable-fill"
                            type="fill"
                            paint={{
                                "fill-color": "#22c55e",
                                "fill-opacity": 0.3,
                            }}
                        />
                        <Layer
                            id="buildable-outline"
                            type="line"
                            paint={{
                                "line-color": "#22c55e",
                                "line-width": 2.5,
                            }}
                        />
                    </Source>
                )}
                {/* Dynamic ADU Polygon */}
                {aduPolygon && (
                    <Source
                        id="adu-polygon"
                        type="geojson"
                        data={{
                            type: "FeatureCollection",
                            features: [aduPolygon],
                        }}
                    >
                        <Layer
                            id="adu-fill"
                            type="fill"
                            paint={{
                                "fill-color": isAduValid ? "#3b82f6" : "#ef4444",
                                "fill-opacity": 0.5,
                            }}
                        />
                        <Layer
                            id="adu-outline"
                            type="line"
                            paint={{
                                "line-color": isAduValid ? "#2563eb" : "#dc2626",
                                "line-width": 3,
                            }}
                        />
                    </Source>
                )}

                {/* Draggable Marker for the ADU */}
                {aduCenter && (
                    <Marker
                        longitude={aduCenter.lng}
                        latitude={aduCenter.lat}
                        draggable
                        onDrag={(e) => setAduCenter({ lng: e.lngLat.lng, lat: e.lngLat.lat })}
                        anchor="center"
                    >
                        <div className="w-5 h-5 bg-white border-2 border-slate-800 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" />
                    </Marker>
                )}
            </Map>

            {/* Interactive ADU Control Panel */}
            {result && aduCenter && (
                <div className="absolute bottom-6 right-6 w-80 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700 p-5 text-slate-200 pointer-events-auto z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-white">ADU Designer</h3>
                        <div className={`px-2 py-1 rounded-md text-xs font-bold ${isAduValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isAduValid ? 'VALID' : 'INVALID PLACEMENT'}
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Size Slider */}
                        <div>
                            <div className="flex justify-between text-sm mb-1 text-slate-400">
                                <span>Size (Area)</span>
                                <span className="text-white font-mono">{aduSize} sq ft</span>
                            </div>
                            <input
                                type="range"
                                min="200"
                                max={result.max_adu_sqft || 1500}
                                step="50"
                                value={aduSize}
                                onChange={(e) => setAduSize(parseInt(e.target.value))}
                                className="w-full accent-indigo-500"
                            />
                        </div>

                        {/* Shape Slider */}
                        <div>
                            <div className="flex justify-between text-sm mb-1 text-slate-400">
                                <span>Shape</span>
                                <span>{aduAspectRatio === 1 ? 'Square' : aduAspectRatio > 1 ? 'Wide' : 'Tall'}</span>
                            </div>
                            <input
                                type="range"
                                min="0.3"
                                max="3.0"
                                step="0.1"
                                value={aduAspectRatio}
                                onChange={(e) => setAduAspectRatio(parseFloat(e.target.value))}
                                className="w-full accent-indigo-500"
                            />
                        </div>

                        {/* Rotation Slider */}
                        <div>
                            <div className="flex justify-between text-sm mb-1 text-slate-400">
                                <span>Rotation</span>
                                <span className="font-mono">{aduRotation}°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                step="5"
                                value={aduRotation}
                                onChange={(e) => setAduRotation(parseInt(e.target.value))}
                                className="w-full accent-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* HUD Overlay */}
            <ValidationHUD
                selectedLocation={selectedLocation}
                isLoading={isLoading}
                result={result}
                error={error}
                onAnalyze={handleAnalyze}
                onReset={handleReset}
            />

            {/* Address Search Bar */}
            <AddressSearch
                accessToken={MAPBOX_TOKEN}
                onResult={handleAddressResult}
            />
        </div>
    );
}
