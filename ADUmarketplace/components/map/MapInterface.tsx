"use client";

/**
 * MapInterface — Full-screen Mapbox satellite view with automated
 * ADU feasibility analysis. User searches an address, clicks "Analyze",
 * and the backend returns property boundary, obstacles, and buildable zone.
 */

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import * as turf from "@turf/turf";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import { Sparkles } from "lucide-react";

import ValidationHUD from "./ValidationHUD";
import AddressSearch from "./AddressSearch";
import DrawControls from "./DrawControls";

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

interface MapInterfaceProps {
    initialLocation?: { lat: number; lng: number; name: string };
}

export default function MapInterface({ initialLocation }: MapInterfaceProps) {
    const router = useRouter();
    const mapRef = useRef<MapRef | null>(null);

    // Location state (set by address search or initial prop)
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
        name: string;
    } | null>(initialLocation || null);

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

    // Custom Drag State for ADU Polygon
    const [isDraggingAdu, setIsDraggingAdu] = useState(false);
    const [lastDragPos, setLastDragPos] = useState<{ lng: number; lat: number } | null>(null);

    type ShapeType = 'rectangle' | 'l-shape' | 't-shape' | 'u-shape' | 'custom';
    const [aduShapeType, setAduShapeType] = useState<ShapeType>('rectangle');
    const [customBasePolygon, setCustomBasePolygon] = useState<GeoJSON.Polygon | null>(null);
    const [isDrawingCustom, setIsDrawingCustom] = useState<boolean>(false);
    const isDrawingCustomRef = useRef<boolean>(false);

    const startDrawingCustom = useCallback(() => {
        setIsDrawingCustom(true);
        isDrawingCustomRef.current = true;
    }, []);

    const stopDrawingCustom = useCallback(() => {
        setIsDrawingCustom(false);
        // Delay releasing the lock to prevent the final Mapbox GL click from bubbling
        setTimeout(() => { isDrawingCustomRef.current = false; }, 300);
    }, []);

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

    const handleDrawCreate = useCallback((e: { features: GeoJSON.Feature[] }) => {
        const feature = e.features[0];
        if (!feature || feature.geometry.type !== 'Polygon') return;

        stopDrawingCustom();

        // Calculate actual drawn area in square feet (1 sq m = 10.7639 sq ft)
        const areaSqM = turf.area(feature);
        const areaSqFt = areaSqM * 10.7639;

        // Determine allowed bounds
        const maxAllowed = result?.max_adu_sqft || 1200;
        const minAllowed = 200;

        // Clamp the drawn area to realistic ADU bounds
        let targetSize = Math.round(areaSqFt);
        if (targetSize > maxAllowed) targetSize = maxAllowed;
        if (targetSize < minAllowed) targetSize = minAllowed;

        // Automatically snap the slider/target to the area they actually drew
        setAduSize(targetSize);

        // Calculate centroid to center the polygon at aduCenter offset
        const centroid = turf.centroid(feature);
        const centerLng = centroid.geometry.coordinates[0];
        const centerLat = centroid.geometry.coordinates[1];

        setCustomBasePolygon(feature.geometry);
        setAduCenter({ lng: centerLng, lat: centerLat });
    }, [result, stopDrawingCustom]);

    const handleMapClick = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
        // Prevent map clicks from resetting the property if we are currently drawing a custom ADU
        if (isDrawingCustom || isDrawingCustomRef.current) return;

        // Don't reset if the user just clicked/dragged the ADU shape itself
        if (isDraggingAdu || lastDragPos) return;

        // If we already have an active property analysis, ignore stray map clicks.
        // Users should use the explicit "Start Over" button in the HUD to clear state.
        if (result) return;

        setSelectedLocation({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
            name: "Selected Map Location"
        });
        setResult(null);
        setError(null);
    }, [isDrawingCustom, isDraggingAdu, lastDragPos, result]);

    /* ---------------------------------------------------------------- */
    /*  ADU Drag Handlers                                               */
    /* ---------------------------------------------------------------- */

    const onAduEnter = useCallback(() => {
        if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = 'move';
        }
    }, []);

    const onAduLeave = useCallback(() => {
        if (mapRef.current && !isDraggingAdu) {
            mapRef.current.getCanvas().style.cursor = '';
        }
    }, [isDraggingAdu]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAduMouseDown = useCallback((e: { features?: any[], preventDefault: () => void, lngLat: { lng: number; lat: number } }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feature = e.features?.[0] as any;
        if (feature?.layer?.id === 'adu-fill') {
            e.preventDefault();
            setIsDraggingAdu(true);
            setLastDragPos({ lng: e.lngLat.lng, lat: e.lngLat.lat });
            if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = 'grabbing';
                // Disable map panning while dragging ADU
                const map = mapRef.current.getMap();
                if (map && map.dragPan) map.dragPan.disable();
            }
        }
    }, []);

    const onMapMouseMove = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
        if (!isDraggingAdu || !lastDragPos || !aduCenter) return;

        const deltaLng = e.lngLat.lng - lastDragPos.lng;
        const deltaLat = e.lngLat.lat - lastDragPos.lat;

        setAduCenter({
            lng: aduCenter.lng + deltaLng,
            lat: aduCenter.lat + deltaLat,
        });
        setLastDragPos({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    }, [isDraggingAdu, lastDragPos, aduCenter]);

    const onMapMouseUp = useCallback(() => {
        if (isDraggingAdu) {
            setIsDraggingAdu(false);
            setLastDragPos(null);
            if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = '';
                const map = mapRef.current.getMap();
                if (map && map.dragPan) map.dragPan.enable();
            }
        }
    }, [isDraggingAdu]);

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

    // Auto-trigger analysis if loaded with initialLocation
    useEffect(() => {
        if (initialLocation && !result && !isLoading && !error) {
            handleAnalyze();
        }
    }, [initialLocation, result, isLoading, error, handleAnalyze]);

    const handleReset = useCallback(() => {
        setSelectedLocation(null);
        setResult(null);
        setError(null);
        setAduCenter(null);
        setAduShapeType('rectangle');
        setCustomBasePolygon(null);
        setIsDrawingCustom(false);
        isDrawingCustomRef.current = false;
    }, []);

    /* ---------------------------------------------------------------- */
    /*  ADU Math & Validation                                           */
    /* ---------------------------------------------------------------- */

    const aduPolygon = useMemo(() => {
        if (!aduCenter) return null;
        if (isDrawingCustom) return null; // Hide the active ADU block while drawing a custom shape

        let basePoly: Feature<Polygon | MultiPolygon>;

        if (aduShapeType === 'custom') {
            if (!customBasePolygon) return null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            basePoly = turf.feature(customBasePolygon as Polygon) as any;
            // Translate the custom polygon so its original centroid matches the current draggable aduCenter
            const centroid = turf.centroid(basePoly);
            const distance = turf.distance(centroid, turf.point([aduCenter.lng, aduCenter.lat]));
            const bearing = turf.bearing(centroid, turf.point([aduCenter.lng, aduCenter.lat]));
            if (distance > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                basePoly = turf.transformTranslate(basePoly, distance, bearing) as any;
            }
        } else {
            // Build base shapes at abstract origin [0, 0] proportional to Aspect Ratio
            const W = aduAspectRatio;
            const L = 1.0;
            const tX = W * 0.35; // 35% thickness for arms
            const tY = L * 0.35;

            let coords: number[][] = [];

            if (aduShapeType === 'rectangle') {
                coords = [
                    [-W / 2, L / 2], [-W / 2, -L / 2], [W / 2, -L / 2], [W / 2, L / 2], [-W / 2, L / 2]
                ];
            } else if (aduShapeType === 'l-shape') {
                coords = [
                    [-W / 2, L / 2], [-W / 2, -L / 2], [W / 2, -L / 2], [W / 2, -L / 2 + tY],
                    [-W / 2 + tX, -L / 2 + tY], [-W / 2 + tX, L / 2], [-W / 2, L / 2]
                ];
            } else if (aduShapeType === 't-shape') {
                coords = [
                    [-W / 2, L / 2], [-W / 2, L / 2 - tY], [-(tX / 2), L / 2 - tY], [-(tX / 2), -L / 2],
                    [(tX / 2), -L / 2], [(tX / 2), L / 2 - tY], [W / 2, L / 2 - tY], [W / 2, L / 2], [-W / 2, L / 2]
                ];
            } else if (aduShapeType === 'u-shape') {
                coords = [
                    [-W / 2, L / 2], [-W / 2, -L / 2], [W / 2, -L / 2], [W / 2, L / 2],
                    [W / 2 - tX, L / 2], [W / 2 - tX, -L / 2 + tY], [-W / 2 + tX, -L / 2 + tY],
                    [-W / 2 + tX, L / 2], [-W / 2, L / 2]
                ];
            }

            // Convert abstract proportional coords to real lat/lng around the aduCenter
            const m = 10; // arbitrary local scale
            const DEG_PER_METER_LAT = 1 / 111111;
            const DEG_PER_METER_LNG = 1 / (111111 * Math.cos(aduCenter.lat * Math.PI / 180));

            const realCoords = coords.map(p => [
                aduCenter.lng + p[0] * m * DEG_PER_METER_LNG,
                aduCenter.lat + p[1] * m * DEG_PER_METER_LAT
            ]);
            basePoly = turf.polygon([realCoords]);
        }

        try {
            // Target Area in Square Meters (1 sq ft = 0.092903 sq m)
            const targetAreaSqM = aduSize * 0.09290304;
            const currentAreaSqM = turf.area(basePoly);
            const scaleFactor = Math.sqrt(targetAreaSqM / currentAreaSqM);

            // Auto-Scale it to fit the exact slider Area
            let finalPoly = turf.transformScale(basePoly, scaleFactor);

            // Apply Slider Rotation
            if (aduRotation !== 0) {
                finalPoly = turf.transformRotate(finalPoly, aduRotation, { pivot: [aduCenter.lng, aduCenter.lat] });
            }

            return finalPoly.geometry as GeoJSON.Polygon;
        } catch (e: unknown) {
            console.error("Failed to generate ADU polygon", e);
            return null;
        }
    }, [aduCenter, aduSize, aduAspectRatio, aduRotation, aduShapeType, customBasePolygon, isDrawingCustom]);

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
        } catch (e: unknown) {
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
                onMouseDown={onAduMouseDown}
                onMouseMove={onMapMouseMove}
                onMouseUp={onMapMouseUp}
                cursor={isDrawingCustom ? "crosshair" : "auto"}
                interactiveLayerIds={buildableLayer ? ['adu-fill'] : undefined}
                onMouseEnter={onAduEnter}
                onMouseLeave={onAduLeave}
            >
                <NavigationControl position="top-right" />

                {/* Custom Drawing Tools */}
                {isDrawingCustom && (
                    <DrawControls
                        position="top-right"
                        displayControlsDefault={false}
                        controls={{
                            polygon: true,
                            trash: true,
                        }}
                        defaultMode="draw_polygon"
                        onCreate={handleDrawCreate}
                        onUpdate={() => { }}
                        onDelete={() => { }}
                    />
                )}

                {/* Property Boundary — Soft white glow */}
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
                                "fill-color": "#ffffff",
                                "fill-opacity": 0.03,
                            }}
                        />
                        <Layer
                            id="property-outline"
                            type="line"
                            paint={{
                                "line-color": "#000000",
                                "line-width": 1.5,
                                "line-dasharray": [6, 4],
                                "line-opacity": 0.4,
                            }}
                        />
                    </Source>
                )}

                {/* Buildable Zone — soft lavender glow */}
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
                                "fill-color": "#10b981", // Emerald-500
                                "fill-opacity": 0.12,
                            }}
                        />
                        <Layer
                            id="buildable-outline"
                            type="line"
                            paint={{
                                "line-color": "#10b981",
                                "line-width": 2,
                                "line-opacity": 0.6,
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
                            features: [{
                                type: "Feature",
                                properties: {},
                                geometry: aduPolygon
                            }],
                        }}
                    >
                        <Layer
                            id="adu-fill"
                            type="fill"
                            paint={{
                                "fill-color": isAduValid ? "#10b981" : "#F43F5E", // Emerald vs Rose
                                "fill-opacity": 0.7,
                            }}
                        />
                        <Layer
                            id="adu-outline"
                            type="line"
                            paint={{
                                "line-color": isAduValid ? "#059669" : "#FB7185",
                                "line-width": 2,
                            }}
                        />
                    </Source>
                )}
            </Map>

            {/* Drawing State Overlay */}
            {isDrawingCustom && (
                <div className="absolute bottom-10 right-10 w-80 bg-white shadow-xl ring-1 ring-slate-900/5 rounded-xl p-5 text-center pointer-events-auto z-10 animate-in fade-in slide-in-from-bottom-5">
                    <h2 className="text-xl font-extrabold tracking-normal text-slate-800 leading-tight mb-1">Custom ADU Canvas</h2>
                    <p className="text-sm text-slate-500 mb-4 px-2">Click to place points. Max area: {result?.max_adu_sqft || 1200} sq ft (scaled automatically).</p>
                    <button
                        onClick={() => {
                            if (!customBasePolygon) {
                                setAduShapeType('rectangle');
                            }
                            stopDrawingCustom();
                        }}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                    >
                        Cancel Sketch
                    </button>
                </div>
            )}

            {/* Interactive ADU Control Panel */}
            {result && aduCenter && !isDrawingCustom && (
                <div className="absolute bottom-10 right-10 w-80 bg-white shadow-xl ring-1 ring-slate-900/5 rounded-xl p-5 text-slate-800 pointer-events-auto z-10 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-extrabold tracking-normal text-slate-800 leading-tight">ADU Designer</h2>
                        <button
                            disabled={!isAduValid}
                            onClick={() => {
                                const params = new URLSearchParams({
                                    fromMap: "1",
                                    aduSize: String(aduSize),
                                    aduShape: aduShapeType,
                                    setback: String(result?.setback_ft ?? 4),
                                    propertyArea: String(result?.property_area_sqft ?? 0),
                                    buildableArea: String(result?.buildable_area_sqft ?? 0),
                                    maxAduSqft: String(result?.max_adu_sqft ?? 1200),
                                });
                                if (selectedLocation) {
                                    params.set("address", selectedLocation.name);
                                    params.set("lat", String(selectedLocation.lat));
                                    params.set("lng", String(selectedLocation.lng));
                                }
                                if (result?.apn) params.set("apn", result.apn);
                                router.push(`/adu-chat?${params}`);
                            }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md ${isAduValid ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 ring-emerald-400/50 cursor-pointer duration-300' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
                        >
                            {isAduValid ? (
                                <>
                                    <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse" />
                                    Plan with AI Advisor
                                </>
                            ) : (
                                '⨯ Invalid'
                            )}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Shape Selector */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Modular Profiles</p>
                            <div className="grid grid-cols-5 p-1 bg-slate-50 rounded-2xl border border-slate-200">
                                {['rectangle', 'l-shape', 't-shape', 'u-shape'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setAduShapeType(type as ShapeType);
                                            stopDrawingCustom();
                                        }}
                                        className={`py-2 flex items-center justify-center rounded-xl transition-all cursor-pointer
                                            ${aduShapeType === type ? 'bg-white text-emerald-600 shadow-sm border border-slate-200 ring-1 ring-slate-900/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                    >
                                        <span className="text-base">
                                            {type === 'rectangle' ? '█' :
                                                type === 'l-shape' ? '▛' :
                                                    type === 't-shape' ? '┳' : '⨆'}
                                        </span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setAduShapeType('custom');
                                        startDrawingCustom();
                                    }}
                                    className={`py-2 flex items-center justify-center rounded-xl transition-all cursor-pointer
                                        ${aduShapeType === 'custom' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200 ring-1 ring-slate-900/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <span className="text-base">✎</span>
                                </button>
                            </div>
                        </div>

                        {/* Size Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Floor Area</p>
                                <span className="text-sm font-bold text-slate-800 tabular-nums">{aduSize} <span className="text-[10px] font-normal text-slate-500">ft²</span></span>
                            </div>
                            <input
                                type="range"
                                min="200"
                                max={result.max_adu_sqft || 1500}
                                step="1"
                                value={aduSize}
                                onChange={(e) => setAduSize(parseInt(e.target.value))}
                                className="w-full h-[3px] bg-slate-200 rounded-full cursor-pointer appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                            />
                        </div>

                        {/* Shape Aspect Ratio Slider */}
                        <div className={`space-y-3 transition-opacity ${aduShapeType === 'custom' ? 'opacity-30 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dimensions</p>
                                {aduShapeType !== 'custom' && (
                                    <span className="text-xs font-semibold text-slate-800">
                                        {aduShapeType === 'rectangle'
                                            ? (aduAspectRatio === 1 ? 'Square' : aduAspectRatio > 1 ? 'Wide' : 'Tall')
                                            : (aduAspectRatio === 1 ? 'Balanced' : aduAspectRatio > 1 ? 'Extended' : 'Deep')}
                                    </span>
                                )}
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={Math.max(1, Math.min(100, (aduAspectRatio - 0.3) / 2.7 * 99 + 1))}
                                onChange={(e) => {
                                    const rawVal = parseInt(e.target.value);
                                    // Map 1-100 back to 0.3-3.0 range
                                    setAduAspectRatio(0.3 + ((rawVal - 1) / 99) * 2.7);
                                }}
                                disabled={aduShapeType === 'custom'}
                                className="w-full h-[3px] bg-slate-200 rounded-full cursor-pointer appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all disabled:opacity-50"
                            />
                        </div>

                        {/* Rotation Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Orientation</p>
                                <span className="text-sm font-bold text-slate-800 tabular-nums">{aduRotation}°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                step="1"
                                value={aduRotation}
                                onChange={(e) => setAduRotation(parseInt(e.target.value))}
                                className="w-full h-[3px] bg-slate-200 rounded-full cursor-pointer appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
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
