"use client";

/**
 * MapInterface — Full-screen Mapbox satellite view with automated
 * ADU feasibility analysis. User searches an address, clicks "Analyze",
 * and the backend returns property boundary, obstacles, and buildable zone.
 */

import { useRef, useState, useCallback } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";

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

export default function MapInterface() {
    const mapRef = useRef<MapRef | null>(null);

    // Location state (set by address search)
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
        name: string;
    } | null>(null);

    // Drawing state
    const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Feature<GeoJSON.Polygon> | null>(null);

    // Analysis state
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalyzeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            setDrawnPolygon(null);
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

    const onDrawUpdate = useCallback((e: { features: GeoJSON.Feature[] }) => {
        console.log("Draw Event fired:", e);
        // We only allow polygons. Grab the first one drawn.
        const feature = e.features.find((f) => f.geometry.type === "Polygon") as GeoJSON.Feature<GeoJSON.Polygon> | undefined;
        console.log("Extracted Polygon Feature:", feature);
        setDrawnPolygon(feature || null);
        setResult(null); // Clear previous results when drawing
    }, []);

    const onDrawDelete = useCallback(() => {
        setDrawnPolygon(null);
        setResult(null);
    }, []);

    /** Trigger the full analysis */
    const handleAnalyze = useCallback(async () => {
        console.log("Analyze clicked!");
        console.log("Location:", selectedLocation);
        console.log("Boundary:", drawnPolygon);

        if (!drawnPolygon) {
            console.warn("Missing required state to run analysis", {
                hasPolygon: !!drawnPolygon
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        const payload: AnalyzeRequest = {
            user_drawn_geojson: drawnPolygon.geometry as any, // Cast to match GeoJSONGeometry interface
            location: "irvine_ca",
        };

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

            // Fit map to the property boundary
            if (data.property_geojson) {
                const coords =
                    data.property_geojson.type === "Polygon"
                        ? (data.property_geojson.coordinates as number[][][])[0]
                        : (data.property_geojson.coordinates as number[][][][])[0][0];

                if (coords && coords.length > 0) {
                    const lngs = coords.map((c) => c[0]);
                    const lats = coords.map((c) => c[1]);
                    mapRef.current?.fitBounds(
                        [
                            [Math.min(...lngs) - 0.0002, Math.min(...lats) - 0.0002],
                            [Math.max(...lngs) + 0.0002, Math.max(...lats) + 0.0002],
                        ],
                        { duration: 1500 },
                    );
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, drawnPolygon]);

    /** Reset everything */
    const handleReset = useCallback(() => {
        setSelectedLocation(null);
        setDrawnPolygon(null);
        setResult(null);
        setError(null);
    }, []);

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
            >
                <NavigationControl position="bottom-right" />

                {/* Drawing Tools */}
                <DrawControls
                    position="top-right"
                    displayControlsDefault={false}
                    controls={{
                        polygon: true,
                        trash: true,
                    }}
                    defaultMode="draw_polygon"
                    onCreate={onDrawUpdate}
                    onUpdate={onDrawUpdate}
                    onDelete={onDrawDelete}
                />

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

                {/* Obstacles — semi-transparent red */}
                {obstacleFeatures.length > 0 && (
                    <Source
                        id="obstacles"
                        type="geojson"
                        data={{
                            type: "FeatureCollection",
                            features: obstacleFeatures,
                        }}
                    >
                        <Layer
                            id="obstacles-fill"
                            type="fill"
                            paint={{
                                "fill-color": "#ef4444",
                                "fill-opacity": 0.35,
                            }}
                        />
                        <Layer
                            id="obstacles-outline"
                            type="line"
                            paint={{
                                "line-color": "#ef4444",
                                "line-width": 1.5,
                            }}
                        />
                    </Source>
                )}

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
            </Map>

            {/* HUD Overlay */}
            <ValidationHUD
                selectedLocation={selectedLocation}
                hasDrawnBoundary={!!drawnPolygon}
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
